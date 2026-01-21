"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalingMessageType = void 0;
var SignalingMessageType;
(function (SignalingMessageType) {
    // Session management
    SignalingMessageType["SESSION_CREATE"] = "session_create";
    SignalingMessageType["SESSION_JOIN"] = "session_join";
    SignalingMessageType["SESSION_LEAVE"] = "session_leave";
    SignalingMessageType["SESSION_UPDATE"] = "session_update";
    // Media negotiation
    SignalingMessageType["OFFER"] = "offer";
    SignalingMessageType["ANSWER"] = "answer";
    SignalingMessageType["ICE_CANDIDATE"] = "ice_candidate";
    SignalingMessageType["TRACK_ADD"] = "track_add";
    SignalingMessageType["TRACK_REMOVE"] = "track_remove";
    SignalingMessageType["TRACK_UPDATE"] = "track_update";
    // Call control
    SignalingMessageType["MUTE"] = "mute";
    SignalingMessageType["UNMUTE"] = "unmute";
    SignalingMessageType["VIDEO_ENABLE"] = "video_enable";
    SignalingMessageType["VIDEO_DISABLE"] = "video_disable";
    SignalingMessageType["SCREEN_SHARE_START"] = "screen_share_start";
    SignalingMessageType["SCREEN_SHARE_STOP"] = "screen_share_stop";
    // Presence
    SignalingMessageType["PRESENCE_UPDATE"] = "presence_update";
    SignalingMessageType["CALL_INVITATION"] = "call_invitation";
    // Recording
    SignalingMessageType["RECORDING_START"] = "recording_start";
    SignalingMessageType["RECORDING_STOP"] = "recording_stop";
    // Call transfer
    SignalingMessageType["TRANSFER_REQUEST"] = "transfer_request";
    SignalingMessageType["TRANSFER_ACCEPT"] = "transfer_accept";
    SignalingMessageType["TRANSFER_REJECT"] = "transfer_reject";
    // Reactions
    SignalingMessageType["REACTION"] = "reaction";
    // Error handling
    SignalingMessageType["ERROR"] = "error";
    SignalingMessageType["WARNING"] = "warning";
})(SignalingMessageType || (exports.SignalingMessageType = SignalingMessageType = {}));
