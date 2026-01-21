import React from 'react';
import { X, Heart, Bookmark, MessageCircle, Calendar, Phone, Video, MapPin, Share2, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProfileModalProps {
  profile: any;
  isOpen: boolean;
  onClose: () => void;
  currentImageIndex: number;
  imageLoading: boolean;
  imageError: boolean;
  onNextImage: () => void;
  onPreviousImage: () => void;
  onGoToImage: (index: number) => void;
  onLike: () => void;
  onLove: () => void;
  onBookmark: () => void;
  onChat: () => void;
  onDateRequest: () => void;
  onCall: () => void;
  onVideoCall: () => void;
  onShareLocation: () => void;
  onShare: () => void;
  hasProfileAction: (profileId: number, action: 'like' | 'love' | 'bookmark') => boolean;
  fallbackImages: string[];
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  currentImageIndex,
  imageLoading,
  imageError,
  onNextImage,
  onPreviousImage,
  onGoToImage,
  onLike,
  onLove,
  onBookmark,
  onChat,
  onDateRequest,
  onCall,
  onVideoCall,
  onShareLocation,
  onShare,
  hasProfileAction,
  fallbackImages
}) => {
  if (!isOpen || !profile) return null;

  const getWorkingImageUrl = (originalUrl: string, index: number) => {
    if (!originalUrl || originalUrl.includes('unsplash') || originalUrl.includes('picsum')) {
      return fallbackImages[index % fallbackImages.length];
    }
    return originalUrl;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors duration-75"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <h3 className="text-lg font-bold">{profile.name}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                              {profile.matchPercentage}%
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Images */}
          <div className="lg:w-2/3 relative">
            <div className="relative h-96 lg:h-[500px] bg-gray-100">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
                </div>
              )}
              
              {!imageLoading && !imageError && (
                <img
                  src={getWorkingImageUrl(profile.photos[currentImageIndex], currentImageIndex)}
                  alt={`${profile.name} - Photo ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => {
                    // Handle image error
                  }}
                />
              )}

              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-500">Image unavailable</p>
                  </div>
                </div>
              )}

              {/* Navigation Arrows */}
              {profile.photos && profile.photos.length > 1 && (
                <>
                  <button
                    onClick={onPreviousImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={onNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}

              {/* Image Indicators */}
              {profile.photos && profile.photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {profile.photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => onGoToImage(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentImageIndex
                          ? 'bg-white scale-125'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {profile.photos && profile.photos.length > 1 && (
              <div className="p-4 bg-gray-50">
                <div className="flex space-x-2 overflow-x-auto">
                  {profile.photos.map((photo: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => onGoToImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        index === currentImageIndex
                          ? 'border-pink-500'
                          : 'border-transparent hover:border-pink-300'
                      }`}
                    >
                      <img
                        src={getWorkingImageUrl(photo, index)}
                        alt={`${profile.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Profile Info */}
          <div className="lg:w-1/3 p-6 bg-white">
            {/* Basic Info */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{profile.name}</h2>
              <p className="text-gray-600 mb-1">{profile.age} years old</p>
              <p className="text-gray-600 mb-4">{profile.location}</p>
              
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Online now</span>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex space-x-2">
                <button
                  onClick={onLike}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    hasProfileAction(profile.id, 'like')
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  <span>Like</span>
                </button>
                
                <button
                  onClick={onLove}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    hasProfileAction(profile.id, 'love')
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  <Heart className="w-5 h-5 fill-current" />
                  <span>Love</span>
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={onBookmark}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    hasProfileAction(profile.id, 'bookmark')
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-yellow-500 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-5 h-5" />
                  <span>Save</span>
                </button>
                
                <button
                  onClick={onChat}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat</span>
                </button>
              </div>

              <button
                onClick={onDateRequest}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
              >
                <Calendar className="w-5 h-5" />
                <span>Plan a Date</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onCall}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Call</span>
                </button>
                
                <button
                  onClick={onVideoCall}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                >
                  <Video className="w-4 h-4" />
                  <span className="text-sm">Video</span>
                </button>
                
                <button
                  onClick={onShareLocation}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Location</span>
                </button>
                
                <button
                  onClick={onShare}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;





