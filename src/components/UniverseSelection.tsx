import React from 'react';
import { Heart, Users, ArrowLeft, Check, Star, Sparkles } from 'lucide-react';

interface UniverseSelectionProps {
  onSelectUniverse: (universe: 'love' | 'friends') => void;
  onBack: () => void;
}

const UniverseSelection: React.FC<UniverseSelectionProps> = ({ onSelectUniverse, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 relative overflow-hidden">
      {/* Background Decorative Elements - Matching Landing Page */}
      <div className="absolute top-20 left-4 sm:left-10 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-r from-indigo-200 to-pink-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-20 right-4 sm:right-10 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-r from-pink-200 to-indigo-200 rounded-full opacity-20 blur-xl"></div>
      
      {/* Header - Matching Landing Page Style */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex justify-between items-center py-4">
            {/* Logo - Matching Landing Page */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Heart className="w-4 h-4 sm:w-6 sm:w-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                BrandBond
              </span>
            </div>

            {/* Back Button - Styled Like Landing Page Buttons */}
            <button 
              onClick={onBack}
              className="bg-white text-gray-900 border-2 border-gray-200 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Optimized for Viewport Height */}
      <div className="flex flex-col justify-center min-h-[calc(100vh-80px)] px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 sm:py-6 md:py-8 lg:py-10 xl:py-12">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header Section - Compact Design */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-12">
            {/* Status Badge - Matching Landing Page Style */}
            <div className="inline-flex items-center space-x-1 sm:space-x-2 bg-white/80 backdrop-blur-sm px-2 sm:px-3 md:px-4 lg:px-6 py-1 sm:py-2 md:py-3 rounded-full shadow-lg border border-gray-200 mb-2 sm:mb-3 md:mb-4 lg:mb-6 animate-pulse">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">✨ Choose your journey</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 lg:mb-6 leading-tight">
              Choose Your <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Universe</span>
            </h1>
            
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-1 sm:mb-2">
              Don't worry - you can always switch between universes later!
            </p>
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-yellow-500" />
              <span>Each universe has its own unique features and design</span>
            </div>
          </div>
          
          {/* Dual Universe Cards - Compact Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12 max-w-4xl sm:max-w-5xl mx-auto mb-4 sm:mb-6 md:mb-8">
            {/* Love Universe - Matching Landing Page Color Scheme */}
            <div className="group relative overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-lg sm:shadow-xl md:shadow-2xl transform transition-all duration-500 hover:scale-105 hover:shadow-3xl border border-white/20 mx-2 sm:mx-0">
                <div className="text-center text-white">
                  {/* Icon Container - Matching Landing Page Style */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 lg:mb-8 group-hover:scale-110 transition-transform">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                  </div>
                  
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 md:mb-4">💕 Find Love</h3>
                  <p className="text-indigo-100 mb-3 sm:mb-4 md:mb-6 lg:mb-8 leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg">
                    Discover romantic connections, build meaningful relationships, and find your perfect match
                  </p>
                  
                  {/* Button - Matching Landing Page Style */}
                  <button 
                    onClick={() => onSelectUniverse('love')}
                    className="bg-white text-indigo-600 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-2 sm:py-3 md:py-4 rounded-full font-bold text-xs sm:text-sm md:text-base lg:text-lg hover:bg-indigo-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Enter Love Universe
                  </button>
                </div>
              </div>
            </div>
            
            {/* Friendship Universe - Matching Landing Page Color Scheme */}
            <div className="group relative overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-lg sm:shadow-xl md:shadow-2xl transform transition-all duration-500 hover:scale-105 hover:shadow-3xl border border-white/20 mx-2 sm:mx-0">
                <div className="text-center text-white">
                  {/* Icon Container - Matching Landing Page Style */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 lg:mb-8 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                  </div>
                  
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 md:mb-4">🤝 Find Friends</h3>
                  <p className="text-blue-100 mb-3 sm:mb-4 md:mb-6 lg:mb-8 leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg">
                    Connect with communities, share interests, build friendships, and join fan clubs
                  </p>
                  
                  {/* Button - Matching Landing Page Style */}
                  <button 
                    onClick={() => onSelectUniverse('friends')}
                    className="bg-white text-blue-600 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-2 sm:py-3 md:py-4 rounded-full font-bold text-xs sm:text-sm md:text-base lg:text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Enter Friends Universe
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          
        </div>
      </div>
    </div>
  );
};

export default UniverseSelection;

