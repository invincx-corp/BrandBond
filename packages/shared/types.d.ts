export interface Participant {
    id: string;
    name: string;
    avatar?: string;
    role: 'host' | 'participant' | 'moderator';
    isMuted: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
    joinTime: Date;
    lastSeen: Date;
}
export interface CallSession {
    id: string;
    type: '1:1' | 'group' | 'community' | 'fanclub';
    participants: Participant[];
    maxParticipants: number;
    isRecording: boolean;
    createdAt: Date;
    metadata: {
        title?: string;
        description?: string;
        communityId?: string;
        fanclubId?: string;
    };
}
export interface MediaTrack {
    id: string;
    participantId: string;
    type: 'audio' | 'video' | 'screen';
    ssrc: number;
    encodingLayers: EncodingLayer[];
    isEnabled: boolean;
}
export interface EncodingLayer {
    id: string;
    ssrc: number;
    rid?: string;
    maxBitrate: number;
    maxFramerate: number;
    maxWidth: number;
    maxHeight: number;
}
export interface SignalingMessage {
    type: SignalingMessageType;
    sessionId: string;
    participantId?: string;
    timestamp: number;
    payload: any;
}
export declare enum SignalingMessageType {
    SESSION_CREATE = "session_create",
    SESSION_JOIN = "session_join",
    SESSION_LEAVE = "session_leave",
    SESSION_UPDATE = "session_update",
    OFFER = "offer",
    ANSWER = "answer",
    ICE_CANDIDATE = "ice_candidate",
    TRACK_ADD = "track_add",
    TRACK_REMOVE = "track_remove",
    TRACK_UPDATE = "track_update",
    MUTE = "mute",
    UNMUTE = "unmute",
    VIDEO_ENABLE = "video_enable",
    VIDEO_DISABLE = "video_disable",
    SCREEN_SHARE_START = "screen_share_start",
    SCREEN_SHARE_STOP = "screen_share_stop",
    PRESENCE_UPDATE = "presence_update",
    CALL_INVITATION = "call_invitation",
    RECORDING_START = "recording_start",
    RECORDING_STOP = "recording_stop",
    TRANSFER_REQUEST = "transfer_request",
    TRANSFER_ACCEPT = "transfer_accept",
    TRANSFER_REJECT = "transfer_reject",
    REACTION = "reaction",
    ERROR = "error",
    WARNING = "warning"
}
export interface CallOffer {
    sessionId: string;
    participantId: string;
    sdp: string;
    tracks: MediaTrack[];
    iceCandidates: RTCIceCandidate[];
}
export interface CallAnswer {
    sessionId: string;
    participantId: string;
    sdp: string;
    tracks: MediaTrack[];
    iceCandidates: RTCIceCandidate[];
}
export interface CallTransfer {
    fromParticipantId: string;
    toParticipantId: string;
    transferType: 'blind' | 'attended';
    sessionId: string;
    metadata?: any;
}
export interface CallReaction {
    participantId: string;
    reactionType: 'emoji' | 'animation';
    reactionData: string;
    timestamp: number;
    duration?: number;
}
export interface RecordingMetadata {
    sessionId: string;
    participantId: string;
    startTime: Date;
    endTime?: Date;
    tracks: {
        audio: boolean;
        video: boolean;
        screen: boolean;
    };
    format: 'webm' | 'mp4';
    fileSize?: number;
    encryptionKey?: string;
}
export interface SFUSubscription {
    participantId: string;
    trackId: string;
    encodingLayerId: string;
    maxBitrate: number;
    maxFramerate: number;
    maxWidth: number;
    maxHeight: number;
}
export interface BandwidthEstimate {
    participantId: string;
    availableBandwidth: number;
    estimatedBandwidth: number;
    congestionWindow: number;
    rtt: number;
    packetLoss: number;
}
export interface QualityMetrics {
    participantId: string;
    timestamp: number;
    videoMetrics?: {
        framerate: number;
        bitrate: number;
        resolution: string;
        packetLoss: number;
        jitter: number;
    };
    audioMetrics?: {
        bitrate: number;
        packetLoss: number;
        jitter: number;
        echoLevel: number;
        noiseLevel: number;
    };
}
