import React, { useState } from 'react';
import { X, Image, Link, MessageSquare, Star, Send, Video, Music, ThumbsUp, Calendar, Zap, Heart } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: {
    name: string;
    avatar: string;
    interests: string[];
  };
  onSubmit: (post: {
    content: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'question' | 'poll' | 'event' | 'link';
    sharedInterests: string[];
  }) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSubmit
}) => {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'audio' | 'question' | 'poll' | 'event' | 'link'>('text');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const availableInterests = [
    'Technology', 'Programming', 'Artificial Intelligence', 'Innovation', 
    'Startups', 'Machine Learning', 'Data Science', 'Web Development',
    'Mobile Apps', 'Cloud Computing', 'Cybersecurity', 'Blockchain'
  ];

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    onSubmit({
      content: content.trim(),
      type: postType,
      sharedInterests: selectedInterests
    });
    
    // Reset form
    setContent('');
    setPostType('text');
    setSelectedInterests([]);
    onClose();
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-3 text-blue-600" />
            Share with Your Tribe ✨
          </h2>
          <button
            onClick={onClose}
            className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-14 h-14 rounded-full border-3 border-blue-200 shadow-md"
            />
            <div>
              <p className="font-bold text-gray-900 text-lg">{userProfile.name}</p>
              <p className="text-gray-600 text-sm">Posting to Tech Creators 💫</p>
            </div>
          </div>

          {/* Post Type Selector */}
          <div className="space-y-4">
            <label className="text-lg font-bold text-gray-700 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Post Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'text', label: 'Text Post', icon: MessageSquare, color: 'bg-blue-100 text-blue-700' },
                { id: 'question', label: 'Question', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
                { id: 'image', label: 'Image/Media', icon: Image, color: 'bg-pink-100 text-pink-700' },
                { id: 'video', label: 'Video', icon: Video, color: 'bg-red-100 text-red-700' },
                { id: 'audio', label: 'Audio', icon: Music, color: 'bg-yellow-100 text-yellow-700' },
                { id: 'poll', label: 'Poll', icon: ThumbsUp, color: 'bg-indigo-100 text-indigo-700' },
                { id: 'event', label: 'Event', icon: Calendar, color: 'bg-emerald-100 text-emerald-700' },
                { id: 'link', label: 'Link', icon: Link, color: 'bg-orange-100 text-orange-700' }
              ].map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setPostType(type.id as any)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                      postType === type.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl ${type.color} shadow-sm`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{type.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-4">
            <label className="text-lg font-bold text-gray-700 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              {postType === 'question' ? 'What would you like to ask?' : 'What would you like to share?'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                postType === 'question' 
                  ? "Ask your tribe about something you're curious about... 🤔"
                  : "Share your thoughts, experiences, or discoveries with your tribe... ✨"
              }
              className="w-full h-36 p-5 border-2 border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            />
          </div>

          {/* Shared Interests */}
          <div className="space-y-4">
            <label className="text-lg font-bold text-gray-700 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-600" />
              Related Interests (Optional)
            </label>
            <div className="flex flex-wrap gap-3">
              {availableInterests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105 ${
                    selectedInterests.includes(interest)
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Character Count */}
          <div className="text-right">
            <span className={`text-sm font-medium ${
              content.length > 500 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {content.length}/500
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-b-3xl">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="font-medium">This will be shared with your Tech Creators tribe 💫</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Send className="w-5 h-5" />
            <span>Share with Tribe ✨</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
