import { EventEmitter } from 'events';
import { createSocket, Socket } from 'dgram';
import { 
  MediaTrack, 
  EncodingLayer, 
  SFUSubscription, 
  BandwidthEstimate,
  QualityMetrics 
} from '@brandbond/shared';

interface RTPPacket {
  header: RTPHeader;
  payload: Buffer;
}

interface RTPHeader {
  version: number;
  padding: boolean;
  extension: boolean;
  csrcCount: number;
  marker: boolean;
  payloadType: number;
  sequenceNumber: number;
  timestamp: number;
  ssrc: number;
  csrc: number[];
}

interface RTCPPacket {
  type: number;
  ssrc: number;
  payload: Buffer;
}

export class SFU extends EventEmitter {
  private udpSocket: Socket;
  private port: number;
  private tracks: Map<string, MediaTrack> = new Map();
  private subscriptions: Map<string, SFUSubscription[]> = new Map(); // participantId -> subscriptions
  private bandwidthEstimates: Map<string, BandwidthEstimate> = new Map();
  private qualityMetrics: Map<string, QualityMetrics> = new Map();
  private rtpBuffers: Map<string, RTPPacket[]> = new Map();
  private rtcpBuffers: Map<string, RTCPPacket[]> = new Map();

  constructor(port: number = 5000) {
    super();
    this.port = port;
    this.udpSocket = createSocket('udp4');
    this.setupUDPHandling();
  }

  private setupUDPHandling() {
    this.udpSocket.on('message', (msg, rinfo) => {
      this.handleUDPMessage(msg, rinfo);
    });

    this.udpSocket.on('error', (error) => {
      console.error('UDP socket error:', error);
      this.emit('error', error);
    });

    this.udpSocket.bind(this.port, () => {
      console.log(`SFU listening on port ${this.port}`);
      this.emit('ready');
    });
  }

  private handleUDPMessage(msg: Buffer, rinfo: any) {
    try {
      if (this.isRTPPacket(msg)) {
        this.handleRTPPacket(msg, rinfo);
      } else if (this.isRTCPPacket(msg)) {
        this.handleRTCPPacket(msg, rinfo);
      }
    } catch (error) {
      console.error('Error handling UDP message:', error);
    }
  }

  private isRTPPacket(data: Buffer): boolean {
    // RTP version 2 check
    return (data[0] & 0xC0) === 0x80;
  }

  private isRTCPPacket(data: Buffer): boolean {
    // RTCP packet type check
    const packetType = data[1];
    return packetType >= 200 && packetType <= 204;
  }

  private handleRTPPacket(data: Buffer, rinfo: any) {
    const rtpPacket = this.parseRTPPacket(data);
    const trackId = this.findTrackBySSRC(rtpPacket.header.ssrc);
    
    if (!trackId) {
      console.warn(`Received RTP packet for unknown SSRC: ${rtpPacket.header.ssrc}`);
      return;
    }

    // Store packet in buffer for potential retransmission
    this.bufferRTPPacket(trackId, rtpPacket);

    // Forward to subscribers
    this.forwardRTPPacket(trackId, rtpPacket, rinfo);
  }

  private handleRTCPPacket(data: Buffer, rinfo: any) {
    const rtcpPacket = this.parseRTCPPacket(data);
    
    // Process RTCP feedback
    this.processRTCPFeedback(rtcpPacket, rinfo);
    
    // Forward RTCP to relevant participants
    this.forwardRTCPPacket(rtcpPacket, rinfo);
  }

  private parseRTPPacket(data: Buffer): RTPPacket {
    const header: RTPHeader = {
      version: (data[0] & 0xC0) >> 6,
      padding: (data[0] & 0x20) !== 0,
      extension: (data[0] & 0x10) !== 0,
      csrcCount: data[0] & 0x0F,
      marker: (data[1] & 0x80) !== 0,
      payloadType: data[1] & 0x7F,
      sequenceNumber: data.readUInt16BE(2),
      timestamp: data.readUInt32BE(4),
      ssrc: data.readUInt32BE(8),
      csrc: []
    };

    let offset = 12;
    
    // Read CSRC list
    for (let i = 0; i < header.csrcCount; i++) {
      header.csrc.push(data.readUInt32BE(offset));
      offset += 4;
    }

    // Handle RTP extension header
    if (header.extension) {
      const extLen = data.readUInt16BE(offset + 2);
      offset += 4 + extLen * 4;
    }

    const payload = data.slice(offset);

    return { header, payload };
  }

  private parseRTCPPacket(data: Buffer): RTCPPacket {
    const packetType = data[1];
    const ssrc = data.readUInt32BE(4);
    const payload = data.slice(8);

    return { type: packetType, ssrc, payload };
  }

  private findTrackBySSRC(ssrc: number): string | null {
    for (const [trackId, track] of this.tracks) {
      if (track.ssrc === ssrc) {
        return trackId;
      }
      // Check encoding layers
      for (const layer of track.encodingLayers) {
        if (layer.ssrc === ssrc) {
          return trackId;
        }
      }
    }
    return null;
  }

  private bufferRTPPacket(trackId: string, packet: RTPPacket) {
    if (!this.rtpBuffers.has(trackId)) {
      this.rtpBuffers.set(trackId, []);
    }

    const buffer = this.rtpBuffers.get(trackId)!;
    buffer.push(packet);

    // Keep only last 100 packets per track
    if (buffer.length > 100) {
      buffer.shift();
    }
  }

  private forwardRTPPacket(trackId: string, packet: RTPPacket, rinfo: any) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    // Get all subscriptions for this track
    const allSubscriptions = Array.from(this.subscriptions.values()).flat();
    const trackSubscriptions = allSubscriptions.filter(sub => sub.trackId === trackId);

    for (const subscription of trackSubscriptions) {
      const participantId = this.findParticipantBySubscription(subscription);
      if (!participantId) continue;

      // Check if this subscription should receive this encoding layer
      if (subscription.encodingLayerId) {
        const layer = track.encodingLayers.find(l => l.id === subscription.encodingLayerId);
        if (!layer || layer.ssrc !== packet.header.ssrc) {
          continue;
        }
      }

      // Apply bandwidth and quality constraints
      if (this.shouldForwardPacket(subscription, packet)) {
        this.sendRTPPacket(participantId, packet, rinfo);
      }
    }
  }

  private shouldForwardPacket(subscription: SFUSubscription, packet: RTPPacket): boolean {
    // Check bandwidth constraints
    const estimate = this.bandwidthEstimates.get(subscription.participantId);
    if (estimate && estimate.availableBandwidth < subscription.maxBitrate) {
      return false;
    }

    // Check quality constraints
    const metrics = this.qualityMetrics.get(subscription.participantId);
    if (metrics?.videoMetrics) {
      if (metrics.videoMetrics.packetLoss > 0.1) { // 10% packet loss threshold
        return false;
      }
    }

    return true;
  }

  private findParticipantBySubscription(subscription: SFUSubscription): string | null {
    for (const [participantId, subs] of this.subscriptions) {
      if (subs.some(sub => sub.trackId === subscription.trackId)) {
        return participantId;
      }
    }
    return null;
  }

  private sendRTPPacket(participantId: string, packet: RTPPacket, rinfo: any) {
    // In a real implementation, this would send to the participant's endpoint
    // For now, we'll emit an event that can be handled by the signaling layer
    this.emit('rtp:forward', {
      participantId,
      packet,
      sourceRinfo: rinfo
    });
  }

  private processRTCPFeedback(rtcpPacket: RTCPPacket, rinfo: any) {
    switch (rtcpPacket.type) {
      case 200: // Sender Report (SR)
        this.handleSenderReport(rtcpPacket, rinfo);
        break;
      case 201: // Receiver Report (RR)
        this.handleReceiverReport(rtcpPacket, rinfo);
        break;
      case 205: // Application-Defined (APP)
        this.handleApplicationDefined(rtcpPacket, rinfo);
        break;
      default:
        // Handle other RTCP packet types
        break;
    }
  }

  private handleSenderReport(rtcpPacket: RTCPPacket, rinfo: any) {
    // Extract timing information for bandwidth estimation
    const ntpTimestamp = rtcpPacket.payload.readUInt32BE(0);
    const rtpTimestamp = rtcpPacket.payload.readUInt32BE(4);
    const packetCount = rtcpPacket.payload.readUInt32BE(8);
    const octetCount = rtcpPacket.payload.readUInt32BE(12);

    this.emit('rtcp:sr', {
      ssrc: rtcpPacket.ssrc,
      ntpTimestamp,
      rtpTimestamp,
      packetCount,
      octetCount,
      rinfo
    });
  }

  private handleReceiverReport(rtcpPacket: RTCPPacket, rinfo: any) {
    // Extract reception statistics
    const fractionLost = rtcpPacket.payload[0];
    const cumulativeLost = rtcpPacket.payload.readUIntBE(1, 3);
    const extendedHighestSeqNum = rtcpPacket.payload.readUInt32BE(4);
    const jitter = rtcpPacket.payload.readUInt32BE(8);
    const lastSR = rtcpPacket.payload.readUInt32BE(12);
    const delaySinceLastSR = rtcpPacket.payload.readUInt32BE(16);

    this.emit('rtcp:rr', {
      ssrc: rtcpPacket.ssrc,
      fractionLost,
      cumulativeLost,
      extendedHighestSeqNum,
      jitter,
      lastSR,
      delaySinceLastSR,
      rinfo
    });
  }

  private handleApplicationDefined(rtcpPacket: RTCPPacket, rinfo: any) {
    // Handle custom application-defined RTCP packets
    const name = rtcpPacket.payload.toString('ascii', 0, 4);
    const data = rtcpPacket.payload.slice(4);

    this.emit('rtcp:app', {
      ssrc: rtcpPacket.ssrc,
      name,
      data,
      rinfo
    });
  }

  private forwardRTCPPacket(rtcpPacket: RTCPPacket, rinfo: any) {
    // Forward RTCP to relevant participants
    this.emit('rtcp:forward', {
      packet: rtcpPacket,
      sourceRinfo: rinfo
    });
  }

  // Public API methods

  public addTrack(track: MediaTrack): void {
    this.tracks.set(track.id, track);
    this.emit('track:added', track);
  }

  public removeTrack(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (track) {
      this.tracks.delete(trackId);
      this.rtpBuffers.delete(trackId);
      this.emit('track:removed', track);
    }
  }

  public subscribe(participantId: string, subscription: SFUSubscription): void {
    if (!this.subscriptions.has(participantId)) {
      this.subscriptions.set(participantId, []);
    }

    const subs = this.subscriptions.get(participantId)!;
    const existingIndex = subs.findIndex(sub => 
      sub.trackId === subscription.trackId && 
      sub.encodingLayerId === subscription.encodingLayerId
    );

    if (existingIndex >= 0) {
      subs[existingIndex] = subscription;
    } else {
      subs.push(subscription);
    }

    this.emit('subscription:added', { participantId, subscription });
  }

  public unsubscribe(participantId: string, trackId: string, encodingLayerId?: string): void {
    const subs = this.subscriptions.get(participantId);
    if (!subs) return;

    if (encodingLayerId) {
      const index = subs.findIndex(sub => 
        sub.trackId === trackId && sub.encodingLayerId === encodingLayerId
      );
      if (index >= 0) {
        subs.splice(index, 1);
      }
    } else {
      // Remove all subscriptions for this track
      const filtered = subs.filter(sub => sub.trackId !== trackId);
      this.subscriptions.set(participantId, filtered);
    }

    this.emit('subscription:removed', { participantId, trackId, encodingLayerId });
  }

  public updateBandwidthEstimate(participantId: string, estimate: BandwidthEstimate): void {
    this.bandwidthEstimates.set(participantId, estimate);
    this.emit('bandwidth:updated', { participantId, estimate });
  }

  public updateQualityMetrics(participantId: string, metrics: QualityMetrics): void {
    this.qualityMetrics.set(participantId, metrics);
    this.emit('quality:updated', { participantId, metrics });
  }

  public getTrack(trackId: string): MediaTrack | undefined {
    return this.tracks.get(trackId);
  }

  public getTracks(): MediaTrack[] {
    return Array.from(this.tracks.values());
  }

  public getSubscriptions(participantId: string): SFUSubscription[] {
    return this.subscriptions.get(participantId) || [];
  }

  public getBandwidthEstimate(participantId: string): BandwidthEstimate | undefined {
    return this.bandwidthEstimates.get(participantId);
  }

  public getQualityMetrics(participantId: string): QualityMetrics | undefined {
    return this.qualityMetrics.get(participantId);
  }

  public getStats(): any {
    return {
      tracks: this.tracks.size,
      participants: this.subscriptions.size,
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce((sum, subs) => sum + subs.length, 0),
      bandwidthEstimates: this.bandwidthEstimates.size,
      qualityMetrics: this.qualityMetrics.size
    };
  }

  public close(): void {
    this.udpSocket.close();
    this.emit('closed');
  }
}

// Export for use in other modules
export default SFU;
