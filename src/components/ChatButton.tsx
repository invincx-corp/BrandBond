import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { supabase } from '../lib/supabase';
import { ConversationWithEnhancedProfile } from '../contexts/ChatContext';

interface ChatButtonProps {
  profile: {
    id: string;
    name: string;
    photos: string[];
    matchPercentage?: number;
  };
  variant?: 'primary' | 'secondary' | 'icon' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showUnreadCount?: boolean;
  onChatStart?: (conversation: ConversationWithEnhancedProfile) => void;
}

const ChatButton: React.FC<ChatButtonProps> = ({
  profile,
  variant = 'primary',
  size = 'md',
  className = '',
  showUnreadCount = true,
  onChatStart
}) => {
  const { 
    conversations, 
    setActiveConversation, 
    markAsRead
  } = useChat();
  
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Find existing conversation or create new one
  const existingConversation = conversations.find(conv => 
    conv.otherProfile.id === profile.id
  );

  const handleChatClick = async () => {
    try {
      if (existingConversation) {
        // Open existing conversation
        setActiveConversation(existingConversation);
        
        // Mark as read if there are unread messages
        if (existingConversation.conversation.unreadCount > 0) {
          await markAsRead(existingConversation.conversation.id);
        }
      } else {
        const { error: convErr } = await supabase
          .rpc('get_or_create_conversation', { p_other_user: profile.id, p_universe: 'both' });
        if (convErr) throw convErr;

        await new Promise((r) => setTimeout(r, 250));
        const created = conversations.find((conv) => conv.otherProfile.id === profile.id) || null;
        if (created) setActiveConversation(created);
      }
      
      // Call callback if provided
      if (onChatStart && existingConversation) {
        onChatStart(existingConversation);
      }
      
      // Navigate to messages tab (this would be handled by the parent component)
      // You can emit a custom event or use a callback to handle navigation
      
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  // Get unread count for this specific conversation
  const conversationUnreadCount = existingConversation?.conversation.unreadCount || 0;

  // Button variants
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white hover:from-pink-600 hover:via-rose-600 hover:to-pink-700';
      case 'secondary':
        return 'bg-white text-pink-600 border-2 border-pink-500 hover:bg-pink-50';
      case 'icon':
        return 'bg-pink-500 text-white hover:bg-pink-600';
      case 'floating':
        return 'bg-white text-pink-600 shadow-lg hover:shadow-xl border border-pink-200';
      default:
        return 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white';
    }
  };

  // Button sizes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  // Icon sizes
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-5 h-5';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-full transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transform transition-transform duration-75
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${className}
  `;

  const buttonClasses = `
    ${baseClasses}
    ${isHovered ? 'scale-105' : ''}
    ${isPressed ? 'scale-95' : ''}
  `;

  // Render different button types
  if (variant === 'icon') {
    return (
      <button
        className={buttonClasses}
        onClick={handleChatClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        title={`Chat with ${profile.name}`}
      >
        <i className={`fas fa-comment ${getIconSize()}`} />
        {showUnreadCount && conversationUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {conversationUnreadCount > 9 ? '9+' : conversationUnreadCount}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'floating') {
    return (
      <button
        className={buttonClasses}
        onClick={handleChatClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
      >
        <i className={`fas fa-comment ${getIconSize()}`} />
        <span>Chat</span>
        {showUnreadCount && conversationUnreadCount > 0 && (
          <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
            {conversationUnreadCount > 9 ? '9+' : conversationUnreadCount}
          </span>
        )}
      </button>
    );
  }

  // Default button with text
  return (
    <button
      className={buttonClasses}
      onClick={handleChatClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      <i className={`fas fa-comment ${getIconSize()}`} />
      <span>
        {existingConversation ? 'Continue Chat' : 'Start Chat'}
      </span>
      {showUnreadCount && conversationUnreadCount > 0 && (
        <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
          {conversationUnreadCount > 9 ? '9+' : conversationUnreadCount}
        </span>
      )}
    </button>
  );
};

export default ChatButton;
