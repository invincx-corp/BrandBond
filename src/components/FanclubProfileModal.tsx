import React, { useState } from 'react';
import { X, Users, Calendar, MapPin, Star, Heart, MessageCircle, Share2, Globe, Shield, Building2, CheckCircle } from 'lucide-react';

interface FanclubMember {
  id: number;
  name: string;
  avatar: string;
  role: 'founder' | 'moderator' | 'member';
  joinedDate: string;
  interests: string[];
}

interface FanclubPost {
  id: number;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
  type: 'text' | 'image' | 'poll' | 'event';
}

interface FanclubEvent {
  id: number;
  title: string;
  date: string;
  type: 'online' | 'offline' | 'hybrid';
  attendees: number;
  maxAttendees: number;
}

interface FanclubProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  fanclub: {
    id: number;
    name: string;
    description: string;
    category: string;
    type: 'public' | 'private';
    foundedDate: string;
    memberCount: number;
    maxMembers?: number;
    members?: number;
    location: string;
    avatar: string;
    banner: string;
    matchPercentage: number;
    sharedInterests: string[];
    isJoined: boolean;
    tags: string[];
    coreValues: string[];
    activityLevel: 'very-active' | 'active' | 'moderate' | 'quiet';
    contentTypes: string[];
    rules: string[];
    founder: {
      name: string;
      avatar: string;
      bio: string;
    };
    moderators: FanclubMember[];
    recentPosts: FanclubPost[];
    upcomingEvents: FanclubEvent[];
    memberStories: {
      id: number;
      member: string;
      avatar: string;
      story: string;
      impact: string;
    }[];
  };
  userProfile: {
    interests: string[];
    personality: string[];
    location: string;
    activityLevel: string;
  };
  onNavigate?: (path: string) => void;
}

const FanclubProfileModal: React.FC<FanclubProfileModalProps> = ({
  isOpen,
  onClose,
  fanclub,
  userProfile,
  onNavigate
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel effect
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 5);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Sample data for shared interests (in real app, this would come from API)
  const sampleSharedInterests = [
    'Technology', 'Programming', 'Artificial Intelligence', 'Innovation', 'Startups', 'Gadgets',
    'Machine Learning', 'Data Science', 'Web Development', 'Mobile Apps', 'Cloud Computing',
    'Cybersecurity', 'Blockchain', 'Internet of Things', 'Virtual Reality', 'Augmented Reality'
  ];

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

  const handleJoinFanclub = async () => {
    setIsJoining(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setJoinSuccess(true);
    setIsJoining(false);
    
    // Navigate to fanclub page after success
    setTimeout(() => {
      onClose();
      setJoinSuccess(false);
      if (onNavigate) {
        onNavigate(`/fanclub/${fanclub.id}`);
      }
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6" onClick={onClose}>
      <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg sm:shadow-xl md:shadow-2xl w-full max-w-[98vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[900px] max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] lg:max-h-[85vh] overflow-y-auto mx-2 sm:mx-3 md:mx-4 lg:mx-5 overscroll-contain" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header - Friends Profile Modal Style */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7 border-b border-gray-200">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-3 md:space-x-4 w-full sm:w-auto">
              <img
                src={fanclub.avatar || "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=80&h=80&fit=crop&crop=face"}
                alt={fanclub.name || 'Fanclub'}
                className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 rounded-full border-2 border-purple-200 shadow-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=80&h=80&fit=crop&crop=face";
                }}
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-3 md:space-x-4">
                <h2 className="text-lg sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 break-words leading-tight">{fanclub.name || 'Fanclub'}</h2>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="bg-purple-100 p-1.5 sm:p-1.5 rounded-full">
                    {(fanclub.type || 'public') === 'public' ? (
                      <Globe className="w-4 h-4 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-purple-600" />
                    ) : (
                      <Shield className="w-4 h-4 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-purple-600" />
                    )}
                  </div>
                  <div className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-1.5 md:py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-sm sm:text-sm md:text-base font-bold">
                    <Star className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
                    <span>{fanclub.matchPercentage || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 sm:p-2 md:p-2.5 lg:p-3 xl:p-3.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors self-end sm:self-auto"
            >
              <X className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8" />
            </button>
          </div>
        </div>

        {/* Fanclub Image Slideshow Carousel */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7 border-b border-gray-100">
          <h4 className="text-sm sm:text-sm md:text-base font-semibold text-gray-700 mb-3 sm:mb-3 text-center">Recent Fanclub Highlights</h4>
          <div className="relative w-full max-w-[320px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[450px] h-[200px] sm:h-[180px] md:h-[220px] lg:h-[260px] xl:h-[300px] rounded-lg sm:rounded-xl overflow-hidden mx-auto border-2 border-purple-200">
            {/* Carousel Images */}
            <div className="relative w-full h-full">
              <img 
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop" 
                alt="Fanclub Activity 1" 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${currentSlide === 0 ? 'opacity-100' : 'opacity-0'}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop";
                }}
              />
              <img 
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop" 
                alt="Fanclub Activity 2" 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${currentSlide === 1 ? 'opacity-100' : 'opacity-0'}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop";
                }}
              />
              <img 
                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop" 
                alt="Fanclub Activity 3" 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${currentSlide === 2 ? 'opacity-100' : 'opacity-0'}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop";
                }}
              />
              <img 
                src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop" 
                alt="Fanclub Activity 4" 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${currentSlide === 3 ? 'opacity-100' : 'opacity-0'}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop";
                }}
              />
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop" 
                alt="Fanclub Activity 5" 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${currentSlide === 4 ? 'opacity-100' : 'opacity-0'}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop";
                }}
              />
            </div>
            
            {/* Navigation Arrows */}
            <button 
              onClick={() => setCurrentSlide(prev => prev === 0 ? 4 : prev - 1)}
              className="absolute left-3 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 sm:p-1.5 md:p-2 transition-all duration-200 z-10"
            >
              <svg className="w-4 h-4 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => setCurrentSlide(prev => prev === 4 ? 0 : prev + 1)}
              className="absolute right-3 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 sm:p-1.5 md:p-2 transition-all duration-200 z-10"
            >
              <svg className="w-4 h-4 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Slide Indicators */}
            <div className="absolute bottom-3 sm:bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-1.5 md:space-x-2">
              {[0, 1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-200 ${
                    currentSlide === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Fanclub Stats Below Carousel */}
          <div className="mt-4 sm:mt-4 md:mt-5 lg:mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-1.5 md:gap-2 lg:gap-2.5 text-xs">
              <div className="flex items-center space-x-1 bg-purple-50 px-2 sm:px-1.5 py-1 sm:py-0.5 rounded-full">
                <span className="text-purple-600 font-medium text-sm sm:text-xs">
                  {(fanclub.type || 'public') === 'public' ? 'Public' : 'Private'}
                </span>
              </div>
              <div className="flex items-center space-x-1 bg-gray-50 px-2 sm:px-1.5 py-1 sm:py-0.5 rounded-full">
                <Users className="w-3 h-3 sm:w-2.5 sm:h-2.5 text-gray-600" />
                <span className="text-gray-700 font-medium text-sm sm:text-xs">
                  {(fanclub.memberCount || fanclub.members || 0).toLocaleString()} members
                </span>
              </div>
              <div className="flex items-center space-x-1 bg-gray-50 px-2 sm:px-1.5 py-1 sm:py-0.5 rounded-full">
                <Calendar className="w-3 h-3 sm:w-2.5 sm:h-2.5 text-gray-600" />
                <span className="text-gray-700 font-medium text-sm sm:text-xs">Founded {fanclub.foundedDate || 'Unknown'}</span>
              </div>
              <div className="flex items-center space-x-1 bg-gray-50 px-2 sm:px-1.5 py-1 sm:py-0.5 rounded-full">
                <Building2 className="w-3 h-3 sm:w-2.5 sm:h-2.5 text-gray-600" />
                <span className="text-gray-700 font-medium text-sm sm:text-xs">{fanclub.category || 'General'}</span>
              </div>
              <div className="flex items-center space-x-1 bg-gray-50 px-2 sm:px-1.5 py-1 sm:py-0.5 rounded-full">
                <MapPin className="w-3 h-3 sm:w-2.5 sm:h-2.5 text-gray-600" />
                <span className="text-gray-700 font-medium text-sm sm:text-xs">{fanclub.location || 'Global'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* About Fanclub Section - Friends Profile Modal Style */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7 border-b border-gray-100">
          <h3 className="text-base sm:text-base md:text-lg lg:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3 sm:mb-3 md:mb-4">
            About {fanclub.name || 'Fanclub'}
          </h3>
          <p className="text-base sm:text-base md:text-lg text-gray-600 mb-3 sm:mb-4 md:mb-5">Fanclub focused on shared passions and dedicated enthusiasts</p>
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-100 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-3 sm:p-3 md:p-4 lg:p-5 xl:p-6 border border-purple-200">
            <p className="text-gray-700 leading-relaxed text-base sm:text-base md:text-lg italic">
              "{fanclub.description || 'A passionate fanclub focused on shared interests and meaningful connections.'}"
            </p>
          </div>
        </div>

        {/* Your Common Favorites Section - Detailed Matching */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7 border-b border-gray-100">
          <h3 className="text-base sm:text-base md:text-lg lg:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3 sm:mb-3 md:mb-4">
            Your Common Favorites with This Fanclub
          </h3>
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-100 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 border border-purple-200">
            <div className="mb-3 sm:mb-4 md:mb-5">
              <p className="text-base sm:text-base md:text-lg text-gray-700 mb-3 sm:mb-4">
                You share <strong>{(fanclub.sharedInterests || sampleSharedInterests).length}</strong> interests with this fanclub:
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                {(fanclub.sharedInterests || sampleSharedInterests).map((interest, index) => (
                  <span key={index} className="px-2 sm:px-2 md:px-3 py-1 sm:py-1 md:py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm sm:text-sm font-semibold rounded-full border border-purple-600 shadow-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-white/60 rounded-lg p-3 sm:p-4 md:p-5">
              <p className="text-base sm:text-base text-gray-600">
                <strong>Perfect Match!</strong> These shared interests mean you'll find fellow enthusiasts who understand your passion and can introduce you to new perspectives within these areas.
              </p>
            </div>
          </div>
        </div>

        {/* Other Member Favorites Section - Additional Matching */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7 border-b border-gray-100">
          <h3 className="text-base sm:text-base md:text-lg lg:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3 sm:mb-3 md:mb-4">
            Other Favorites Fanclub Members Love
          </h3>
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-100 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 border border-purple-200">
            <div className="mb-3 sm:mb-4 md:mb-5">
              <p className="text-base sm:text-base md:text-lg text-gray-700 mb-3 sm:mb-4">
                Beyond the main fanclub focus, members also love these favorites that match your interests:
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                {displayFavorites.map((favorite, index) => (
                  <span key={index} className="px-2 sm:px-2 md:px-3 py-1 sm:py-1 md:py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm sm:text-sm font-semibold rounded-full border border-purple-600 shadow-sm">
                    {favorite}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-white/60 rounded-lg p-3 sm:p-4 md:p-5">
              <p className="text-base sm:text-base text-gray-600">
                <strong>Bonus Connections!</strong> Even though these aren't the main focus of the fanclub, you'll find people who share these interests too, creating even more opportunities for meaningful connections.
              </p>
            </div>
          </div>
        </div>

        {/* Fanclub Core Values - Friends Profile Modal Style */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7 border-b border-gray-100">
          <h3 className="text-base sm:text-base md:text-lg lg:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3 sm:mb-3 md:mb-4">
            Fanclub Core Values & Culture
          </h3>
          <div className="flex space-x-2 sm:space-x-3 md:space-x-4 overflow-x-auto pb-3 sm:pb-3 md:pb-4 scrollbar-hide">
            {(fanclub.coreValues || []).map((value: string, index: number) => (
              <span
                key={index}
                className="flex-shrink-0 px-2 sm:px-2 md:px-3 py-1 sm:py-1 md:py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm sm:text-sm font-semibold rounded-full border border-purple-600 shadow-sm"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        {/* Fanclub Highlights - Most Celebrated Content */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7 border-b border-gray-100">
          <h3 className="text-base sm:text-base md:text-lg lg:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3 sm:mb-3 md:mb-4">
            Fanclub Highlights & Viral Moments
          </h3>
          <p className="text-base sm:text-base md:text-lg text-gray-600 mb-3 sm:mb-4 md:mb-5">See what the fanclub loves most - these are the moments that went viral and brought everyone together!</p>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Viral Post 1 - Image Post */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-4 border border-purple-200 relative overflow-hidden">
              <div className="absolute top-3 sm:top-2 right-3 sm:right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 sm:px-1.5 py-1 sm:py-0.5 rounded-full text-sm sm:text-xs font-bold flex items-center space-x-1">
                <span>VIRAL</span>
              </div>
              <div className="flex items-start space-x-3 sm:space-x-3">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face" 
                  alt="Sarah" 
                  className="w-10 h-10 sm:w-10 sm:h-10 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2 sm:mb-1">
                    <span className="font-medium text-gray-800 text-sm sm:text-sm">Sarah M.</span>
                    <span className="text-sm sm:text-xs text-gray-500">2 days ago</span>
                  </div>
                  <p className="text-base sm:text-base md:text-lg text-gray-700 mb-3 sm:mb-2">"Just finished this amazing project inspired by our shared interests! The fanclub feedback helped me make it perfect!"</p>
                  <div className="bg-white/60 rounded-lg p-3 sm:p-2 mb-3 sm:mb-2">
                    <img 
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop" 
                      alt="Project" 
                      className="w-full h-24 sm:h-24 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=200&fit=crop";
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-4 text-sm sm:text-xs text-gray-500">
                    <span className="flex items-center space-x-1 text-red-500 font-semibold">
                      <Heart className="w-4 h-4 sm:w-3 sm:h-3 fill-current" />
                      <span>2.4k</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4 sm:w-3 sm:h-3" />
                      <span>847</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Share2 className="w-4 h-4 sm:w-3 sm:h-3" />
                      <span>156</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Viral Post 2 - Text Post */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 border border-purple-200 relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1">
                <span>TRENDING</span>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" 
                  alt="Alex" 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-800 text-xs sm:text-sm">Alex J.</span>
                    <span className="text-xs text-gray-500">1 day ago</span>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-2">"Found the PERFECT spot that combines all our favorite interests! Who else thinks this fanclub has the best recommendations ever!"</p>
                  <div className="bg-white/60 rounded-lg p-2 mb-2">
                    <p className="text-sm italic text-purple-700">"This fanclub is pure gold! Every recommendation here is exactly what I needed." - Top comment</p>
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

            {/* Viral Post 3 - Fanclub Achievement */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 border border-purple-200 relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1">
                <span>EPIC</span>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <img 
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face" 
                  alt="Emma" 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-800 text-xs sm:text-sm">Emma K.</span>
                    <span className="text-xs text-gray-500">3 days ago</span>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-2">"WE DID IT! Our fanclub collaboration project just hit 10K supporters! This is what happens when people with the same passions come together!"</p>
                  <div className="bg-white/60 rounded-lg p-2 mb-2 flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      <img 
                        src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=24&h=24&fit=crop&crop=face" 
                        alt="" 
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=24&h=24&fit=crop&crop=face";
                        }}
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=24&h=24&fit=crop&crop=face" 
                        alt="" 
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=24&h=24&fit=crop&crop=face";
                        }}
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=24&h=24&fit=crop&crop=face" 
                        alt="" 
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=24&h=24&fit=crop&crop=face";
                        }}
                      />
                    </div>
                    <span className="text-xs text-purple-700 font-medium">+847 others collaborated</span>
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

        {/* Recent Activity Preview - Friends Profile Modal Style */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7 border-b border-gray-100">
          <h3 className="text-base sm:text-base md:text-lg lg:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3 sm:mb-3 md:mb-4">
            Recent Fanclub Activity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3 md:gap-4">
            {(fanclub.recentPosts || []).slice(0, 4).map((post) => (
              <div key={post.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 border border-purple-200">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <img 
                    src={post.avatar} 
                    alt={post.author} 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-800 text-xs sm:text-sm">{post.author}</span>
                      <span className="text-xs text-gray-500">{post.timestamp}</span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 line-clamp-2">{post.content}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
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

        {/* Member Stories - Friends Profile Modal Style */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7 border-b border-gray-100">
          <h3 className="text-base sm:text-base md:text-lg lg:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3 sm:mb-3 md:mb-4">
            Real People, Real Stories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3 md:gap-4">
            {(fanclub.memberStories || []).slice(0, 2).map((story) => (
              <div key={story.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 border border-purple-200">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <img 
                    src={story.avatar} 
                    alt={story.member} 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face";
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1 text-xs sm:text-sm md:text-base">{story.member}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-2">{story.story}</p>
                    <div className="bg-white/60 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
                      <p className="text-sm text-purple-700 font-medium">{story.impact}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button - Friends Profile Modal Style */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7">
          {!joinSuccess ? (
            <button
              onClick={handleJoinFanclub}
              disabled={isJoining}
              className={`w-full py-1.5 sm:py-2 md:py-2.5 lg:py-3 xl:py-3.5 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-xs sm:text-sm md:text-base lg:text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${
                isJoining
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700'
              }`}
            >
              {isJoining ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Joining...</span>
                </div>
              ) : (
                <span>Join Your Fanclub!</span>
              )}
            </button>
          ) : (
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                <span>Welcome to {fanclub.name || 'the Fanclub'}!</span>
              </h3>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                You're now part of an amazing fanclub! Redirecting you to the fanclub page...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FanclubProfileModal;
