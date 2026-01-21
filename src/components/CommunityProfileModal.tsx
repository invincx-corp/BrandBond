import React, { useState } from 'react';
import { X, Users, Calendar, MapPin, Star, Heart, MessageCircle, Share2, Globe, Shield, Building2, CheckCircle, Sparkles, Target, Flame, Trophy, Zap, BookOpen, Rocket, PartyPopper } from 'lucide-react';

interface CommunityMember {
  id: number;
  name: string;
  avatar: string;
  role: 'founder' | 'moderator' | 'member';
  joinedDate: string;
  interests: string[];
}

interface CommunityPost {
  id: number;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
  type: 'text' | 'image' | 'poll' | 'event';
}

interface CommunityEvent {
  id: number;
  title: string;
  date: string;
  type: 'online' | 'offline' | 'hybrid';
  attendees: number;
  maxAttendees: number;
}

interface CommunityProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  community: any;
  userProfile: {
    interests: string[];
    personality: string[];
    location: string;
    activityLevel: string;
  };
  onNavigate?: (path: string) => void;
}

const CommunityProfileModal: React.FC<CommunityProfileModalProps> = ({
  isOpen,
  onClose,
  community,
  userProfile,
  onNavigate
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  // Sample data for other member favorites (in real app, this would come from API)
  const otherMemberFavorites = [
    'Pop Music', 'Action Movies', 'Italian Food', 'Beach Travel', 'Photography',
    'Rock Music', 'Comedy Shows', 'Mexican Food', 'Mountain Hiking', 'Painting',
    'Jazz Music', 'Sci-Fi Movies', 'Japanese Food', 'City Breaks', 'Cooking',
    'Electronic Music', 'Drama Series', 'Indian Food', 'Adventure Travel', 'Reading'
  ];

  // Filter to show only favorites that match user's interests
  const matchingOtherFavorites = otherMemberFavorites.filter(favorite => 
    userProfile.interests.some(interest => 
      interest.toLowerCase().includes(favorite.toLowerCase()) ||
      favorite.toLowerCase().includes(interest.toLowerCase())
    )
  );

  // Fallback: if no matches found, show some popular favorites
  const displayFavorites = matchingOtherFavorites.length > 0 ? matchingOtherFavorites : otherMemberFavorites.slice(0, 8);

  const handleJoinCommunity = async () => {
    setIsJoining(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setJoinSuccess(true);
    setIsJoining(false);
    
    // Navigate to community page after success
    setTimeout(() => {
      onClose();
      setJoinSuccess(false);
      if (onNavigate) {
        onNavigate(`/community/${community.id}`);
      }
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 lg:p-4 xl:p-6" onClick={onClose}>
      <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg sm:shadow-xl md:shadow-2xl w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[900px] max-h-[95vh] overflow-y-auto mx-1 sm:mx-2 md:mx-3 lg:mx-4 overscroll-contain" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <img
                src={community.avatar || community.photo}
                alt={community.name}
                className="w-16 h-16 rounded-full border-4 border-blue-200 shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=80&h=80&fit=crop&crop=face";
                }}
              />
              <div>
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 break-words leading-tight mb-2">{community.name}</h2>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    {community.type === 'public' ? (
                      <Globe className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Shield className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-bold">
                    <Star className="w-4 h-4 text-white" />
                    <span>{community.matchPercentage || 85}%</span>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Community Banner */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
          <div className="relative w-full max-w-md h-48 rounded-2xl overflow-hidden mx-auto bg-gradient-to-r from-blue-50 to-indigo-100">
            <img
              src={community.banner || community.photo}
              alt={`${community.name} - Banner`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop";
              }}
            />
          </div>
          
          {/* Community Stats */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-full">
                <span className="text-blue-600 font-medium">
                  {community.type === 'public' ? 'Public' : 'Private'}
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-full">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">{(community.memberCount || community.members || 0).toLocaleString()} members</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-full">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">Founded {community.foundedDate || '2023'}</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-full">
                <Building2 className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">{community.category || 'Community'}</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-full">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">{community.location || 'Global'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* About Community Section */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5 flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span>About {community.name}</span>
          </h3>
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <p className="text-gray-700 leading-relaxed text-base italic">
              "{community.description || 'A community focused on shared interests and meaningful connections.'}"
            </p>
          </div>
        </div>

        {/* Your Common Favorites Section */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm md:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5 flex items-center space-x-2">
            <Star className="w-6 h-6 text-green-600" />
            <span>Your Common Favorites with This Community</span>
          </h3>
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="mb-4">
              <p className="text-gray-700 mb-3 text-base">
                You share <strong>{(community.sharedInterests || []).length}</strong> interests with this community:
              </p>
              <div className="flex flex-wrap gap-2">
                {(community.sharedInterests || []).map((interest: string, index: number) => (
                  <span key={index} className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-full border border-blue-600 shadow-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-white/60 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                <strong>Perfect Match!</strong> These shared interests mean you'll find like-minded people who understand your passions and can introduce you to new perspectives within these areas.
              </p>
            </div>
          </div>
        </div>

        {/* Other Member Favorites Section */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5 flex items-center space-x-2">
            <Star className="w-6 h-6 text-purple-600" />
            <span>Other Favorites You Might Share with Members</span>
          </h3>
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="mb-4">
              <p className="text-gray-700 mb-3 text-base">
                Beyond the main community focus, members also love these favorites that match your interests:
              </p>
              <div className="flex flex-wrap gap-2">
                {displayFavorites.map((favorite: string, index: number) => (
                  <span key={index} className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-full border border-blue-600 shadow-sm">
                    {favorite}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-white/60 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                <strong>Bonus Connections!</strong> Even though these aren't the main focus of the community, you'll find people who share these interests too, creating even more opportunities for meaningful connections.
              </p>
            </div>
          </div>
        </div>

        {/* Community Core Values */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5 flex items-center space-x-2">
            <Target className="w-6 h-6 text-orange-600" />
            <span>Community Core Values</span>
          </h3>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            {(community.coreValues || ['Innovation', 'Collaboration', 'Growth', 'Support']).map((value: string, index: number) => (
              <span
                key={index}
                className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-full border border-blue-600 shadow-sm"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        {/* Community Highlights */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5 flex items-center space-x-2">
            <Flame className="w-6 h-6 text-red-600" />
            <span>Community Highlights & Viral Posts</span>
          </h3>
          <p className="text-gray-600 mb-4 text-base">See what the community loves most - these are the posts that went viral and brought everyone together!</p>
          
          <div className="space-y-4">
            {/* Viral Post 1 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-2">
                <Flame className="w-3 h-3" />
                <span>VIRAL</span>
              </div>
              <div className="flex items-start space-x-3">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face" 
                  alt="Sarah" 
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-800 text-sm">Sarah M.</span>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">"Just finished this amazing project inspired by our shared interests! The community feedback helped me make it perfect ✨"</p>
                  <div className="bg-white/60 rounded-lg p-3 mb-3">
                    <img 
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop" 
                      alt="Project" 
                      className="w-full h-24 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=200&fit=crop";
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1 text-red-500 font-semibold">
                      <Heart className="w-3 h-3 fill-current" />
                      <span>2.4k</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>847</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Share2 className="w-3 h-3" />
                      <span>156</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Viral Post 2 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-2">
                <Zap className="w-3 h-3" />
                <span>TRENDING</span>
              </div>
              <div className="flex items-start space-x-3">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" 
                  alt="Alex" 
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-800 text-sm">Alex J.</span>
                    <span className="text-xs text-gray-500">1 day ago</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">"Found the PERFECT spot that combines all our favorite interests! Who else thinks this community has the best recommendations ever? 🎯"</p>
                  <div className="bg-white/60 rounded-lg p-3 mb-3">
                    <p className="text-sm italic text-blue-700">"This community is pure gold! Every recommendation here is exactly what I needed." - Top comment</p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1 text-red-500 font-semibold">
                      <Heart className="w-3 h-3 fill-current" />
                      <span>1.8k</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>432</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Share2 className="w-3 h-3" />
                      <span>89</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Viral Post 3 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-2">
                <Trophy className="w-3 h-3" />
                <span>EPIC</span>
              </div>
              <div className="flex items-start space-x-3">
                <img 
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face" 
                  alt="Emma" 
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-800 text-sm">Emma K.</span>
                    <span className="text-xs text-gray-500">3 days ago</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">"WE DID IT! Our community collaboration project just hit 10K supporters! This is what happens when people with the same passions come together 🚀"</p>
                  <div className="bg-white/60 rounded-lg p-3 mb-3 flex items-center space-x-3">
                    <div className="flex -space-x-1">
                      <img 
                        src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=24&h=24&fit=crop&crop=face" 
                        alt="" 
                        className="w-5 h-5 rounded-full border border-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=24&h=24&fit=crop&crop=face";
                        }}
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=24&h=24&fit=crop&crop=face" 
                        alt="" 
                        className="w-5 h-5 rounded-full border border-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=24&h=24&fit=crop&crop=face";
                        }}
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=24&h=24&fit=crop&crop=face" 
                        alt="" 
                        className="w-5 h-5 rounded-full border border-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=24&h=24&fit=crop&crop=face";
                        }}
                      />
                    </div>
                    <span className="text-sm text-blue-700 font-medium">+847 others collaborated</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1 text-red-500 font-semibold">
                      <Heart className="w-3 h-3 fill-current" />
                      <span>3.2k</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>1.1k</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Share2 className="w-3 h-3" />
                      <span>294</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5 flex items-center space-x-2">
            <MessageCircle className="w-6 h-6 text-teal-600" />
            <span>Recent Community Activity</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(community.recentPosts || []).slice(0, 4).map((post: any) => (
              <div key={post.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <img 
                    src={post.avatar} 
                    alt={post.author} 
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-800 text-sm">{post.author}</span>
                      <span className="text-xs text-gray-500">{post.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                    <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        {post.likes}
                      </span>
                      <span className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3" />
                        {post.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Stories */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>Real People, Real Stories</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(community.memberStories || []).slice(0, 2).map((story: any) => (
              <div key={story.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <img 
                    src={story.avatar} 
                    alt={story.member} 
                    className="w-12 h-12 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face";
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2 text-base">{story.member}</h3>
                    <p className="text-sm text-gray-600 mb-3">{story.story}</p>
                    <div className="bg-white/60 rounded-lg px-3 py-2">
                      <p className="text-sm text-blue-700 font-medium">{story.impact}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6">
          {!joinSuccess ? (
            <button
              onClick={handleJoinCommunity}
              disabled={isJoining}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${
                isJoining
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
              }`}
            >
              {isJoining ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Joining...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Rocket className="w-5 h-5" />
                  <span>Join Your Tribe!</span>
                </div>
              )}
            </button>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                <div className="flex items-center justify-center space-x-2">
                  <PartyPopper className="w-6 h-6" />
                  <span>Welcome to {community.name}!</span>
                </div>
              </h3>
              <p className="text-gray-600 text-base">
                You're now part of an amazing community. Start exploring and connecting!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityProfileModal;
