import React, { useState, useEffect } from 'react';
import { Sparkles, Lightbulb, MessageCircle, Star, TrendingUp, MapPin, Calendar, Target, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

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

  const filteredPrompts = selectedCategory === 'all' 
    ? prompts 
    : prompts.filter(prompt => prompt.category === selectedCategory);

  const categories = ['all', 'common-interest', 'different-favorite', 'conversation-starter', 'location-based', 'age-based'];

  if (!isVisible || prompts.length === 0) return null;

  return (
    <div className={`bg-white rounded-xl border shadow-lg overflow-hidden ${
      theme === 'friends' 
        ? 'border-blue-200' 
        : 'border-pink-200'
    }`}>
      
      {/* Header */}
      <div className={`p-3 border-b ${
        theme === 'friends' 
          ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200' 
          : 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-full ${
              theme === 'friends' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                : 'bg-gradient-to-r from-pink-500 to-purple-500'
            }`}>
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">
                {theme === 'friends' ? 'Smart Chat Starters' : 'Romantic Conversation Starters'}
              </h4>
              <p className="text-xs text-gray-600">
                AI-powered prompts based on your connection with {otherUser.name}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className={`p-1.5 rounded-full transition-colors ${
              theme === 'friends' 
                ? 'hover:bg-blue-100 text-blue-600' 
                : 'hover:bg-pink-100 text-pink-600'
            }`}
            title="Show AI reasoning"
          >
            <Target className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-1.5 justify-center">
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

      {/* Prompts Container - Scrollable */}
      <div className="max-h-72 overflow-y-auto p-3">
        <div className="space-y-3">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`bg-white rounded-lg border transition-all hover:shadow-md ${
                theme === 'friends' 
                  ? 'border-blue-200 hover:border-blue-300' 
                  : 'border-pink-200 hover:border-pink-300'
              }`}
            >
              {/* Prompt Header */}
              <div className="p-3 border-b border-gray-100">
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

                {/* Prompt Text */}
                <div className="mb-2">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {prompt.text}
                  </p>
                </div>

                {/* AI Reasoning (if enabled) */}
                {showReasoning && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border text-xs text-gray-600">
                    <strong>AI Reasoning:</strong> {prompt.reasoning}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="p-3">
                <button
                  className={`w-full px-3 py-2 text-xs rounded-lg transition-all ${
                    theme === 'friends'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
                      : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
                  }`}
                  onClick={() => onSendPrompt(prompt.text)}
                >
                  Use This Prompt
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={`p-3 border-t ${
        theme === 'friends' 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-pink-50 border-pink-200'
      }`}>
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-gray-600 mb-1">
            <span>{filteredPrompts.length} prompts available</span>
            <span>•</span>
            <span>{currentUser.commonInterests.length} interests</span>
            <span>•</span>
            <span>{Object.keys(currentUser.allTimeFavorites).length} categories</span>
          </div>
          <div className="text-xs text-gray-500">
            💡 AI analyzes {Object.keys(currentUser.allTimeFavorites).length + Object.keys(otherUser.allTimeFavorites).length} total categories
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentAIPrompts;
