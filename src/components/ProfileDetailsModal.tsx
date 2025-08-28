import React, { useState, useRef, useCallback } from 'react';
import { X, Heart, MessageCircle, MapPin, User, Star, Users, Calendar, Heart as HeartIcon, Globe, Check, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { generatePoeticDescription, defaultFavoriteCategories } from '../utils/poeticBioGenerator';

interface ProfileDetailsModalProps {
  profile: any;
  isOpen: boolean;
  onClose: () => void;
  onLike: (profileId: string) => void;
  onChat: (profileId: string) => void;
}

const ProfileDetailsModal: React.FC<ProfileDetailsModalProps> = ({
  profile,
  isOpen,
  onClose,
  onLike,
  onChat
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [likedFavorites, setLikedFavorites] = useState<Set<string>>(new Set());
  const [activeFavoritesTab, setActiveFavoritesTab] = useState<string>('Fav Singers');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFavoriteLike = (favoriteId: string) => {
    setLikedFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(favoriteId)) {
        newSet.delete(favoriteId);
      } else {
        newSet.add(favoriteId);
      }
      return newSet;
    });
  };

     // Photo carousel navigation functions
   const goToPreviousPhoto = () => {
     setCurrentPhotoIndex(prev => {
       if (prev === 0) return 19; // Wrap around to last photo (20 total - 1)
       return prev - 1;
     });
   };

   const goToNextPhoto = () => {
     setCurrentPhotoIndex(prev => {
       if (prev === 19) return 0; // Wrap around to first photo (20 total - 1)
       return prev + 1;
     });
   };

  const goToPhoto = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  // Keyboard navigation for photo carousel
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      goToPreviousPhoto();
    } else if (event.key === 'ArrowRight') {
      goToNextPhoto();
    }
  }, []);

  // Add keyboard event listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Handle escape key and body scroll
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '0px';

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restore body scrolling when modal is closed
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [onClose]);

  // Touch/swipe handlers for mobile
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextPhoto();
    }
    if (isRightSwipe) {
      goToPreviousPhoto();
    }
  };

  // Sample favorites data - in real app this would come from the profile
  const sampleFavorites: Record<string, Array<{ id: string; name: string; description: string; image: string }>> = {
    'Fav Singers': [
      { id: 'singer1', name: 'Taylor Swift', description: 'Pop superstar and songwriter', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'singer2', name: 'Ed Sheeran', description: 'British singer-songwriter', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'singer3', name: 'Adele', description: 'Powerful vocalist', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' }
    ],
    'Fav Songs': [
      { id: 'song1', name: 'Bohemian Rhapsody', description: 'Queen masterpiece', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'song2', name: 'Hotel California', description: 'Eagles classic', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'song3', name: 'Imagine', description: 'John Lennon anthem', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' }
    ],
    'Fav Music Categories': [
      { id: 'musiccat1', name: 'Rock', description: 'Classic rock music', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'musiccat2', name: 'Pop', description: 'Popular music', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'musiccat3', name: 'Jazz', description: 'Smooth jazz', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' }
    ],
    'Fav Music Composers': [
      { id: 'composer1', name: 'Ludwig van Beethoven', description: 'Classical composer', image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop' },
      { id: 'composer2', name: 'Wolfgang Mozart', description: 'Musical prodigy', image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop' },
      { id: 'composer3', name: 'Johann Bach', description: 'Baroque master', image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop' }
    ],
    'Fav Songwriters': [
      { id: 'songwriter1', name: 'Bob Dylan', description: 'Folk legend', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'songwriter2', name: 'Carole King', description: 'Songwriting icon', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'songwriter3', name: 'Paul Simon', description: 'Storytelling genius', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' }
    ],
    'Fav Music Bands': [
      { id: 'band1', name: 'The Beatles', description: 'Fab Four', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'band2', name: 'Queen', description: 'Rock royalty', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'band3', name: 'Pink Floyd', description: 'Progressive rock', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' }
    ],
    'Fav Idols': [
      { id: 'idol1', name: 'BTS', description: 'K-pop sensation', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'idol2', name: 'Blackpink', description: 'Global girl group', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'idol3', name: 'Twice', description: 'J-pop stars', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' }
    ],
    'Fav Singer Groups': [
      { id: 'group1', name: 'One Direction', description: 'Boy band', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'group2', name: 'Little Mix', description: 'Girl group', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
      { id: 'group3', name: 'Fifth Harmony', description: 'American group', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' }
    ],
    'Fav Movies': [
      { id: 'movie1', name: 'Inception', description: 'Mind-bending sci-fi thriller', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' },
      { id: 'movie2', name: 'The Dark Knight', description: 'Superhero masterpiece', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' },
      { id: 'movie3', name: 'Titanic', description: 'Epic romance', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' }
    ],
    'Fav Movie Categories': [
      { id: 'moviecat1', name: 'Action', description: 'High-energy films', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' },
      { id: 'moviecat2', name: 'Comedy', description: 'Funny movies', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' },
      { id: 'moviecat3', name: 'Drama', description: 'Emotional stories', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' }
    ],
    'Fav TV Series': [
      { id: 'tv1', name: 'Breaking Bad', description: 'Crime drama series', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' },
      { id: 'tv2', name: 'Game of Thrones', description: 'Fantasy epic', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' },
      { id: 'tv3', name: 'Friends', description: 'Classic sitcom', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' }
    ],
    'Fav TV Series Categories': [
      { id: 'tvcat1', name: 'Drama', description: 'Serious TV shows', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' },
      { id: 'tvcat2', name: 'Comedy', description: 'Funny TV shows', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' },
      { id: 'tvcat3', name: 'Reality', description: 'Reality TV', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' }
    ],
    'Fav Books': [
      { id: 'book1', name: '1984', description: 'Dystopian classic by Orwell', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' },
      { id: 'book2', name: 'The Great Gatsby', description: 'American literary classic', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' },
      { id: 'book3', name: 'To Kill a Mockingbird', description: 'Harper Lee masterpiece', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' }
    ],
    'Fav Book Categories': [
      { id: 'bookcat1', name: 'Fiction', description: 'Imaginative stories', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' },
      { id: 'bookcat2', name: 'Non-Fiction', description: 'Real stories', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' },
      { id: 'bookcat3', name: 'Mystery', description: 'Suspense novels', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' }
    ],
    'Fav Cartoons': [
      { id: 'cartoon1', name: 'SpongeBob SquarePants', description: 'Underwater adventures', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' },
      { id: 'cartoon2', name: 'Tom and Jerry', description: 'Classic cat and mouse', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' },
      { id: 'cartoon3', name: 'Looney Tunes', description: 'Warner Bros classics', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' }
    ],
    'Fav Comics': [
      { id: 'comic1', name: 'Spider-Man', description: 'Web-slinging hero', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' },
      { id: 'comic2', name: 'Batman', description: 'Dark knight detective', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' },
      { id: 'comic3', name: 'Superman', description: 'Man of steel', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' }
    ],
    'Fav Actors': [
      { id: 'actor1', name: 'Leonardo DiCaprio', description: 'Hollywood star', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' },
      { id: 'actor2', name: 'Meryl Streep', description: 'Acting legend', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' },
      { id: 'actor3', name: 'Tom Hanks', description: 'America\'s favorite', image: 'https://images.unsplash.com/photo-1624138784728-8e5d5d5b5b5b?w=400&h=400&fit=crop' }
    ],
    'Fav Sports': [
      { id: 'sport1', name: 'Football', description: 'Beautiful game', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop' },
      { id: 'sport2', name: 'Basketball', description: 'Fast-paced action', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop' },
      { id: 'sport3', name: 'Tennis', description: 'Elegant racket sport', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop' }
    ],
    'Fav Athletes': [
      { id: 'athlete1', name: 'Lionel Messi', description: 'Football legend', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop' },
      { id: 'athlete2', name: 'LeBron James', description: 'Basketball superstar', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop' },
      { id: 'athlete3', name: 'Serena Williams', description: 'Tennis champion', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop' }
    ],
    'Fav Travel Destinations': [
      { id: 'travel1', name: 'Paris, France', description: 'City of love and lights', image: 'https://images.unsplash.com/photo-1502602898535-8849d783c2b0?w=400&h=400&fit=crop' },
      { id: 'travel2', name: 'Tokyo, Japan', description: 'Modern metropolis', image: 'https://images.unsplash.com/photo-1502602898535-8849d783c2b0?w=400&h=400&fit=crop' },
      { id: 'travel3', name: 'New York City', description: 'The city that never sleeps', image: 'https://images.unsplash.com/photo-1502602898535-8849d783c2b0?w=400&h=400&fit=crop' }
    ],
    'Fav Travel Destination Categories': [
      { id: 'travelcat1', name: 'Beaches', description: 'Coastal destinations', image: 'https://images.unsplash.com/photo-1502602898535-8849d783c2b0?w=400&h=400&fit=crop' },
      { id: 'travelcat2', name: 'Mountains', description: 'Alpine adventures', image: 'https://images.unsplash.com/photo-1502602898535-8849d783c2b0?w=400&h=400&fit=crop' },
      { id: 'travelcat3', name: 'Cities', description: 'Urban exploration', image: 'https://images.unsplash.com/photo-1502602898535-8849d783c2b0?w=400&h=400&fit=crop' }
    ],
    'Fav Food/Cuisine': [
      { id: 'food1', name: 'Italian Cuisine', description: 'Pasta, pizza, and more', image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop' },
      { id: 'food2', name: 'Japanese Sushi', description: 'Fresh and healthy', image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop' },
      { id: 'food3', name: 'Indian Curry', description: 'Spicy and flavorful', image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop' }
    ],
    'Fav Food/Cuisine Categories': [
      { id: 'foodcat1', name: 'Asian', description: 'Eastern flavors', image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop' },
      { id: 'foodcat2', name: 'European', description: 'Western cuisine', image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop' },
      { id: 'foodcat3', name: 'Mexican', description: 'Latin American', image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop' }
    ],
    'Fav Shopping Brands': [
      { id: 'brand1', name: 'Nike', description: 'Athletic wear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop' },
      { id: 'brand2', name: 'Apple', description: 'Tech products', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop' },
      { id: 'brand3', name: 'Zara', description: 'Fashion retailer', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop' }
    ],
    'Fav Tech Gadgets': [
      { id: 'tech1', name: 'iPhone', description: 'Apple smartphone', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop' },
      { id: 'tech2', name: 'MacBook', description: 'Apple laptop', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop' },
      { id: 'tech3', name: 'AirPods', description: 'Wireless earbuds', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop' }
    ],
    'Fav Hobbies': [
      { id: 'hobby1', name: 'Photography', description: 'Capturing moments', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' },
      { id: 'hobby2', name: 'Cooking', description: 'Culinary arts', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' },
      { id: 'hobby3', name: 'Gardening', description: 'Growing plants', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' }
    ],
    'Fav Interests': [
      { id: 'interest1', name: 'Space Exploration', description: 'Cosmic discoveries', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' },
      { id: 'interest2', name: 'Ocean Life', description: 'Marine biology', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' },
      { id: 'interest3', name: 'Wildlife Photography', description: 'Nature captures', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' }
    ],
    'Fav Habits': [
      { id: 'habit1', name: 'Morning Exercise', description: 'Daily workout routine', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' },
      { id: 'habit2', name: 'Reading', description: 'Daily book time', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' },
      { id: 'habit3', name: 'Meditation', description: 'Mindfulness practice', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' }
    ],
    'Fav Animals': [
      { id: 'animal1', name: 'Dogs', description: 'Loyal companions', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' },
      { id: 'animal2', name: 'Cats', description: 'Independent pets', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' },
      { id: 'animal3', name: 'Elephants', description: 'Gentle giants', image: 'https://images.unsplash.com/photo-1446776811953-b23d0bd8431c?w=400&h=400&fit=crop' }
    ]
  };

  // Sample common favorites - in real app this would come from profile matching
  const sampleCommonFavorites = ['Taylor Swift', 'Inception', 'The Great Gatsby', 'Italian Cuisine', 'Paris, France', 'Football', 'Dogs'];

  const renderOtherFavoritesTab = () => {
    const favorites = sampleFavorites[activeFavoritesTab] || [];
    
    return (
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {/* Category Selector - Horizontal Scrolling Pills */}
        <div className="overflow-x-auto pb-1 sm:pb-2 scrollbar-hide">
          <div className="flex space-x-1 sm:space-x-2 md:space-x-3 min-w-max">
            {defaultFavoriteCategories.map(category => (
              <button
                key={category}
                onClick={() => setActiveFavoritesTab(category)}
                className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  activeFavoritesTab === category
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Category Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 flex items-center">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2 text-blue-600" />
            {activeFavoritesTab}
          </h4>
          <span className="text-xs sm:text-sm text-gray-500 font-medium">{favorites.length} items</span>
        </div>

        {/* Favorites Grid - Clean Card Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {favorites.map((favorite: any, index: number) => (
            <div key={favorite.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h6 className="font-bold text-gray-800 text-xs sm:text-sm truncate flex-1 mr-1 sm:mr-2">{favorite.name}</h6>
                <button
                  onClick={() => handleFavoriteLike(`${activeFavoritesTab}-${favorite.id}`)}
                  className={`p-1 sm:p-1.5 rounded-full transition-all duration-200 flex-shrink-0 ${
                    likedFavorites.has(`${activeFavoritesTab}-${favorite.id}`)
                      ? 'text-blue-500 bg-blue-100 shadow-sm'
                      : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 group-hover:bg-blue-50'
                  }`}
                >
                  <HeartIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                {favorite.image && (
                  <img
                    src={favorite.image}
                    alt={favorite.name}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-md object-cover shadow-sm flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop";
                    }}
                  />
                )}
                <p className="text-gray-600 text-xs flex-1 leading-relaxed">{favorite.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

    return (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 lg:p-4 xl:p-6" onClick={onClose}>
       <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg sm:shadow-xl md:shadow-2xl w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[900px] max-h-[95vh] overflow-y-auto mx-1 sm:mx-2 md:mx-3 lg:mx-4 overscroll-contain" onClick={(e) => e.stopPropagation()}>
                 {/* Modal Header */}
         <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-200">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
             <div className="flex flex-row items-center space-x-2 sm:space-x-3 md:space-x-4 w-full sm:w-auto">
               <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 break-words leading-tight">{profile.name}</h2>
               <div className="bg-blue-100 p-1.5 sm:p-2 rounded-full">
                 <Check className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-blue-600" />
               </div>
               <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 md:px-4 lg:px-5 py-1.5 sm:py-2 md:py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-xs sm:text-sm md:text-base font-bold">
                 <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                 <span>{profile.matchPercentage || 85}%</span>
               </div>
             </div>
             <button 
               onClick={onClose}
               className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-3.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors self-end sm:self-auto"
             >
               <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8" />
             </button>
           </div>
         </div>

                 {/* Profile Photos Carousel */}
         <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
          
                     {/* Sample photos array - in real app this would come from profile data */}
           {(() => {
             const samplePhotos = [
               profile.profileImage,
               'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb5e1?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
               'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop'
             ];
            
            return (
              <div className="relative">
                                 {/* Main Photo Display */}
                 <div 
                   className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[450px] h-[140px] sm:h-[160px] md:h-[200px] lg:h-[250px] xl:h-[300px] rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden mx-auto bg-gradient-to-r from-blue-50 to-indigo-100"
                   onTouchStart={onTouchStart}
                   onTouchMove={onTouchMove}
                   onTouchEnd={onTouchEnd}
                 >
                  <img
                    src={samplePhotos[currentPhotoIndex]}
                    alt={`${profile.name} - Photo ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop";
                    }}
                  />
                  
                  
                  
                                     {/* Navigation Arrows */}
                   <button 
                     className="absolute left-1 sm:left-2 md:left-3 lg:left-4 xl:left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-10"
                     onClick={goToPreviousPhoto}
                   >
                     <ChevronLeft className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />
                   </button>
                   
                   <button 
                     className="absolute right-1 sm:right-2 md:right-3 lg:right-4 xl:right-5 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-10"
                     onClick={goToNextPhoto}
                   >
                     <ChevronRight className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />
                   </button>
                </div>
                

                
                                                   {/* Photo Counter */}
                 <div className="absolute bottom-1 sm:bottom-2 md:bottom-3 lg:bottom-4 xl:bottom-5 right-1 sm:right-2 md:right-3 lg:right-4 xl:right-5 bg-black/50 text-white px-1 sm:px-1.5 md:px-2 lg:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                   {currentPhotoIndex + 1} of {samplePhotos.length}
                 </div>
              </div>
            );
          })()}
        </div>

                                   {/* Basic Profile Information */}
          <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">

                     {/* Secondary Information - Gender, Age, Location */}
           <div className="flex flex-row items-center justify-between space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-5">
             <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
               <User className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-blue-600" />
               <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700">{profile.gender || 'Not specified'}</span>
             </div>

             <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
               <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-blue-600" />
               <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700">{profile.age} years</span>
             </div>
             
             <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
               <MapPin className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-blue-600" />
               <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700 break-words">{profile.location}</span>
             </div>
           </div>
        </div>

                 {/* About Section */}
         <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
           <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-800 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5">About {profile.name}</h3>
           <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5">✨ Poetic Bio crafted from their All Time Favorites</p>
           <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border border-blue-200">
             <p className="text-gray-700 leading-relaxed text-xs sm:text-sm md:text-base italic">
               "{generatePoeticDescription(sampleFavorites, defaultFavoriteCategories)}"
             </p>
           </div>
         </div>

                 {/* Common Interests & Favorites Section */}
         <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
           <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5">Common Interests & Favorites</h3>
           <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border border-blue-200">
             <div className="flex space-x-1.5 sm:space-x-2 md:space-x-2.5 overflow-x-auto pb-1 sm:pb-2 md:pb-3 scrollbar-hide">
               {defaultFavoriteCategories.map((category: string, index: number) => (
                 <span
                   key={index}
                   className="flex-shrink-0 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-full border border-blue-600 shadow-sm"
                 >
                   {category}
                 </span>
               ))}
             </div>
           </div>
         </div>

        {/* All Time Favorites - One from each category */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4 lg:mb-5">All Time Favorites</h3>
          <div className="flex space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 xl:space-x-5 overflow-x-auto pb-1 sm:pb-2 md:pb-3 scrollbar-hide">
            {/* Music Related */}
            <div className="flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40 2xl:w-44 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Fav Singer</span>
              </div>
              <p className="text-xs font-semibold text-blue-900 break-words">Taylor Swift</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-indigo-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700">Fav Song</span>
              </div>
              <p className="text-xs font-semibold text-indigo-900 break-words">Blank Space</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Music Category</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">Pop</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-cyan-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600" />
                <span className="text-xs font-medium text-cyan-700">Music Composer</span>
              </div>
              <p className="text-xs font-semibold text-cyan-900">A.R. Rahman</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Songwriter</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">Ed Sheeran</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-indigo-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700">Music Band</span>
              </div>
              <p className="text-xs font-semibold text-indigo-900">Coldplay</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Fav Idol</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">BTS</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-cyan-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600" />
                <span className="text-xs font-medium text-cyan-700">Singer Group</span>
              </div>
              <p className="text-xs font-semibold text-cyan-900">Little Mix</p>
            </div>
            
            {/* Entertainment Related */}
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Fav Movie</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">Inception</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-indigo-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700">Movie Category</span>
              </div>
              <p className="text-xs font-semibold text-indigo-900">Sci-Fi</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Fav TV Series</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">Friends</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-cyan-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600" />
                <span className="text-xs font-medium text-cyan-700">TV Category</span>
              </div>
              <p className="text-xs font-semibold text-cyan-900">Comedy</p>
            </div>
            
            {/* Reading Related */}
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Fav Book</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">Harry Potter</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-indigo-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700">Book Category</span>
              </div>
              <p className="text-xs font-semibold text-indigo-900">Fantasy</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Fav Cartoon</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">Tom & Jerry</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-cyan-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600" />
                <span className="text-xs font-medium text-cyan-700">Fav Comic</span>
              </div>
              <p className="text-xs font-semibold text-cyan-900">Batman</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Fav Actor</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">Leonardo DiCaprio</p>
            </div>
            
            {/* Sports Related */}
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-indigo-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700">Fav Sport</span>
              </div>
              <p className="text-xs font-semibold text-indigo-900">Cricket</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Fav Athlete</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">Virat Kohli</p>
            </div>
            
            {/* Travel Related */}
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-cyan-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600" />
                <span className="text-xs font-medium text-cyan-700">Travel Destination</span>
              </div>
              <p className="text-xs font-semibold text-cyan-900">Paris</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Travel Category</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">Beach</p>
            </div>
            
            {/* Food Related */}
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-indigo-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700">Fav Food</span>
              </div>
              <p className="text-xs font-semibold text-indigo-900">Biryani</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Food Category</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">Indian</p>
            </div>
            
            {/* Tech & Shopping */}
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-cyan-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600" />
                <span className="text-xs font-medium text-cyan-700">Fav Brand</span>
              </div>
              <p className="text-xs font-semibold text-cyan-900">Nike</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Fav Gadget</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">iPhone</p>
            </div>
            
            {/* Hobbies & Interests */}
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-indigo-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700">Fav Hobby</span>
              </div>
              <p className="text-xs font-semibold text-indigo-900">Photography</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Fav Interest</span>
              </div>
              <p className="text-xs font-semibold text-blue-900">Space</p>
            </div>
            
            <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-cyan-200">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600" />
                <span className="text-xs font-medium text-cyan-700">Fav Animal</span>
              </div>
              <p className="text-xs font-semibold text-cyan-900">Dogs</p>
            </div>
          </div>
        </div>

        {/* Other Favorites Section */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-800 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5">Other Favorites</h3>
          {renderOtherFavoritesTab()}
        </div>

                 {/* Action Button */}
         <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6">
           <button
             onClick={() => {
               if (profile.isPrivate) {
                 console.log('Friend request sent to:', profile.name);
               } else {
                 console.log('Followed:', profile.name);
               }
             }}
             className={`w-full py-1.5 sm:py-2 md:py-2.5 lg:py-3 xl:py-3.5 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-xs sm:text-sm md:text-base lg:text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${
               profile.isPrivate
                 ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                 : 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-600'
             }`}
           >
             {profile.isPrivate ? 'Send Friend Request' : 'Follow'}
           </button>
         </div>
      </div>
    </div>
  );
};

export default ProfileDetailsModal;
