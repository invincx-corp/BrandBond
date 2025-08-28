import React, { useState, useEffect } from 'react';
import { Sparkles, Lightbulb, MessageCircle, Star, MapPin, Calendar } from 'lucide-react';
import { AIPromptService, AIPrompt, UserProfile } from '../services/aiPromptService';

interface IntelligentAIPromptsProps {
  currentUser: UserProfile;
  otherUser: UserProfile;
  theme: 'love' | 'friends';
  onSendPrompt: (prompt: string) => void;
  isVisible: boolean;
}

const IntelligentAIPrompts: React.FC<IntelligentAIPromptsProps> = ({
  currentUser,
  otherUser,
  theme,
  onSendPrompt,
  isVisible
}) => {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isVisible && currentUser && otherUser) {
      const generatedPrompts = AIPromptService.generateUniverseSpecificPrompts(
        currentUser,
        otherUser,
        theme,
        8 // Reduced from 16 to 8 for better UX
      );
      setPrompts(generatedPrompts);
    }
  }, [isVisible, currentUser, otherUser, theme]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'common-interest':
        return <Star className="w-3 h-3 text-yellow-500" />;
      case 'different-favorite':
        return <Lightbulb className="w-3 h-3 text-blue-500" />;
      case 'conversation-starter':
        return <MessageCircle className="w-3 h-3 text-green-500" />;
      case 'location-based':
        return <MapPin className="w-3 h-3 text-red-500" />;
      case 'age-based':
        return <Calendar className="w-3 h-3 text-purple-500" />;
      default:
        return <Sparkles className="w-3 h-3 text-gray-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'common-interest':
        return 'Common';
      case 'different-favorite':
        return 'Discover';
      case 'conversation-starter':
        return 'Start';
      case 'location-based':
        return 'Location';
      case 'age-based':
        return 'Age';
      default:
        return 'General';
    }
  };

  const filteredPrompts = selectedCategory === 'all' 
    ? prompts 
    : prompts.filter(prompt => prompt.category === selectedCategory);

  const categories = ['all', 'common-interest', 'different-favorite', 'conversation-starter', 'location-based', 'age-based'];

  if (!isVisible || prompts.length === 0) return null;

  return (
    <div className={`bg-white rounded-lg border shadow-sm overflow-hidden ${
      theme === 'friends' 
        ? 'border-blue-200' 
        : 'border-pink-200'
    }`}>
      
      {/* Compact Header */}
      <div className={`px-3 py-2 border-b ${
        theme === 'friends' 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-pink-50 border-pink-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded-full ${
              theme === 'friends' 
                ? 'bg-blue-500' 
                : 'bg-pink-500'
            }`}>
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-800">
                {theme === 'friends' ? 'Smart Chat Starters' : 'Romantic Starters'}
              </h4>
              <p className="text-xs text-gray-600">
                Based on {otherUser.name}'s profile
              </p>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            {filteredPrompts.length} prompts
          </div>
        </div>
      </div>

      {/* Compact Category Filter */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-1 justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-1 text-xs rounded-full border transition-all ${
                selectedCategory === category
                  ? theme === 'friends'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-pink-500 text-white border-pink-500'
                  : theme === 'friends'
                    ? 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                    : 'bg-white text-pink-600 border-pink-200 hover:bg-pink-50'
              }`}
            >
              {category === 'all' ? 'All' : getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Prompts List */}
      <div className="max-h-48 overflow-y-auto">
        <div className="space-y-2 p-3">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`p-2 rounded border transition-all hover:shadow-sm cursor-pointer ${
                theme === 'friends' 
                  ? 'border-blue-200 hover:border-blue-300 hover:bg-blue-50' 
                  : 'border-pink-200 hover:border-pink-300 hover:bg-pink-50'
              }`}
              onClick={() => onSendPrompt(prompt.text)}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(prompt.category)}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full border ${getCategoryColor(prompt.category)}`}>
                    {getCategoryLabel(prompt.category)}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {Math.round(prompt.confidence * 100)}%
                </div>
              </div>
              
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                {prompt.text}
              </p>
              
              <div className="mt-2 text-xs text-gray-500">
                Click to use this prompt
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compact Footer */}
      <div className={`px-3 py-2 border-t text-center text-xs text-gray-500 ${
        theme === 'friends' 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-pink-50 border-pink-200'
      }`}>
        💡 AI-powered conversation starters
      </div>
    </div>
  );
};

// Helper function for category colors
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'common-interest':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'different-favorite':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'conversation-starter':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'location-based':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'age-based':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default IntelligentAIPrompts;
