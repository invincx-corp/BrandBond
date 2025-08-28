import React, { useState, useEffect } from 'react';
import { Sparkles, Lightbulb, MessageCircle, Star, TrendingUp, MapPin, Calendar, Target } from 'lucide-react';
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
  const [showReasoning, setShowReasoning] = useState(false);

  useEffect(() => {
    if (isVisible && currentUser && otherUser) {
      const generatedPrompts = AIPromptService.generateUniverseSpecificPrompts(
        currentUser,
        otherUser,
        theme,
        16
      );
      setPrompts(generatedPrompts);
    }
  }, [isVisible, currentUser, otherUser, theme]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'common-interest':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'different-favorite':
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'conversation-starter':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'location-based':
        return <MapPin className="w-4 h-4 text-red-500" />;
      case 'age-based':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'common-interest':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'different-favorite':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'conversation-starter':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'location-based':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'age-based':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'common-interest':
        return 'Common Interests';
      case 'different-favorite':
        return 'Discover New';
      case 'conversation-starter':
        return 'Start Chat';
      case 'location-based':
        return 'Location';
      case 'age-based':
        return 'Age Related';
      default:
        return 'General';
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'common-interest':
        return 'Things you both love';
      case 'different-favorite':
        return 'New discoveries to share';
      case 'conversation-starter':
        return 'Great ways to begin chatting';
      case 'location-based':
        return 'Places and geography';
      case 'age-based':
        return 'Life experiences';
      default:
        return 'General conversation';
    }
  };

  const filteredPrompts = selectedCategory === 'all' 
    ? prompts 
    : prompts.filter(prompt => prompt.category === selectedCategory);

  const categories = ['all', 'common-interest', 'different-favorite', 'conversation-starter', 'location-based', 'age-based'];

  if (!isVisible || prompts.length === 0) return null;

  return (
    <div className={`mb-4 p-4 rounded-xl border-2 ${
      theme === 'friends' 
        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200' 
        : 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-full ${
            theme === 'friends' 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
              : 'bg-gradient-to-r from-pink-500 to-purple-500'
          }`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">
              {theme === 'friends' ? 'Smart Chat Starters' : 'Romantic Conversation Starters'}
            </h4>
            <p className="text-xs text-gray-600">
              AI-powered prompts based on your connection with {otherUser.name}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className={`p-2 rounded-full transition-colors ${
            theme === 'friends' 
              ? 'hover:bg-blue-100 text-blue-600' 
              : 'hover:bg-pink-100 text-pink-600'
          }`}
          title="Show AI reasoning"
        >
          <Target className="w-4 h-4" />
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
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

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredPrompts.map((prompt) => (
          <div
            key={prompt.id}
            className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
              theme === 'friends' 
                ? 'bg-white border-blue-200 hover:border-blue-300' 
                : 'bg-white border-pink-200 hover:border-pink-300'
            }`}
            onClick={() => onSendPrompt(prompt.text)}
          >
            {/* Prompt Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(prompt.category)}
                <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(prompt.category)}`}>
                  {getCategoryLabel(prompt.category)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {Math.round(prompt.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Category Description */}
            <p className="text-xs text-gray-500 mb-2 italic">
              {getCategoryDescription(prompt.category)}
            </p>

            {/* Prompt Text */}
            <p className="text-sm text-gray-700 leading-relaxed mb-2">
              {prompt.text}
            </p>

            {/* AI Reasoning (if enabled) */}
            {showReasoning && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
                <strong>AI Reasoning:</strong> {prompt.reasoning}
              </div>
            )}

            {/* Action Button */}
            <button
              className={`w-full mt-2 px-3 py-1.5 text-xs rounded-lg transition-all ${
                theme === 'friends'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSendPrompt(prompt.text);
              }}
            >
              Use This Prompt
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {filteredPrompts.length} personalized prompts available
          </span>
          <span>
            Based on {currentUser.commonInterests.length} interests & {Object.keys(currentUser.allTimeFavorites).length} favorite categories
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          <span>
            💡 AI analyzes {Object.keys(currentUser.allTimeFavorites).length + Object.keys(otherUser.allTimeFavorites).length} total categories for maximum conversation potential
          </span>
        </div>
      </div>
    </div>
  );
};

export default IntelligentAIPrompts;
