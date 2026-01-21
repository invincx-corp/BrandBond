import React from 'react';
import { MessageCircle, Send, Paperclip, Smile, Mic, Phone, Video, MoreHorizontal, Search, Filter, Archive, Trash, Block, Report, Pin, Mute, Volume2, VolumeX, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface ChatInterfaceProps {
  conversations: any[];
  activeConversation: any;
  messages: any[];
  currentUserId: string;
  newMessage: string;
  onNewMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onSelectConversation: (conversation: any) => void;
  onSearchConversations: (query: string) => void;
  onFilterConversations: (filter: string) => void;
  onArchiveConversation: (conversationId: number) => void;
  onDeleteConversation: (conversationId: number) => void;
  onBlockUser: (conversationId: number) => void;
  onReportUser: (conversationId: number) => void;
  onPinConversation: (conversationId: number) => void;
  onMuteConversation: (conversationId: number) => void;
  onStartVoiceCall: (conversationId: number) => void;
  onStartVideoCall: (conversationId: number) => void;
  onAttachFile: () => void;
  onRecordVoice: () => void;
  onEmojiSelect: (emoji: string) => void;
  formatTimestamp: (timestamp: string) => string;
  isTyping: boolean;
  typingUser: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversations,
  activeConversation,
  messages,
  currentUserId,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onSelectConversation,
  onSearchConversations,
  onFilterConversations,
  onArchiveConversation,
  onDeleteConversation,
  onBlockUser,
  onReportUser,
  onPinConversation,
  onMuteConversation,
  onStartVoiceCall,
  onStartVideoCall,
  onAttachFile,
  onRecordVoice,
  onEmojiSelect,
  formatTimestamp,
  isTyping,
  typingUser
}) => {
  const renderMessage = (message: any) => {
    const isOwnMessage = message.senderId === currentUserId;
    
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          {!isOwnMessage && (
            <div className="flex items-center space-x-2 mb-1">
              <img
                src={message.senderAvatar || '/default-avatar.png'}
                alt={message.senderName}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-xs text-gray-500">{message.senderName}</span>
            </div>
          )}
          
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwnMessage
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <p className="text-sm">{message.text}</p>
            
            {/* Message Status */}
            <div className={`flex items-center justify-end space-x-1 mt-1 ${
              isOwnMessage ? 'text-white/80' : 'text-gray-500'
            }`}>
              <span className="text-xs">{formatTimestamp(message.timestamp)}</span>
              {isOwnMessage && (
                <span className="ml-1">
                  {message.status === 'sent' && <Check className="w-3 h-3" />}
                  {message.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                  {message.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-400" />}
                  {message.status === 'sending' && <Clock className="w-3 h-3" />}
                  {message.status === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 border-r border-gray-200 bg-gray-50">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Messages</h3>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              onChange={(e) => onSearchConversations(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          
          {/* Filters */}
          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => onFilterConversations('all')}
              className="px-3 py-1 text-xs bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors duration-200"
            >
              All
            </button>
            <button
              onClick={() => onFilterConversations('unread')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
            >
              Unread
            </button>
            <button
              onClick={() => onFilterConversations('pinned')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
            >
              Pinned
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <p className="text-gray-400 text-xs">Start chatting with your matches!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`p-4 cursor-pointer transition-colors duration-200 hover:bg-white ${
                    activeConversation?.id === conversation.id ? 'bg-white border-r-2 border-pink-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={conversation.profile.photos?.[0] || '/default-avatar.png'}
                        alt={conversation.profile.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {conversation.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 truncate">{conversation.profile.name}</h4>
                          <span className="text-xs text-gray-500 font-medium">
                            {conversation.matchPercentage}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {conversation.isPinned && (
                            <Pin className="w-3 h-3 text-pink-500" />
                          )}
                          {conversation.isMuted && (
                            <VolumeX className="w-3 h-3 text-gray-400" />
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(conversation.lastMessage?.timestamp || conversation.updatedAt)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.text || 'Start a conversation...'}
                      </p>
                      
                      <div className="flex items-center justify-end mt-1">
                        {conversation.unreadCount > 0 && (
                          <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={activeConversation.profile.photos?.[0] || '/default-avatar.png'}
                    alt={activeConversation.profile.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{activeConversation.profile.name}</h4>
                    <div className="flex items-center space-x-2">
                      {activeConversation.isOnline ? (
                        <span className="text-sm text-green-600 flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Online</span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Offline</span>
                      )}
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{activeConversation.matchPercentage}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onStartVoiceCall(activeConversation.id)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onStartVideoCall(activeConversation.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onPinConversation(activeConversation.id)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      activeConversation.isPinned
                        ? 'text-pink-600 bg-pink-50'
                        : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                  >
                    <Pin className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onMuteConversation(activeConversation.id)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      activeConversation.isMuted
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {activeConversation.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  
                  <div className="relative">
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {/* Dropdown menu for more actions */}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Start the conversation!</h3>
                  <p className="text-gray-500">Send a message to {activeConversation.profile.name} to begin chatting.</p>
                </div>
              ) : (
                <div>
                  {messages.map(renderMessage)}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-600">{typingUser} is typing</span>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onAttachFile}
                  className="p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors duration-200"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <button
                  onClick={onRecordVoice}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <Mic className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => onNewMessageChange(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
                  />
                  
                  <button
                    onClick={() => onEmojiSelect('😊')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-500 transition-colors duration-200"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                
                <button
                  onClick={onSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-medium text-gray-600 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;





