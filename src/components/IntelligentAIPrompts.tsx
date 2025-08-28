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
        12 // Increased from 6 to 12 for better category representation
      );
      setPrompts(generatedPrompts);
    }
  }, [isVisible, currentUser, otherUser, theme]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'common-interest':
        return <Star className="w-3 h-3 text-yellow-600" />;
      case 'different-favorite':
        return <Lightbulb className="w-3 h-3 text-blue-600" />;
      case 'conversation-starter':
        return <MessageCircle className="w-3 h-3 text-green-600" />;
      case 'location-based':
        return <MapPin className="w-3 h-3 text-red-600" />;
      case 'age-based':
        return <Calendar className="w-3 h-3 text-purple-600" />;
      default:
        return <Sparkles className="w-3 h-3 text-gray-600" />;
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

  const getCategoryPriority = (category: string) => {
    switch (category) {
      case 'common-interest':
        return 'high';
      case 'conversation-starter':
        return 'high';
      case 'different-favorite':
        return 'medium';
      case 'location-based':
        return 'medium';
      case 'age-based':
        return 'low';
      default:
        return 'low';
    }
  };

  const filteredPrompts = selectedCategory === 'all' 
    ? prompts 
    : prompts.filter(prompt => prompt.category === selectedCategory);

  const categories = ['all', 'common-interest', 'different-favorite', 'conversation-starter', 'location-based', 'age-based'];

  if (!isVisible || prompts.length === 0) return null;

  return (
    <div className={`bg-white rounded-lg border-2 shadow-md overflow-hidden ${
      theme === 'friends' 
        ? 'border-blue-300' 
        : 'border-pink-300'
    }`}>
      
      {/* PROMINENT Header - Most Important but Compact */}
      <div className={`px-3 py-2 border-b-2 ${
        theme === 'friends' 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400 text-white' 
          : 'bg-gradient-to-r from-pink-500 to-pink-600 border-pink-400 text-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-full bg-white/20 backdrop-blur-sm`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm leading-tight">
                {theme === 'friends' ? 'Smart Chat Starters' : 'Romantic Starters'}
              </h4>
              <p className="text-xs text-white/90 font-medium">
                AI-powered for {otherUser.name}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold">{filteredPrompts.length}</div>
            <div className="text-xs text-white/80">prompts</div>
          </div>
        </div>
      </div>

      {/* SECONDARY Category Filter - Important but Compact */}
      <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-1 text-xs font-medium rounded-full border-2 transition-all transform hover:scale-105 ${
                selectedCategory === category
                  ? theme === 'friends'
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                    : 'bg-pink-500 text-white border-pink-500 shadow-sm'
                  : theme === 'friends'
                    ? 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                    : 'bg-white text-pink-700 border-pink-300 hover:bg-pink-50 hover:border-pink-400'
              }`}
            >
              {category === 'all' ? '✨ All' : getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT - Prompts with clear hierarchy but compact */}
      <div className="max-h-44 overflow-y-auto bg-gradient-to-b from-white to-gray-50">
        <div className="space-y-2 p-3">
          {filteredPrompts.map((prompt) => {
            const priority = getCategoryPriority(prompt.category);
            return (
              <div
                key={prompt.id}
                className={`p-2 rounded-lg border-2 transition-all hover:shadow-sm cursor-pointer transform hover:scale-[1.01] ${
                  priority === 'high'
                    ? theme === 'friends'
                      ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                      : 'border-pink-300 bg-pink-50 hover:bg-pink-100 hover:border-pink-400'
                    : priority === 'medium'
                    ? theme === 'friends'
                      ? 'border-blue-200 bg-blue-25 hover:bg-blue-75 hover:border-blue-300'
                      : 'border-pink-200 bg-pink-25 hover:bg-pink-75 hover:border-pink-300'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                }`}
                onClick={() => onSendPrompt(prompt.text)}
              >
                {/* Prompt Header with Priority Indicators - Compact */}
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    {getCategoryIcon(prompt.category)}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-semibold ${
                      priority === 'high'
                        ? theme === 'friends'
                          ? 'bg-blue-200 text-blue-800 border-blue-300'
                          : 'bg-pink-200 text-pink-800 border-pink-300'
                        : priority === 'medium'
                        ? theme === 'friends'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-pink-100 text-pink-700 border-pink-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {getCategoryLabel(prompt.category)}
                    </span>
                    {priority === 'high' && (
                      <span className="text-xs px-1 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full font-bold">
                        ⭐
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      priority === 'high' ? 'bg-green-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                    <span className={`text-xs font-semibold ${
                      priority === 'high' ? 'text-green-600' : priority === 'medium' ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {Math.round(prompt.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                {/* Prompt Text - Main content but compact */}
                <p className="text-xs text-gray-800 leading-relaxed font-medium mb-1.5 line-clamp-2">
                  {prompt.text.replace('{category}', 'this category').replace('{location}', otherUser.location).replace('{age}', otherUser.age.toString())}
                </p>
                
                {/* Action Hint - Compact */}
                <div className={`text-xs font-medium ${
                  priority === 'high'
                    ? theme === 'friends' ? 'text-blue-600' : 'text-pink-600'
                    : priority === 'medium'
                    ? theme === 'friends' ? 'text-blue-500' : 'text-pink-500'
                    : 'text-gray-500'
                }`}>
                  💬 Click to send
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SUBTLE Footer - Least important and compact */}
      <div className={`px-3 py-1.5 border-t text-center text-xs ${
        theme === 'friends' 
          ? 'bg-blue-25 border-blue-200 text-blue-600' 
          : 'bg-pink-25 border-pink-200 text-pink-600'
      }`}>
        <span className="font-medium">💡</span> AI-powered conversation starters
      </div>
    </div>
  );
};

export default IntelligentAIPrompts;
