import WebSocket from 'ws';
import http from 'http';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  SignalingMessage,
  SignalingMessageType,
  CallSession,
  Participant,
  CallOffer,
  CallAnswer,
  CallTransfer,
  CallReaction
} from '@brandbond/shared';

export class SignalingServer extends EventEmitter {
  private wss: WebSocket.Server;
  private sessions: Map<string, CallSession> = new Map();
  private participants: Map<string, WebSocket> = new Map();
  private participantSessions: Map<string, string> = new Map(); // participantId -> sessionId

  constructor(port: number = 3001) {
    super();
    
    const server = http.createServer();
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', this.handleConnection.bind(this));
    
    server.listen(port, () => {
      console.log(`Signaling server running on port ${port}`);
    });
  }

  private handleConnection(ws: WebSocket, request: http.IncomingMessage) {
    let participantId: string | null = null;
    
    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const message: SignalingMessage = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error handling message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      if (participantId) {
        this.handleParticipantDisconnect(participantId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (participantId) {
        this.handleParticipantDisconnect(participantId);
      }
    });
  }

  private async handleMessage(ws: WebSocket, message: SignalingMessage) {
    switch (message.type) {
      case SignalingMessageType.SESSION_CREATE:
        await this.handleSessionCreate(ws, message);
        break;
      case SignalingMessageType.SESSION_JOIN:
        await this.handleSessionJoin(ws, message);
        break;
      case SignalingMessageType.SESSION_LEAVE:
        await this.handleSessionLeave(ws, message);
        break;
      case SignalingMessageType.OFFER:
        await this.handleOffer(ws, message);
        break;
      case SignalingMessageType.ANSWER:
        await this.handleAnswer(ws, message);
        break;
      case SignalingMessageType.ICE_CANDIDATE:
        await this.handleIceCandidate(ws, message);
        break;
      case SignalingMessageType.TRACK_ADD:
        await this.handleTrackAdd(ws, message);
        break;
      case SignalingMessageType.TRACK_REMOVE:
        await this.handleTrackRemove(ws, message);
        break;
      case SignalingMessageType.MUTE:
      case SignalingMessageType.UNMUTE:
        await this.handleMuteToggle(ws, message);
        break;
      case SignalingMessageType.VIDEO_ENABLE:
      case SignalingMessageType.VIDEO_DISABLE:
        await this.handleVideoToggle(ws, message);
        break;
      case SignalingMessageType.SCREEN_SHARE_START:
      case SignalingMessageType.SCREEN_SHARE_STOP:
        await this.handleScreenShareToggle(ws, message);
        break;
      case SignalingMessageType.TRANSFER_REQUEST:
        await this.handleTransferRequest(ws, message);
        break;
      case SignalingMessageType.REACTION:
        await this.handleReaction(ws, message);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private async handleSessionCreate(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, type, maxParticipants, metadata } = message.payload;
    
    if (this.sessions.has(sessionId)) {
      this.sendError(ws, 'Session already exists');
      return;
    }

    const session: CallSession = {
      id: sessionId,
      type,
      participants: [],
      maxParticipants: maxParticipants || 10,
      isRecording: false,
      createdAt: new Date(),
      metadata: metadata || {}
    };

    this.sessions.set(sessionId, session);
    this.emit('session:created', session);
    
    this.sendSuccess(ws, { sessionId, message: 'Session created successfully' });
  }

  private async handleSessionJoin(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, participant } = message.payload;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    if (session.participants.length >= session.maxParticipants) {
      this.sendError(ws, 'Session is full');
      return;
    }

    // Add participant to session
    const newParticipant: Participant = {
      ...participant,
      joinTime: new Date(),
      lastSeen: new Date()
    };

    session.participants.push(newParticipant);
    this.participants.set(participant.id, ws);
    this.participantSessions.set(participant.id, sessionId);

    // Notify all participants in the session
    this.broadcastToSession(sessionId, {
      type: SignalingMessageType.SESSION_UPDATE,
      sessionId,
      timestamp: Date.now(),
      payload: { participants: session.participants }
    });

    this.emit('participant:joined', { sessionId, participant: newParticipant });
    this.sendSuccess(ws, { sessionId, message: 'Joined session successfully' });
  }

  private async handleSessionLeave(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, participantId } = message.payload;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    const participantIndex = session.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) {
      this.sendError(ws, 'Participant not found in session');
      return;
    }

    const participant = session.participants[participantIndex];
    session.participants.splice(participantIndex, 1);
    
    this.participants.delete(participantId);
    this.participantSessions.delete(participantId);

    // Notify remaining participants
    this.broadcastToSession(sessionId, {
      type: SignalingMessageType.SESSION_UPDATE,
      sessionId,
      timestamp: Date.now(),
      payload: { participants: session.participants }
    });

    // If session is empty, remove it
    if (session.participants.length === 0) {
      this.sessions.delete(sessionId);
      this.emit('session:ended', sessionId);
    }

    this.emit('participant:left', { sessionId, participant });
    this.sendSuccess(ws, { message: 'Left session successfully' });
  }

  private async handleOffer(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, participantId } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    // Forward offer to other participants in the session
    this.broadcastToSession(sessionId, message, participantId ? [participantId] : []);
  }

  private async handleAnswer(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, participantId } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    // Forward answer to other participants in the session
    this.broadcastToSession(sessionId, message, participantId ? [participantId] : []);
  }

  private async handleIceCandidate(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, participantId } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    // Forward ICE candidate to other participants in the session
    this.broadcastToSession(sessionId, message, participantId ? [participantId] : []);
  }

  private async handleTrackAdd(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, participantId } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    // Forward track add to other participants
    this.broadcastToSession(sessionId, message, participantId ? [participantId] : []);
  }

  private async handleTrackRemove(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, participantId } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    // Forward track remove to other participants
    this.broadcastToSession(sessionId, message, participantId ? [participantId] : []);
  }

  private async handleMuteToggle(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, participantId } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) {
      this.sendError(ws, 'Participant not found');
      return;
    }

    participant.isMuted = message.type === SignalingMessageType.MUTE;
    participant.lastSeen = new Date();

    // Forward mute/unmute to other participants
    this.broadcastToSession(sessionId, message, participantId ? [participantId] : []);
  }

  private async handleVideoToggle(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, participantId } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) {
      this.sendError(ws, 'Participant not found');
      return;
    }

    participant.isVideoEnabled = message.type === SignalingMessageType.VIDEO_ENABLE;
    participant.lastSeen = new Date();

    // Forward video toggle to other participants
    this.broadcastToSession(sessionId, message, participantId ? [participantId] : []);
  }

  private async handleScreenShareToggle(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, participantId } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) {
      this.sendError(ws, 'Participant not found');
      return;
    }

    participant.isScreenSharing = message.type === SignalingMessageType.SCREEN_SHARE_START;
    participant.lastSeen = new Date();

    // Forward screen share toggle to other participants
    this.broadcastToSession(sessionId, message, participantId ? [participantId] : []);
  }

  private async handleTransferRequest(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, fromParticipantId, toParticipantId, transferType } = message.payload;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    // Find target participant
    const targetParticipant = session.participants.find(p => p.id === toParticipantId);
    if (!targetParticipant) {
      this.sendError(ws, 'Target participant not found');
      return;
    }

    // Send transfer request to target participant
    const targetWs = this.participants.get(toParticipantId);
    if (targetWs) {
      targetWs.send(JSON.stringify({
        type: SignalingMessageType.TRANSFER_REQUEST,
        sessionId,
        timestamp: Date.now(),
        payload: {
          fromParticipantId,
          transferType,
          sessionId,
          metadata: message.payload.metadata
        }
      }));
    }

    this.emit('transfer:requested', { sessionId, fromParticipantId, toParticipantId, transferType });
  }

  private async handleReaction(ws: WebSocket, message: SignalingMessage) {
    const { sessionId, participantId } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    // Forward reaction to other participants
    this.broadcastToSession(sessionId, message, participantId ? [participantId] : []);
  }

  private handleParticipantDisconnect(participantId: string) {
    const sessionId = this.participantSessions.get(participantId);
    if (sessionId) {
      this.handleSessionLeave(null as any, {
        type: SignalingMessageType.SESSION_LEAVE,
        sessionId,
        participantId,
        timestamp: Date.now(),
        payload: {}
      });
    }
  }

  private broadcastToSession(sessionId: string, message: any, excludeParticipantIds: string[] = []) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.participants.forEach(participant => {
      if (excludeParticipantIds.includes(participant.id)) return;
      
      const ws = this.participants.get(participant.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  private sendSuccess(ws: WebSocket, data: any) {
    ws.send(JSON.stringify({
      type: 'success',
      timestamp: Date.now(),
      payload: data
    }));
  }

  private sendError(ws: WebSocket, error: string) {
    ws.send(JSON.stringify({
      type: SignalingMessageType.ERROR,
      timestamp: Date.now(),
      payload: { error }
    }));
  }

  // Public methods for external access
  public getSession(sessionId: string): CallSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getParticipant(participantId: string): Participant | undefined {
    const sessionId = this.participantSessions.get(participantId);
    if (!sessionId) return undefined;
    
    const session = this.sessions.get(sessionId);
    return session?.participants.find(p => p.id === participantId);
  }

  public getActiveSessions(): CallSession[] {
    return Array.from(this.sessions.values());
  }

  public getActiveParticipants(): Participant[] {
    return Array.from(this.participants.keys()).map(id => this.getParticipant(id)).filter(Boolean) as Participant[];
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new SignalingServer(3001);
  
  server.on('session:created', (session) => {
    console.log(`Session created: ${session.id} (${session.type})`);
  });
  
  server.on('participant:joined', ({ sessionId, participant }) => {
    console.log(`Participant ${participant.name} joined session ${sessionId}`);
  });
  
  server.on('participant:left', ({ sessionId, participant }) => {
    console.log(`Participant ${participant.name} left session ${sessionId}`);
  });
  
  server.on('session:ended', (sessionId) => {
    console.log(`Session ended: ${sessionId}`);
  });
}
