import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Users, Star, MessageCircle, Calendar, Sparkles, Music, Film, BookOpen, Utensils, ShoppingBag, Smartphone, Trophy, Palette, Coffee, Globe, Zap, MessageSquare, Search, User } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpotify, 
  faApple, 
  faYoutube, 
  faAmazon, 
  faPinterest, 
  faReddit, 
  faTwitter,
  faEbay,
  faMicrosoft
} from '@fortawesome/free-brands-svg-icons';
import RegistrationForm from './components/RegistrationForm';
import RegisterAuth from './components/RegisterAuth';
import RegisterOnboarding from './components/RegisterOnboarding';
import RegisterOnboardingGuard from './components/RegisterOnboardingGuard';
import LoveDashboard from './components/LoveDashboard';
import FriendsDashboard from './components/FriendsDashboard';
import UniverseSelection from './components/UniverseSelection';
import CommunityPage from './components/CommunityPage';
import FanclubPage from './components/FanclubPage';
import IndividualProfilePage from './components/IndividualProfilePage';
import ChatSystem from './components/ChatSystem';
import { ChatProvider } from './contexts/ChatContext';
import { supabase } from './lib/supabase';

function OnboardingGate({ userId }: { userId: string | null }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId) return;

      const hasCompletedOnboarding = async (id: string) => {
        const debug = (...args: any[]) => {
          if (import.meta.env?.MODE !== 'production') {
            console.log('[OnboardingGate]', ...args);
          }
        };

        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('id, onboarding_skipped')
          .eq('id', id)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profile) {
          debug('no profile row');
          return false;
        }
        if (profile.onboarding_skipped) {
          debug('onboarding_skipped=true');
          return true;
        }

        const { data: interests, error: interestsErr } = await supabase
          .from('user_interests')
          .select('user_id')
          .eq('user_id', id)
          .maybeSingle();

        if (interestsErr) {
          debug('user_interests error', interestsErr);
          return false;
        }
        if (!interests) {
          debug('missing user_interests row');
          return false;
        }

        const { data: prefs, error: prefsErr } = await supabase
          .from('user_preferences')
          .select('user_id')
          .eq('user_id', id)
          .maybeSingle();

        if (prefsErr) {
          debug('user_preferences error', prefsErr);
          return false;
        }
        if (!prefs) {
          debug('missing user_preferences row');
          return false;
        }

        debug('completed=true');
        return true;
      };

      // Allow the user to access registration/auth routes.
      const path = location.pathname;
      const isOnboardingRoute = path.startsWith('/register/onboarding');
      const isAuthRoute = path.startsWith('/register/auth');
      if (isAuthRoute) return;
      if (path === '/' || path === '/signin') return;

      try {
        const completed = await hasCompletedOnboarding(userId);
        if (cancelled) return;

        if (completed) {
          if (isOnboardingRoute) navigate('/universe-selection', { replace: true });
          return;
        }

        // Not completed -> force them into onboarding (including if they try to hit universe-selection directly).
        if (!isOnboardingRoute) {
          navigate('/register/onboarding/step/0', { replace: true });
        }
      } catch {
        // If we can't read onboarding state, be safe and send them to onboarding.
        if (cancelled) return;
        if (!isOnboardingRoute) navigate('/register/onboarding/step/0', { replace: true });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate, userId]);

  return null;
}

 function LoveDashboardRoute({ userId }: { userId: string }) {
   const navigate = useNavigate();

   return (
     <LoveDashboard
       userId={userId}
       onNavigate={(page) => {
         if (page === 'landing') navigate('/', { replace: false });
         if (page === 'registration') navigate('/register/auth', { replace: false });
         if (page === 'universe-selection') navigate('/universe-selection', { replace: false });
         if (page === 'friends-dashboard') navigate('/friends-dashboard/social-overview', { replace: false });
       }}
     />
   );
 }

 function LoveDashboardIndexRedirect() {
   return <Navigate to="love-overview" replace />;
 }

 function UniverseSelectionRoute() {
   const navigate = useNavigate();

   return (
     <UniverseSelection
       onSelectUniverse={(universe) => {
         if (universe === 'love') navigate('/love-dashboard/love-overview');
         if (universe === 'friends') navigate('/friends-dashboard/social-overview');
         if (universe === 'both') navigate('/love-dashboard/love-overview');
       }}
       onBack={() => navigate('/')}
     />
   );
 }

 function RegisterAuthRoute({ mode }: { mode?: 'signin' }) {
   const navigate = useNavigate();

   return <RegisterAuth mode={mode} onBack={() => navigate('/')} />;
 }

function App() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const sync = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        setUserId(data.session?.user?.id || null);
      } catch {
        if (!isMounted) return;
        setUserId(null);
      }
    };

    sync();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUserId(session?.user?.id || null);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return (
    <ChatProvider userId={userId || ''}>
      <Router>
      <OnboardingGate userId={userId} />
      <RoutePersistence />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<RegisterAuthRoute mode="signin" />} />
        <Route path="/register" element={<Navigate to="/register/auth" replace />} />
        <Route path="/register/auth" element={<RegisterAuthRoute />} />
        <Route element={<RegisterOnboardingGuard />}>
          <Route path="/register/onboarding/step/:step" element={<RegisterOnboarding />} />
        </Route>
        <Route path="/universe-selection" element={<UniverseSelectionRoute />} />
        {/* Love Dashboard Routes */}
        <Route path="/love-dashboard" element={<Navigate to="/love-dashboard/love-overview" replace />} />
        <Route path="/love-dashboard/*" element={<LoveDashboardRoute userId={userId || ''} />}>
          <Route index element={<LoveDashboardIndexRedirect />} />
          <Route path="love-overview" element={null} />
          <Route path="romantic-matches" element={null} />
          <Route path="its-a-match" element={null} />
          <Route path="love-messages" element={null} />
          <Route path="date-planning" element={null} />
          <Route path="date-requests" element={null} />

          <Route path="profile-modal/:profileId" element={null} />
          <Route path="ai-prompts-modal" element={null} />
          <Route path="date-planning-modal/:profileId" element={null} />
          <Route path="notifications-modal" element={null} />
          <Route path="challenge-modal" element={null} />
          <Route path="spinwheel-modal" element={null} />
          <Route path="spin-result-modal" element={null} />
        </Route>
        
        {/* Friends Dashboard Routes */}
        <Route path="/friends-dashboard" element={<Navigate to="/friends-dashboard/social-overview" replace />} />
        <Route path="/friends-dashboard/social-overview" element={<FriendsDashboard userId={userId || ''} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        <Route path="/friends-dashboard/friendship-matches" element={<FriendsDashboard userId={userId || ''} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        <Route path="/friends-dashboard/messages" element={<FriendsDashboard userId={userId} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        <Route path="/friends-dashboard/friend-requests" element={<FriendsDashboard userId={userId} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        <Route path="/friends-dashboard/communities-fanclubs" element={<FriendsDashboard userId={userId} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
                <Route path="/friends-dashboard/events" element={<FriendsDashboard userId={userId} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        
        {/* Modal and Popup Routes - Love Dashboard */}
        
        {/* Modal and Popup Routes - Friends Dashboard */}
        <Route path="/friends-dashboard/notifications-modal" element={<FriendsDashboard userId={userId} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        <Route path="/friends-dashboard/profile-modal/:profileId" element={<FriendsDashboard userId={userId} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        <Route path="/friends-dashboard/profile-details-modal/:profileId" element={<FriendsDashboard userId={userId} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        <Route path="/friends-dashboard/community-profile-modal/:communityId" element={<FriendsDashboard userId={userId || ''} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        <Route path="/friends-dashboard/fanclub-profile-modal/:fanclubId" element={<FriendsDashboard userId={userId || ''} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        <Route path="/friends-dashboard/ai-prompts-modal" element={<FriendsDashboard userId={userId || ''} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        <Route path="/friends-dashboard/meetup-planning-modal/:profileId" element={<FriendsDashboard userId={userId || ''} onNavigate={(page) => {
          console.log('onNavigate called with:', page);
          if (page === 'landing') window.location.href = '/';
          if (page === 'registration') window.location.href = '/register/auth';
          if (page === 'universe-selection') window.location.href = '/universe-selection';
          if (page === 'love-dashboard') window.location.href = '/love-dashboard/love-overview';
          if (page.startsWith('/profile/')) {
            console.log('onNavigate called with:', page);
            window.location.href = page;
          }
          if (page.startsWith('/community/')) window.location.href = page;
          if (page.startsWith('/fanclub/')) window.location.href = page;
        }} />} />
        {/* Modal and Popup Routes - Individual Profile Page */}
        <Route path="/profile/:profileId/follow-modal" element={<IndividualProfilePage 
          profileId={0} 
          userProfile={{
            id: 1,
            name: 'Alex Johnson',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face',
            interests: ['Technology', 'Programming', 'Artificial Intelligence', 'Innovation', 'Startups', 'Machine Learning', 'Data Science', 'Web Development']
          }}
        />} />
        <Route path="/profile/:profileId/message-modal" element={<IndividualProfilePage 
          profileId={0} 
          userProfile={{
            id: 1,
            name: 'Alex Johnson',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face',
            interests: ['Technology', 'Programming', 'Artificial Intelligence', 'Innovation', 'Startups', 'Machine Learning', 'Data Science', 'Web Development']
          }}
        />} />
        
        <Route path="/community/:communityId" element={<CommunityPage  
          communityId={0} 
          userProfile={{
            interests: ['Technology', 'Programming', 'Artificial Intelligence', 'Innovation', 'Startups', 'Machine Learning', 'Data Science', 'Web Development'],
            name: 'Alex Johnson',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
            role: 'moderator'
          }}
        />} />

        <Route path="/fanclub/:fanclubId" element={<FanclubPage 
          fanclubId={0} 
          userProfile={{
            interests: ['Technology', 'Programming', 'Artificial Intelligence', 'Innovation', 'Startups', 'Machine Learning', 'Data Science', 'Web Development'],
            name: 'Alex Johnson',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
            role: 'moderator',
            fanLevel: 'Active Fan'
          }}
        />} />
        
        <Route path="/profile/:profileId" element={<IndividualProfilePage 
          profileId={0} 
          userProfile={{
            id: 1,
            name: 'Alex Johnson',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
            interests: ['Technology', 'Programming', 'Artificial Intelligence', 'Innovation', 'Startups', 'Machine Learning', 'Data Science', 'Web Development']
          }}
        />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Router>
    </ChatProvider>
  );
}

const LAST_ROUTE_STORAGE_KEY = 'brandbond_last_route_v1';

function RoutePersistence() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasRestored, setHasRestored] = useState(false);

  const isPublicRoute = (pathname: string) => {
    if (pathname === '/') return true;
    if (pathname === '/signin') return true;
    if (pathname === '/register') return true;
    if (pathname.startsWith('/register/')) return true;
    return false;
  };

  // Global auth watcher: if session becomes invalid (e.g., user deleted), force logout + redirect.
  useEffect(() => {
    let isMounted = true;

    const clearAuthSensitiveStorage = () => {
      try {
        localStorage.removeItem('brandbond_registration_progress_v1');
        localStorage.removeItem(LAST_ROUTE_STORAGE_KEY);
      } catch {
        // ignore
      }
    };

    const ensureAuthedOrRedirect = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (!data.session) {
          if (isPublicRoute(location.pathname)) return;
          clearAuthSensitiveStorage();
          navigate('/', { replace: true });
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!isMounted) return;
        if (userError || !userData.user) {
          await supabase.auth.signOut();
          clearAuthSensitiveStorage();
          navigate('/', { replace: true });
        }
      } catch {
        // ignore
      }
    };

    ensureAuthedOrRedirect();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (!session) {
        if (isPublicRoute(location.pathname)) return;
        clearAuthSensitiveStorage();
        navigate('/', { replace: true });
      }
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [location.pathname, navigate]);

  // Restore last route on first mount
  useEffect(() => {
    if (hasRestored) return;
    setHasRestored(true);

    try {
      const last = localStorage.getItem(LAST_ROUTE_STORAGE_KEY);
      if (!last) return;

      // Only auto-redirect if user is at root (fresh reload) to avoid unexpected jumps.
      if (location.pathname === '/' && last !== '/') {
        navigate(last, { replace: true });
      }
    } catch {
      // ignore
    }
  }, [hasRestored, location.pathname, navigate]);

  // Persist on every route change
  useEffect(() => {
    try {
      localStorage.setItem(LAST_ROUTE_STORAGE_KEY, location.pathname + location.search + location.hash);
    } catch {
      // ignore
    }
  }, [location.pathname, location.search, location.hash]);

  return null;
}

// Original LandingPage component - just introduction, login, and register
const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(1);

  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate('/signin');
  };

  const handleGetStarted = () => {
    navigate('/register');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const showScreen = (screenNumber: number) => {
    setCurrentScreen(screenNumber);
  };

  // Auto-rotate through screens
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev % 7) + 1);
    }, 3000); // Change screen every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
  <div className="lp-page">
    {/* Header */}
    <header className="lp-header">
      <div className="lp-container">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="lp-logo-mark">
              <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="lp-logo-text">
              BrandBond
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={handleSignIn}
                className="lp-btn-nav"
              >
                <span>Sign In</span>
            </button>
            <button 
                onClick={handleGetStarted}
              className="lp-btn-primary"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-indigo-600 transition-colors duration-75 p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
        </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <button 
                onClick={handleSignIn}
                className="text-left text-gray-600 hover:text-indigo-600 transition-colors duration-75 py-2 px-4 rounded-lg hover:bg-gray-50"
              >
                <span>Sign In</span>
              </button>
              <button 
                onClick={handleGetStarted}
                className="text-left bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-75"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </header>

    {/* Hero Section - EXACTLY THE SAME, NO CHANGES */}
    <section className="lp-section lp-section-y-lg px-6 sm:px-8 lg:px-12 xl:px-16">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-pink-50"></div>
      <div className="absolute top-20 left-4 sm:left-10 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-r from-indigo-200 to-pink-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-20 right-4 sm:right-10 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-r from-pink-200 to-indigo-200 rounded-full opacity-20 blur-xl"></div>
      
      <div className="relative max-w-6xl mx-auto text-center">
        <div className="lp-pill mb-6 sm:mb-8 animate-pulse">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          <span className="text-xs sm:text-sm font-medium text-gray-700">✨ 2.5M+ people found their perfect match</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
          Stop Swiping & Scrolling.
          <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Start Connecting.
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-3xl sm:max-w-4xl mx-auto leading-relaxed px-4">
          Imagine meeting someone who <span className="font-semibold text-blue-600">actually gets you</span>. 
          Who loves the same music, binge-watches the same shows, and dreams of the same adventures. 
        </p>
        
        {/* Highlighted Brand Line */}
        <div className="mb-6 sm:mb-8 px-4">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full inline-block shadow-md border border-indigo-200">
            That's not luck, that's <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">BrandBond</span>
          </p>
        </div>
        
        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-10 max-w-3xl sm:max-w-4xl mx-auto leading-relaxed px-4">
          <span className="block">That's what BrandBond delivers - real connections based on real compatibility.</span>
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handleGetStarted}
            className="lp-btn-primary text-base sm:text-lg sm:px-8 sm:py-4"
          >
            Get Started
          </button>
          <button 
            onClick={handleSignIn}
            className="lp-btn-secondary text-base sm:text-lg sm:px-8 sm:py-4"
          >
            Sign In
          </button>
        </div>



                  {/* Hero Section - 4 Mobile Screens Side by Side */}
          <div className="mt-8 sm:mt-12 md:mt-16 flex justify-center px-2 sm:px-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10">
            {/* Mobile Screen 1 - Welcome/Onboarding */}
            <div className="relative">
              <div className="relative mx-auto w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 2xl:w-88">
                {/* iPhone frame with proper mobile proportions */}
                <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-1 sm:p-1.5 md:p-2 shadow-lg sm:shadow-xl md:shadow-2xl border border-gray-700">
                  {/* iPhone Side Buttons */}
                  <div className="absolute left-0 top-12 sm:top-16 md:top-20 lg:top-24 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute left-0 top-20 sm:top-28 md:top-32 lg:top-40 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute right-0 top-16 sm:top-20 md:top-24 lg:top-32 w-0.5 sm:w-1 h-5 sm:h-7 md:h-10 bg-gray-700 rounded-l-sm"></div>
                  
                  {/* Screen */}
                  <div className="bg-black rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
                    {/* iPhone Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 lg:w-24 h-3 sm:h-4 md:h-5 lg:h-6 bg-black rounded-b-lg sm:rounded-b-xl md:rounded-b-2xl z-20"></div>
                    
                    {/* Status Bar */}
                    <div className="bg-black text-white text-[10px] sm:text-xs px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3 flex justify-between items-center relative z-10">
                      <span className="font-medium">9:41</span>
                      <div className="flex items-center space-x-0.5 sm:space-x-1">
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
            </div>
          </div>
          
                    {/* App Content */}
                    <div className="bg-gradient-to-br from-indigo-50 to-pink-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 h-72 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem]">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5">
                        <Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
            </div>
                      <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">Welcome to BrandBond</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">Connect through shared passions</p>
          </div>
          
                    {/* iPhone Home Indicator */}
                    <div className="bg-black py-1.5 sm:py-2 md:py-3 flex justify-center">
                      <div className="w-8 sm:w-12 md:w-16 lg:w-20 h-0.5 sm:h-1 bg-white rounded-full opacity-80"></div>
            </div>
                  </div>
                </div>
              </div>
          </div>
          
            {/* Mobile Screen 2 - Profile Setup */}
            <div className="relative">
              <div className="relative mx-auto w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 2xl:w-88">
                {/* iPhone frame with proper mobile proportions */}
                <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-1 sm:p-1.5 md:p-2 shadow-lg sm:shadow-xl md:shadow-2xl border border-gray-700">
                  {/* iPhone Side Buttons */}
                  <div className="absolute left-0 top-12 sm:top-16 md:top-20 lg:top-24 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute left-0 top-20 sm:top-28 md:top-32 lg:top-40 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute right-0 top-16 sm:top-20 md:top-24 lg:top-32 w-0.5 sm:w-1 h-5 sm:h-7 md:h-10 bg-gray-700 rounded-l-sm"></div>
                  
                  {/* Screen */}
                  <div className="bg-black rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
                    {/* iPhone Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 lg:w-24 h-3 sm:h-4 md:h-5 lg:h-6 bg-black rounded-b-lg sm:rounded-b-xl md:rounded-b-2xl z-20"></div>
                    
                    {/* Status Bar */}
                    <div className="bg-black text-white text-[10px] sm:text-xs px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3 flex justify-between items-center relative z-10">
                      <span className="font-medium">9:41</span>
                      <div className="flex items-center space-x-0.5 sm:space-x-1">
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
            </div>
          </div>
                    
                    {/* App Content */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 h-72 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem]">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5">
                        <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                      </div>
                      <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">Create Your Profile</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">Share your interests & passions</p>
        </div>

                    {/* iPhone Home Indicator */}
                    <div className="bg-black py-1.5 sm:py-2 md:py-3 flex justify-center">
                      <div className="w-8 sm:w-12 md:w-16 lg:w-20 h-0.5 sm:h-1 bg-white rounded-full opacity-80"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Screen 3 - Discovery */}
            <div className="relative">
              <div className="relative mx-auto w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 2xl:w-88">
                {/* iPhone frame with proper mobile proportions */}
                <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-1 sm:p-1.5 md:p-2 shadow-lg sm:shadow-xl md:shadow-2xl border border-gray-700">
                  {/* iPhone Side Buttons */}
                  <div className="absolute left-0 top-12 sm:top-16 md:top-20 lg:top-24 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute left-0 top-20 sm:top-28 md:top-32 lg:top-40 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute right-0 top-16 sm:top-20 md:top-24 lg:top-32 w-0.5 sm:w-1 h-5 sm:h-7 md:h-10 bg-gray-700 rounded-l-sm"></div>
                  
                  {/* Screen */}
                  <div className="bg-black rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
                    {/* iPhone Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 lg:w-24 h-3 sm:h-4 md:h-5 lg:h-6 bg-black rounded-b-lg sm:rounded-b-xl md:rounded-b-2xl z-20"></div>
                    
                    {/* Status Bar */}
                    <div className="bg-black text-white text-[10px] sm:text-xs px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3 flex justify-between items-center relative z-10">
                      <span className="font-medium">9:41</span>
                      <div className="flex items-center space-x-0.5 sm:space-x-1">
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* App Content */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 h-72 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem]">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5">
                        <Search className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                      </div>
                      <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">Discover Matches</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">Find people who share your world</p>
                    </div>
                    
                    {/* iPhone Home Indicator */}
                    <div className="bg-black py-1.5 sm:py-2 md:py-3 flex justify-center">
                      <div className="w-8 sm:w-12 md:w-16 lg:w-20 h-0.5 sm:h-1 bg-white rounded-full opacity-80"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Screen 4 - Chat */}
            <div className="relative">
              <div className="relative mx-auto w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 2xl:w-88">
                {/* iPhone frame with proper mobile proportions */}
                <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-1 sm:p-1.5 md:p-2 shadow-lg sm:shadow-xl md:shadow-2xl border border-gray-700">
                  {/* iPhone Side Buttons */}
                  <div className="absolute left-0 top-12 sm:top-16 md:top-20 lg:top-24 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute left-0 top-20 sm:top-28 md:top-32 lg:top-40 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute right-0 top-16 sm:top-20 md:top-24 lg:top-32 w-0.5 sm:w-1 h-5 sm:h-7 md:h-10 bg-gray-700 rounded-l-sm"></div>
                  
                  {/* Screen */}
                  <div className="bg-black rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
                    {/* iPhone Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 lg:w-24 h-3 sm:h-4 md:h-5 lg:h-6 bg-black rounded-b-lg sm:rounded-b-xl md:rounded-b-2xl z-20"></div>
                    
                    {/* Status Bar */}
                    <div className="bg-black text-white text-[10px] sm:text-xs px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3 flex justify-between items-center relative z-10">
                      <span className="font-medium">9:41</span>
                      <div className="flex items-center space-x-0.5 sm:space-x-1">
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* App Content */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 h-72 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem]">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5">
                        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-2 sm:mb-3 text-center">Start Conversations</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">Connect & build relationships</p>
                    </div>
                    
                    {/* iPhone Home Indicator */}
                    <div className="bg-black py-1.5 sm:py-2 md:py-3 flex justify-center">
                      <div className="w-8 sm:w-12 md:w-16 lg:w-20 h-0.5 sm:h-1 bg-white rounded-full opacity-80"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* New: The Only App You Need Section */}
    <section className="lp-section lp-section-y bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-6 sm:px-8 lg:px-12 xl:px-16">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-4 sm:left-0 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-r from-indigo-200 to-pink-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-0 right-4 sm:right-0 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-r from-pink-200 to-indigo-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-cyan-200 to-blue-200 rounded-full opacity-20 blur-xl"></div>
      </div>
      
      <div className="lp-container relative z-10">
        {/* Header Section - Centered */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="lp-pill-accent px-4 sm:px-6 py-3 sm:py-4 mb-6 sm:mb-8 shadow-lg">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
            <span className="text-sm sm:text-base font-semibold text-pink-700">Your Perfect World</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
            The Only App You Need to
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Connect to Your World
            </span>
          </h2>
          <p className="lp-p-lg max-w-3xl sm:max-w-4xl mx-auto">
            One platform. Three ways to connect. Infinite possibilities.
          </p>
        </div>
        
        {/* Main Content Grid - Mobile App Showcase Left, Content Right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 sm:gap-16 lg:gap-20 items-center">
          
          {/* Left Side - Mobile App Showcase */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            <div className="relative overflow-hidden">
              {/* Mobile Device Frame */}
              <div className="relative mx-auto w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 2xl:w-88">
                {/* iPhone frame with proper mobile proportions */}
                <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-1 sm:p-1.5 md:p-2 shadow-lg sm:shadow-xl md:shadow-2xl border border-gray-700">
                  {/* iPhone Side Buttons */}
                  <div className="absolute left-0 top-12 sm:top-16 md:top-20 lg:top-24 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute left-0 top-20 sm:top-28 md:top-32 lg:top-40 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute right-0 top-16 sm:top-20 md:top-24 lg:top-32 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-l-sm"></div>
                  
                  {/* Screen */}
                  <div className="bg-black rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
                    {/* iPhone Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 lg:w-24 h-3 sm:h-4 md:h-5 lg:h-6 bg-black rounded-b-lg sm:rounded-b-xl md:rounded-b-2xl z-20"></div>
                    
                    {/* Status Bar */}
                    <div className="bg-black text-white text-[10px] sm:text-xs px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3 flex justify-between items-center relative z-10">
                      <span className="font-medium">9:41</span>
                      <div className="flex items-center space-x-0.5 sm:space-x-1">
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* App Screens Slideshow */}
                    <div className="relative h-72 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem] overflow-hidden">
                      {/* Screen 1 - Welcome/Onboarding */}
                                              <div className={`absolute inset-0 bg-gradient-to-br from-indigo-50 to-pink-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 transition-opacity duration-1000 ${currentScreen === 1 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5">
                            <Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                          </div>
                          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">Welcome to BrandBond</h3>
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">Connect through shared passions</p>
                        </div>
                      
                                              {/* Screen 2 - Profile Setup */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 transition-opacity duration-1000 ${currentScreen === 2 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5">
                            <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                          </div>
                          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">Create Your Profile</h3>
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">Share your interests & passions</p>
                        </div>
                      
                                              {/* Screen 3 - Discovery */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 transition-opacity duration-1000 ${currentScreen === 3 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5">
                            <Search className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                          </div>
                          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">Discover Matches</h3>
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">Find people who share your world</p>
                        </div>
                      
                                              {/* Screen 4 - Chat */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 transition-opacity duration-1000 ${currentScreen === 4 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5">
                            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                          </div>
                          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">Start Conversations</h3>
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">Connect & build relationships</p>
                        </div>
                      
                                              {/* Screen 5 - Communities */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 transition-opacity duration-1000 ${currentScreen === 5 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5">
                            <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                          </div>
                          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">Join Communities</h3>
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">Connect with fellow enthusiasts</p>
                        </div>
                      
                                              {/* Screen 6 - Events */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-red-50 to-pink-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 transition-opacity duration-1000 ${currentScreen === 6 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5">
                            <Calendar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                          </div>
                          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">Attend Events</h3>
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">Meet people in real life</p>
                        </div>
                      
                      {/* Screen 7 - Success Story */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6 transition-opacity duration-1000 ${currentScreen === 7 ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                          <Star className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Your Success Story</h3>
                        <p className="text-sm text-gray-600 text-center">Build meaningful connections</p>
                      </div>
                    </div>
                    
                    {/* iPhone Home Indicator */}
                    <div className="bg-black py-3 flex justify-center">
                      <div className="w-20 h-1 bg-white rounded-full opacity-80"></div>
                    </div>
                  </div>
                </div>
                

              </div>
              
              {/* Navigation Dots */}
              <div className="flex justify-center space-x-2 mt-6">
                {[1, 2, 3, 4, 5, 6, 7].map((screen) => (
                  <button
                    key={screen}
                    onClick={() => showScreen(screen)}
                    className={`w-3 h-3 rounded-full transition-colors duration-150 ${currentScreen === screen ? 'bg-indigo-500' : 'bg-gray-300 hover:bg-indigo-400'}`}
                  ></button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Side - Content */}
          <div className="order-1 lg:order-2 lg:col-span-3">
        {/* Three Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="lp-card lp-card-round lp-card-hover">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-indigo-200 to-indigo-300 rounded-full opacity-30 -translate-y-4 sm:-translate-y-8 md:-translate-y-12 lg:-translate-y-16 translate-x-4 sm:translate-x-8 md:translate-x-12 lg:translate-x-16"></div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-600">1</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center relative z-10">One Platform</h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed relative z-10">
              Everything you need in one place. No more switching between apps.
            </p>
          </div>
          
          <div className="lp-card lp-card-round lp-card-hover">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full opacity-30 -translate-y-4 sm:-translate-y-8 md:-translate-y-12 lg:-translate-y-16 translate-x-4 sm:translate-x-8 md:translate-x-12 lg:translate-x-16"></div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-pink-600">3</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center relative z-10">Three Ways to Connect</h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed relative z-10">
              Love, friendship, and community - all through shared passions.
            </p>
          </div>
          
          <div className="lp-card lp-card-round lp-card-hover">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-purple-200 to-violet-200 rounded-full opacity-30 -translate-y-4 sm:-translate-y-8 md:-translate-y-12 lg:-translate-y-16 translate-x-4 sm:translate-x-8 md:translate-x-12 lg:translate-x-16"></div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">∞</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center relative z-10">Infinite Possibilities</h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed relative z-10">
                            Endless connections await through your unique interests.
             </p>
          </div>
        </div>
        
        {/* Benefits Description */}
        <div className="text-center mb-8 sm:mb-12">
              <p className="text-lg sm:text-xl text-gray-700 max-w-3xl sm:max-w-4xl mx-auto leading-relaxed mb-6 sm:mb-8">
            Find romantic dates, discover new friends, and join communities - all through the things you love.
          </p>
          
          {/* No More Swiping Badge */}
          <div className="inline-flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full border border-blue-200 shadow-lg max-w-xs sm:max-w-none mx-auto">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm sm:text-base md:text-lg font-semibold text-blue-700 text-center">
              No more swiping. No more guessing.
            </span>
            <span className="text-sm sm:text-base md:text-lg text-gray-700 text-center">Just real connections.</span>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
        </div>
        
        {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button 
            onClick={handleGetStarted}
            className="lp-btn-primary text-base sm:text-lg sm:px-8 sm:py-4"
          >
            Get Started
          </button>
          <button 
            onClick={handleSignIn}
            className="lp-btn-secondary text-base sm:text-lg sm:px-8 sm:py-4"
          >
            Sign In
          </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* New: Welcome & Value Proposition Section */}
    <section className="lp-section lp-section-y bg-white px-6 sm:px-8 lg:px-12 xl:px-16">
      
      
      <div className="lp-container relative z-10">
                 {/* Header Section - More section-like */}
         <div className="mb-12 sm:mb-16">
           <div className="lp-chip px-3 sm:px-4 py-2 sm:py-3 mb-4 sm:mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
              <span className="lp-chip-text">Your Perfect Match Awaits</span>
            </div>
           <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
             Find Love, Build Friendships, 
             <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
               Join Communities
             </span>
            </h2>
           <p className="text-base sm:text-lg text-gray-600 max-w-2xl sm:max-w-3xl leading-relaxed">
              All through shared passions that make your heart skip a beat. Whether you're looking for your soulmate, 
              your next best friend, or a community that speaks your language - BrandBond connects you with people 
              who truly understand your world.
            </p>
              </div>
        
        
        
                 {/* Features Grid - More section-like */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
                     <div className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 relative overflow-hidden">
             <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4 relative z-10 group-hover:scale-105 transition-transform">
               <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-pink-600" />
              </div>
             <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 text-center relative z-10">Romantic Dates</h3>
             <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed relative z-10">
               Find your soulmate through shared passions and genuine compatibility
             </p>
            </div>
          
                     <div className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 relative overflow-hidden">
             <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4 relative z-10 group-hover:scale-105 transition-transform">
               <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
          </div>
             <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 text-center relative z-10">New Friends</h3>
             <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed relative z-10">
               Build meaningful friendships based on shared interests and values
             </p>
                </div>
          
          <div className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 relative overflow-hidden">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4 relative z-10 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
                </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 text-center relative z-10">Communities</h3>
            <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed relative z-10">
              Join groups that share your passions and create lasting bonds
            </p>
                </div>
          
          <div className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 relative overflow-hidden">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 relative z-10 group-hover:scale-105 transition-transform">
              <Star className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600" />
                </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 text-center relative z-10">Fan Clubs</h3>
            <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed relative z-10">
              Connect with fellow enthusiasts and share your passion
            </p>
          </div>
        </div>
        
        {/* Supporting Image - Clean and integrated */}
        <div className="mt-12 sm:mt-16 md:mt-20">
          <div className="relative max-w-5xl mx-auto">
            {/* Main image with enhanced styling */}
            <div className="relative p-6 sm:p-8">
              <img 
                src="https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="People connecting through shared interests and passions" 
                className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover rounded-2xl shadow-2xl border border-gray-100"
              />
              
              {/* Overlay content for better integration */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-lg border border-white/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900">Real Connections</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Built on shared passions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* New: You can use BrandBond to Section */}
    <section className="lp-section lp-section-y bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-6 sm:px-8 lg:px-12 xl:px-16">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-chip mb-4 sm:mb-6">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
            <span className="lp-chip-text">Core Features</span>
          </div>
          <h2 className="lp-section-title">
            You can use BrandBond to
          </h2>
          <p className="lp-section-subtitle">
            Discover the four core ways BrandBond transforms how you connect with people
          </p>
        </div>
        
        <div className="lp-grid-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-150 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full opacity-30 -translate-y-10 sm:-translate-y-16 translate-x-10 sm:translate-x-16"></div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center relative z-10">Find Romantic Dates</h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed relative z-10">
              Connect with potential partners who share your taste in music, movies, books, and lifestyle choices. 
              Build meaningful relationships based on genuine compatibility.
            </p>
            {/* Core Feature Image */}
            <div className="mt-4 sm:mt-6 relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                alt="Romantic couple sharing interests" 
                className="w-full h-24 sm:h-32 object-cover rounded-xl shadow-md"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-150 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-30 -translate-y-10 sm:-translate-y-16 translate-x-10 sm:translate-x-16"></div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center relative z-10">Discover New Friends</h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed relative z-10">
              Meet people who love the same things you do - from favorite artists to travel destinations. 
              Form friendships that go beyond surface-level connections.
            </p>
            {/* Core Feature Image */}
            <div className="mt-4 sm:mt-6 relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                alt="Friends connecting through shared interests" 
                className="w-full h-24 sm:h-32 object-cover rounded-xl shadow-md"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-150 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 -translate-y-10 sm:-translate-y-16 translate-x-10 sm:translate-x-16"></div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center relative z-10">Join Communities</h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed relative z-10">
              Be part of groups centered around your passions - music genres, TV shows, hobbies, and more. 
              Share experiences and create lasting bonds.
            </p>
            {/* Core Feature Image */}
            <div className="mt-4 sm:mt-6 relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                alt="Community group discussion and connection" 
                className="w-full h-24 sm:h-32 object-cover rounded-xl shadow-md"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-150 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-30 -translate-y-10 sm:-translate-y-16 translate-x-10 sm:translate-x-16"></div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center relative z-10">Create Fan Clubs</h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed relative z-10">
              Start or join fan clubs for your favorite artists, shows, books, or hobbies. 
              Connect with fellow enthusiasts and share your passion.
            </p>
            {/* Core Feature Image */}
            <div className="mt-4 sm:mt-6 relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                alt="Fans celebrating shared passion and interests" 
                className="w-full h-24 sm:h-32 object-cover rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Enhanced: Features Section */}
    <section className="lp-section lp-section-y-lg bg-white px-6 sm:px-8 lg:px-12 xl:px-16">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-chip mb-4 sm:mb-6">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
            <span className="lp-chip-text">Why Choose Us</span>
          </div>
          <h2 className="lp-section-title">
              Why Choose BrandBond?
          </h2>
            <p className="lp-section-subtitle">
              Our platform ensures you get the perfect experience for your specific needs
            </p>
          </div>
          
          <div className="lp-grid-3">
            <div className="text-center p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full opacity-20 -translate-y-10 sm:-translate-y-16 md:-translate-y-20 translate-x-10 sm:translate-x-16 md:translate-x-20"></div>
              <div className="w-16 h-16 sm:w-20 h-20 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                <Heart className="w-8 h-8 sm:w-10 h-10 text-pink-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 relative z-10">Romantic Matching</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed relative z-10">
                Find romantic connections with compatibility scoring and relationship building tools. 
                Our AI understands your preferences in music, movies, books, and lifestyle to find your perfect match.
              </p>
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 relative z-10">
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                  <Music className="w-3 h-3 sm:w-4 h-4" />
                  <span>Music Taste</span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                  <Film className="w-3 h-3 sm:w-4 h-4" />
                  <span>Movie Love</span>
                </div>
              </div>
              {/* Feature Image */}
              <div className="mt-4 sm:mt-6 relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                  alt="Perfect match through shared interests" 
                  className="w-full h-20 sm:h-24 object-cover rounded-xl border border-pink-100"
                />
              </div>
          </div>
          
            <div className="text-center p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-20 -translate-y-10 sm:-translate-y-16 md:-translate-y-20 translate-x-10 sm:translate-x-16 md:translate-x-20"></div>
              <div className="w-16 h-16 sm:w-20 h-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                <Users className="w-8 h-8 sm:w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 relative z-10">Community Focus</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed relative z-10">
                Build friendships through shared interests, join communities, and attend exciting events. 
                Connect with people who share your passion for specific hobbies, travel destinations, and lifestyle choices.
              </p>
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 relative z-10">
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                  <Globe className="w-3 h-3 sm:w-4 h-4" />
                  <span>Travel Buddies</span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                  <Coffee className="w-3 h-3 sm:w-4 h-4" />
                  <span>Food Lovers</span>
                </div>
              </div>
              {/* Feature Image */}
              <div className="mt-4 sm:mt-6 relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                  alt="Community building through shared interests" 
                  className="w-full h-20 sm:h-24 object-cover rounded-xl border border-blue-100"
                />
              </div>
          </div>
          
            <div className="text-center p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 -translate-y-10 sm:-translate-y-16 md:-translate-y-20 translate-x-10 sm:translate-x-16 md:translate-x-20"></div>
              <div className="w-16 h-16 sm:w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                <Star className="w-8 h-8 sm:w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 relative z-10">Smart Connections</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed relative z-10">
                AI-powered matching that understands your interests and lifestyle. From favorite shopping brands 
                to tech gadgets, we find people who share your world view and daily choices.
              </p>
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 relative z-10">
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                  <ShoppingBag className="w-3 h-3 sm:w-4 h-4" />
                  <span>Brand Love</span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                  <Smartphone className="w-3 h-3 sm:w-4 h-4" />
                  <span>Tech Taste</span>
                </div>
              </div>
              {/* Feature Image */}
              <div className="mt-4 sm:mt-6 relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                  alt="AI-powered smart matching technology" 
                  className="w-full h-20 sm:h-24 object-cover rounded-xl border border-purple-100"
                />
              </div>
            </div>
        </div>
      </div>
    </section>

    {/* New: What Makes You Unique Section */}
    <section className="py-12 sm:py-16 md:py-20 px-6 sm:px-8 lg:px-12 xl:px-16 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-blue-100 px-3 sm:px-4 py-2 rounded-full mb-4 sm:mb-6">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
            <span className="text-xs sm:text-sm font-semibold text-pink-700">Your Uniqueness</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            What Makes You Unique?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl sm:max-w-3xl mx-auto">
            BrandBond matches you based on the things that truly define who you are
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center p-4 sm:p-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="w-12 h-12 sm:w-16 h-16 bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 relative z-10">
              <Music className="w-6 h-6 sm:w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 relative z-10">Music & Artists</h3>
            <p className="text-xs sm:text-sm text-gray-600 relative z-10">Fav singers, songs, bands, composers</p>
            <div className="absolute top-2 right-2 w-6 h-6 sm:w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
            {/* Preference Image */}
            <div className="mt-3 sm:mt-4 relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                alt="Music and artists preferences" 
                className="w-full h-16 sm:h-20 object-cover rounded-xl border border-pink-100"
              />
            </div>
          </div>
          
          <div className="text-center p-4 sm:p-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="w-12 h-12 sm:w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 relative z-10">
              <Film className="w-6 h-6 sm:w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 relative z-10">Entertainment</h3>
            <p className="text-xs sm:text-sm text-gray-600 relative z-10">Movies, TV shows, books, cartoons</p>
            <div className="absolute top-2 right-2 w-6 h-6 sm:w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
            {/* Preference Image */}
            <div className="mt-3 sm:mt-4 relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1489599830792-4b8b0f0b0b0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                alt="Movies, TV shows and entertainment preferences" 
                className="w-full h-16 sm:h-20 object-cover rounded-xl border border-blue-100"
              />
            </div>
          </div>
          
          <div className="text-center p-4 sm:p-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="w-12 h-12 sm:w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 relative z-10">
              <Utensils className="w-6 h-6 sm:w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 relative z-10">Lifestyle</h3>
            <p className="text-xs sm:text-sm text-gray-600 relative z-10">Food, travel, shopping, hobbies</p>
            <div className="absolute top-2 right-2 w-6 h-6 sm:w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
            {/* Real image */}
            <div className="mt-3 sm:mt-4 relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                alt="Food, travel and lifestyle preferences" 
                className="w-full h-16 sm:h-20 object-cover rounded-xl border border-purple-100"
              />
            </div>
          </div>
          
          <div className="text-center p-4 sm:p-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="w-12 h-12 sm:w-16 h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 relative z-10">
              <Trophy className="w-6 h-6 sm:w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 relative z-10">Passions</h3>
            <p className="text-xs sm:text-sm text-gray-600 relative z-10">Sports, interests, habits, dreams</p>
            <div className="absolute top-2 right-2 w-6 h-6 sm:w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
            {/* Real image */}
            <div className="mt-3 sm:mt-4 relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                alt="Sports, passions and interests" 
                className="w-full h-16 sm:h-20 object-cover rounded-xl border border-yellow-100"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* New: How It Works Section */}
    <section className="lp-section lp-section-y bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-6 sm:px-8 lg:px-12 xl:px-16">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-chip mb-4 sm:mb-6">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
            <span className="lp-chip-text">Simple Process</span>
          </div>
          <h2 className="lp-section-title">
            How BrandBond Works
          </h2>
          <p className="lp-section-subtitle">
            Three simple steps to find your perfect connections
          </p>
        </div>
        
        <div className="lp-grid-3">
          <div className="text-center relative">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full opacity-30 -translate-y-4 sm:-translate-y-8 md:-translate-y-12 lg:-translate-y-16 translate-x-4 sm:translate-x-8 md:translate-x-12 lg:translate-x-16"></div>
            <div className="w-16 h-16 sm:w-20 h-20 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white text-xl sm:text-2xl font-bold relative z-10">
              1
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 relative z-10">Share Your World</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed relative z-10">
              Tell us about your favorite music, movies, books, travel dreams, food cravings, and everything 
              that makes you smile. The more you share, the better we match you.
            </p>
            {/* Mobile Screen */}
            <div className="mt-4 sm:mt-6 relative z-10 flex justify-center">
              <div className="relative mx-auto w-40 sm:w-48 md:w-56 lg:w-64">
                {/* iPhone frame with proper mobile proportions */}
                <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-1 sm:p-1.5 md:p-2 shadow-lg sm:shadow-xl md:shadow-2xl border border-gray-700">
                  {/* iPhone Side Buttons */}
                  <div className="absolute left-0 top-12 sm:top-16 md:top-20 lg:top-24 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute left-0 top-20 sm:top-28 md:top-32 lg:top-40 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute right-0 top-16 sm:top-20 md:top-24 lg:top-32 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-l-sm"></div>
                  
                  {/* Screen */}
                  <div className="bg-black rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
                    {/* iPhone Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 lg:w-24 h-3 sm:h-4 md:h-5 lg:h-6 bg-black rounded-b-lg sm:rounded-b-xl md:rounded-b-2xl z-20"></div>
                    
                    {/* Status Bar */}
                    <div className="bg-black text-white text-[10px] sm:text-xs px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3 flex justify-between items-center relative z-10">
                      <span className="font-medium">9:41</span>
                      <div className="flex items-center space-x-0.5 sm:space-x-1">
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* App Content */}
                    <div className="bg-gradient-to-br from-indigo-50 to-pink-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-1 sm:mb-2 text-center">Share Your World</h3>
                      <p className="text-[8px] sm:text-xs md:text-sm text-gray-600 text-center">Tell us about you</p>
                    </div>
                    
                    {/* iPhone Home Indicator */}
                    <div className="bg-black py-1.5 sm:py-2 md:py-3 flex justify-center">
                      <div className="w-8 sm:w-12 md:w-16 lg:w-20 h-0.5 sm:h-1 bg-white rounded-full opacity-80"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center relative">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-30 -translate-y-4 sm:-translate-y-8 md:-translate-y-12 lg:-translate-y-16 translate-x-4 sm:translate-x-8 md:translate-x-12 lg:translate-x-16"></div>
            <div className="w-16 h-16 sm:w-20 h-20 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white text-xl sm:text-2xl font-bold relative z-10">
              2
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 relative z-10">Discover Matches</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed relative z-10">
              Our smart algorithm finds people who share your passions and lifestyle choices. 
              Get daily recommendations based on your preferences and interests.
            </p>
            {/* Mobile Screen */}
            <div className="mt-4 sm:mt-6 relative z-10 flex justify-center">
              <div className="relative mx-auto w-40 sm:w-48 md:w-56 lg:w-64">
                {/* iPhone frame with proper mobile proportions */}
                <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-1 sm:p-1.5 md:p-2 shadow-lg sm:shadow-xl md:shadow-2xl border border-gray-700">
                  {/* iPhone Side Buttons */}
                  <div className="absolute left-0 top-12 sm:top-16 md:top-20 lg:top-24 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute left-0 top-20 sm:top-28 md:top-32 lg:top-40 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute right-0 top-16 sm:top-20 md:top-24 lg:top-32 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-l-sm"></div>
                  
                  {/* Screen */}
                  <div className="bg-black rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
                    {/* iPhone Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 lg:w-24 h-3 sm:h-4 md:h-5 lg:h-6 bg-black rounded-b-lg sm:rounded-b-xl md:rounded-b-2xl z-20"></div>
                    
                    {/* Status Bar */}
                    <div className="bg-black text-white text-[10px] sm:text-xs px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3 flex justify-between items-center relative z-10">
                      <span className="font-medium">9:41</span>
                      <div className="flex items-center space-x-0.5 sm:space-x-1">
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* App Content */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-1 sm:mb-2 text-center">Discover Matches</h3>
                      <p className="text-[8px] sm:text-xs md:text-sm text-gray-600 text-center">Find your people</p>
                    </div>
                    
                    {/* iPhone Home Indicator */}
                    <div className="bg-black py-1.5 sm:py-2 md:py-3 flex justify-center">
                      <div className="w-8 sm:w-12 md:w-16 lg:w-20 h-0.5 sm:h-1 bg-white rounded-full opacity-80"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center relative">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-purple-200 to-violet-200 rounded-full opacity-30 -translate-y-4 sm:-translate-y-8 md:-translate-y-12 lg:-translate-y-16 translate-x-4 sm:translate-x-8 md:translate-x-12 lg:translate-x-16"></div>
            <div className="w-16 h-16 sm:w-20 h-20 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white text-xl sm:text-2xl font-bold relative z-10">
              3
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 relative z-10">Connect & Grow</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed relative z-10">
              Start conversations, join communities, attend events, and build meaningful relationships 
              that go beyond just swiping left or right.
            </p>
            {/* Mobile Screen */}
            <div className="mt-4 sm:mt-6 relative z-10 flex justify-center">
              <div className="relative mx-auto w-40 sm:w-48 md:w-56 lg:w-64">
                {/* iPhone frame with proper mobile proportions */}
                <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-1 sm:p-1.5 md:p-2 shadow-lg sm:shadow-xl md:shadow-2xl border border-gray-700">
                  {/* iPhone Side Buttons */}
                  <div className="absolute left-0 top-12 sm:top-16 md:top-20 lg:top-24 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute left-0 top-20 sm:top-28 md:top-32 lg:top-40 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-r-sm"></div>
                  <div className="absolute right-0 top-16 sm:top-20 md:top-24 lg:top-32 w-0.5 sm:w-1 h-4 sm:h-6 md:h-8 bg-gray-700 rounded-l-sm"></div>
                  
                  {/* Screen */}
                  <div className="bg-black rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
                    {/* iPhone Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 lg:w-24 h-3 sm:h-4 md:h-5 lg:h-6 bg-black rounded-b-lg sm:rounded-b-xl md:rounded-b-2xl z-20"></div>
                    
                    {/* Status Bar */}
                    <div className="bg-black text-white text-[10px] sm:text-xs px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3 flex justify-between items-center relative z-10">
                      <span className="font-medium">9:41</span>
                      <div className="flex items-center space-x-0.5 sm:space-x-1">
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                        <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* App Content */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-1 sm:mb-2 text-center">Connect & Grow</h3>
                      <p className="text-[8px] sm:text-xs md:text-sm text-gray-600 text-center">Build relationships</p>
                    </div>
                    
                    {/* iPhone Home Indicator */}
                    <div className="bg-black py-1.5 sm:py-2 md:py-3 flex justify-center">
                      <div className="w-8 sm:w-12 md:w-16 lg:w-20 h-0.5 sm:h-1 bg-white rounded-full opacity-80"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Your Digital DNA Section */}
    <section className="py-12 sm:py-16 md:py-20 px-6 sm:px-8 lg:px-12 xl:px-16 bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)`
          }}></div>
        </div>
        
        {/* Animated Dot Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                              radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Floating DNA Helix */}
        <div className="absolute top-1/2 right-4 sm:right-8 md:right-16 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 opacity-10 animate-float">
          <div className="w-full h-full border-2 border-pink-400 rounded-full animate-spin" style={{animationDuration: '20s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 border-2 border-indigo-400 rounded-full -translate-x-1/2 -translate-y-1/2 animate-spin" style={{animationDuration: '15s', animationDirection: 'reverse'}}></div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center mb-8 sm:mb-12 lg:mb-16 lg:mb-20">
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-pink-500 to-indigo-500 px-3 sm:px-4 py-2 rounded-full w-fit">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-bold text-white">Digital DNA</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-black text-white leading-tight">
              Your Apps.
            <br />
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Your Story.
            </span>
          </h2>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed">
              Every scroll, like, playlist, and watchlist reveals the <span className="font-bold text-white">authentic you</span>. 
              BrandBond connects the dots to show your true digital DNA.
              </p>
            </div>

          {/* Floating Stats - Right Column */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-pink-400 mb-1 sm:mb-2">12+</div>
                  <div className="text-xs sm:text-sm text-gray-300">Apps Connected</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-indigo-400 mb-1 sm:mb-2">∞</div>
                  <div className="text-xs sm:text-sm text-gray-300">Possibilities</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-purple-400 mb-1 sm:mb-2">100%</div>
                  <div className="text-xs sm:text-sm text-gray-300">Authentic</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-cyan-400 mb-1 sm:mb-2">24/7</div>
                  <div className="text-xs sm:text-sm text-gray-300">Learning</div>
                </div>
                </div>
              </div>
            </div>
          </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-3 sm:gap-4 mb-8 sm:mb-12 lg:mb-16 lg:mb-20">
          {/* Large Story Card */}
          <div className="col-span-12 lg:col-span-6 bg-gradient-to-br from-pink-500/20 to-indigo-500/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 hover:scale-[1.02] transition-all duration-500">
            <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Your Unfiltered Story</h3>
                <p className="text-sm sm:text-base text-gray-300">Let your app choices reveal the real, authentic you - and be proud of every choice that makes you uniquely you</p>
                </div>
                  </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-500/30 rounded-lg mb-2 sm:mb-3"></div>
                <h4 className="text-sm sm:text-base text-white font-semibold mb-2">Music Taste</h4>
                <p className="text-xs sm:text-sm text-gray-400">Your playlists tell the world about your mood, energy, and soul</p>
                </div>
              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-500/30 rounded-lg mb-2 sm:mb-3"></div>
                <h4 className="text-sm sm:text-base text-white font-semibold mb-2">Visual Choices</h4>
                <p className="text-xs sm:text-sm text-gray-400">Your watchlists reveal your dreams, fears, and deepest desires</p>
                  </div>
              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 sm:col-span-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500/30 rounded-lg mb-2 sm:mb-3"></div>
                <h4 className="text-sm sm:text-base text-white font-semibold mb-2">Daily Habits</h4>
                <p className="text-xs sm:text-sm text-gray-400">Your app usage shows your lifestyle and what truly matters to you</p>
                </div>
                  </div>
                </div>

          {/* App Universe Card */}
          <div className="col-span-12 lg:col-span-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 hover:scale-[1.02] transition-all duration-500">
            <h4 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">Your Digital World</h4>
            <p className="text-base sm:text-lg text-gray-300 text-center mb-4 sm:mb-6">Every app choice is a chapter in your story</p>
            
            {/* App Grid - 4x4 Layout */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {/* Row 1 - Music & Streaming */}
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faSpotify} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                <p className="text-xs sm:text-sm text-white font-medium">Spotify</p>
                </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faApple} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                <p className="text-xs sm:text-sm text-white font-medium">Apple</p>
                </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faYoutube} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                <p className="text-xs sm:text-sm text-white font-medium">YT Music</p>
                </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faMicrosoft} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                <p className="text-xs sm:text-sm text-white font-medium">Netflix</p>
                </div>
              
              {/* Row 2 - Video Streaming */}
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faAmazon} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                <p className="text-xs sm:text-sm text-white font-medium">Prime</p>
                </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faMicrosoft} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                <p className="text-xs sm:text-sm text-white font-medium">Hotstar</p>
                </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faYoutube} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                <p className="text-xs sm:text-sm text-white font-medium">YouTube</p>
                </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faMicrosoft} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                <p className="text-xs sm:text-sm text-white font-medium">Hulu</p>
                </div>
              
              {/* Row 3 - Social & Reading */}
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faPinterest} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
                <p className="text-xs sm:text-sm text-white font-medium">Pinterest</p>
            </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faAmazon} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
          </div>
                <p className="text-xs sm:text-sm text-white font-medium">Goodreads</p>
        </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faEbay} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
          </div>
                <p className="text-xs sm:text-sm text-white font-medium">Wattpad</p>
        </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-700 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faAmazon} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
      </div>
                <p className="text-xs sm:text-sm text-white font-medium">Kindle</p>
              </div>
              
              {/* Row 4 - Community & Sports */}
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faMicrosoft} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
          </div>
                <p className="text-xs sm:text-sm text-white font-medium">AO3</p>
              </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faReddit} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-xs sm:text-sm text-white font-medium">Reddit</p>
              </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faMicrosoft} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-xs sm:text-sm text-white font-medium">ESPN</p>
              </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <FontAwesomeIcon icon={faTwitter} className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-xs sm:text-sm text-white font-medium">X</p>
              </div>
            </div>
        </div>

          {/* Benefits Grid */}
          <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 hover:scale-[1.02] transition-all duration-500">
            <h4 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 text-center">Why Be Authentic?</h4>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                <p className="text-gray-300 text-sm">Find people who love the real you</p>
            </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                <p className="text-gray-300 text-sm">Build genuine connections</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <p className="text-gray-300 text-sm">No more pretending</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                <p className="text-gray-300 text-sm">Be proud of who you are</p>
              </div>
              </div>
              </div>
          
          {/* Connection Visualization */}
          <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 hover:scale-[1.02] transition-all duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
              <h4 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-0">Real Love & Friendship</h4>
              <div className="flex space-x-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-pink-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <p className="text-sm sm:text-base text-gray-300">Let them see your unfiltered self</p>
              </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <p className="text-sm sm:text-base text-gray-300">Be proud of your app choices</p>
            </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <p className="text-sm sm:text-base text-gray-300">Your story deserves to be told</p>
            </div>
          </div>

              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-black text-cyan-400 mb-1 sm:mb-2">100%</div>
                  <div className="text-xs sm:text-sm text-gray-300">Authentic You</div>
            </div>
              </div>
              </div>
              </div>
              </div>

        {/* Bottom CTA - Glassmorphism */}
        <div className="text-center">
          <div className="relative overflow-hidden bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-white/20">
            {/* Floating Elements */}
            <div className="absolute top-2 sm:top-4 left-4 sm:left-8 w-8 h-8 sm:w-16 sm:h-16 bg-pink-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-2 sm:bottom-4 right-4 sm:right-8 w-10 h-10 sm:w-20 sm:h-20 bg-indigo-400/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">The Honest You. The Transparent You.</h3>
              <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl sm:max-w-4xl mx-auto leading-relaxed">
                No more pretending. No more surface-level connections. BrandBond sees through your curated facade 
                and reveals the <span className="font-bold text-pink-300">authentic, passionate, beautifully complex person</span> you really are.
              </p>
              <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl sm:max-w-4xl mx-auto">
                Because when you're <span className="font-bold text-indigo-300">truly seen</span>, you can find people who truly <span className="font-bold text-purple-300">see you.</span>
              </p>
              </div>
              </div>
              </div>
            </div>
    </section>

    {/* New: What We Match You On Section */}
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 xl:px-16 bg-gradient-to-br from-indigo-50 via-white to-pink-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-gradient-to-r from-indigo-200 to-pink-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-20 h-20 sm:w-40 sm:h-40 bg-gradient-to-r from-pink-200 to-indigo-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-24 sm:h-24 bg-gradient-to-r from-cyan-200 to-blue-200 rounded-full opacity-20 blur-xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-blue-100 px-3 sm:px-4 py-2 rounded-full mb-4 sm:mb-6">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
            <span className="text-xs sm:text-sm font-semibold text-pink-700">AI-Powered Deep Matching</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            What Makes You, <span className="bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">Uniquely You</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl sm:max-w-3xl mx-auto">
            We dive deep into your preferences, passions, and personality to find connections that go beyond surface-level compatibility
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Music & Artists */}
          <div className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
            {/* Icon with animated glow */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>

            {/* Title */}
            <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300">
              Music & Artists
            </h3>
            
            {/* Features with modern design */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: <Music className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />, text: "Fav Singers" },
                { icon: <Music className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />, text: "Fav Songs" },
                { icon: <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />, text: "Music Genres" },
                { icon: <Music className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />, text: "Composers" },
                { icon: <Music className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />, text: "Bands" },
                { icon: <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />, text: "Idols" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-pink-50 transition-all duration-300">
                  {item.icon}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{item.text}</span>
            </div>
              ))}
              </div>
            
            {/* Quote with enhanced styling */}
            <div className="relative z-10 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-pink-100">
              <p className="text-xs sm:text-sm text-pink-700 font-medium text-center leading-relaxed">
                "Music is the language of the soul. Find someone who speaks your melody."
              </p>
              </div>
              </div>

          {/* Movies & TV */}
          <div className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
            {/* Icon with animated glow */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Film className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              </div>
            
            {/* Title */}
            <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300">
              Movies & TV
            </h3>
            
            {/* Features with modern design */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: <Film className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />, text: "Fav Movies" },
                { icon: <Film className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />, text: "TV Series" },
                { icon: <Film className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />, text: "Genres" },
                { icon: <Film className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />, text: "Fav Actors" },
                { icon: <Film className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />, text: "Comics" },
                { icon: <Film className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />, text: "Cartoons" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-blue-50 transition-all duration-300">
                  {item.icon}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{item.text}</span>
            </div>
              ))}
            </div>
            
            {/* Quote with enhanced styling */}
            <div className="relative z-10 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-blue-100">
              <p className="text-xs sm:text-sm text-blue-700 font-medium text-center leading-relaxed">
                "Every story you love reveals a part of your heart. Share it with someone who understands."
              </p>
            </div>
          </div>

          {/* Books & Literature */}
          <div className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
            {/* Icon with animated glow */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
              </div>
            
            {/* Title */}
            <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300">
              Books & Literature
            </h3>
            
            {/* Features with modern design */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />, text: "Fav Books" },
                { icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />, text: "Authors" },
                { icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />, text: "Genres" },
                { icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />, text: "Categories" },
                { icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />, text: "Reading Time" },
                { icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />, text: "Book Clubs" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-purple-50 transition-all duration-300">
                  {item.icon}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{item.text}</span>
              </div>
              ))}
              </div>
            
            {/* Quote with enhanced styling */}
            <div className="relative z-10 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-purple-100">
              <p className="text-xs sm:text-sm text-purple-700 font-medium text-center leading-relaxed">
                "Books are mirrors of the soul. Find someone who reflects your literary heart."
              </p>
              </div>
              </div>

          {/* Sports & Athletics */}
          <div className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
            {/* Icon with animated glow */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            </div>
            
            {/* Title */}
            <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300">
              Sports & Athletics
            </h3>
            
            {/* Features with modern design */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />, text: "Fav Sports" },
                { icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />, text: "Athletes" },
                { icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" />, text: "Team Spirit" },
                { icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />, text: "Fitness Goals" },
                { icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />, text: "Active Life" },
                { icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" />, text: "Competition" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-green-50 transition-all duration-300">
                  {item.icon}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
            
            {/* Quote with enhanced styling */}
            <div className="relative z-10 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-green-100">
              <p className="text-xs sm:text-sm text-green-700 font-medium text-center leading-relaxed">
                "Passion for sports creates unbreakable bonds. Find your perfect teammate."
              </p>
            </div>
          </div>

          {/* Travel & Adventure */}
          <div className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
            {/* Icon with animated glow */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
              </div>
            
            {/* Title */}
            <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300">
              Travel & Adventure
            </h3>
            
            {/* Features with modern design */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />, text: "Destinations" },
                { icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />, text: "Travel Style" },
                { icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />, text: "Adventure" },
                { icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />, text: "Culture" },
                { icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />, text: "Experiences" },
                { icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />, text: "Backpacking" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-amber-50 transition-all duration-300">
                  {item.icon}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{item.text}</span>
              </div>
              ))}
              </div>
            
            {/* Quote with enhanced styling */}
            <div className="relative z-10 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-amber-100">
              <p className="text-xs sm:text-sm text-amber-700 font-medium text-center leading-relaxed">
                "Wanderlust connects souls. Find someone who dreams the same destinations."
              </p>
            </div>
          </div>

          {/* Food & Cuisine */}
          <div className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
            {/* Icon with animated glow */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
              </div>
            
            {/* Title */}
            <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300">
              Food & Cuisine
            </h3>
            
            {/* Features with modern design */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />, text: "Fav Cuisine" },
                { icon: <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />, text: "Cooking Skills" },
                { icon: <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />, text: "Dining Style" },
                { icon: <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />, text: "Spice Level" },
                { icon: <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />, text: "Food Pairing" },
                { icon: <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />, text: "Sweet Tooth" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-red-50 transition-all duration-300">
                  {item.icon}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{item.text}</span>
              </div>
              ))}
              </div>
            
            {/* Quote with enhanced styling */}
            <div className="relative z-10 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-red-100">
              <p className="text-xs sm:text-sm text-red-700 font-medium text-center leading-relaxed">
                "Food brings people together. Find someone who shares your culinary passion."
              </p>
            </div>
          </div>

          {/* Shopping & Brands */}
          <div className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
            {/* Icon with animated glow */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
              </div>
            
            {/* Title */}
            <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300">
              Shopping & Brands
            </h3>
            
            {/* Features with modern design */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />, text: "Fav Brands" },
                { icon: <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />, text: "Fashion Style" },
                { icon: <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />, text: "Luxury Taste" },
                { icon: <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />, text: "Shopping Style" },
                { icon: <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />, text: "Brand Loyalty" },
                { icon: <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />, text: "Trends" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-indigo-50 transition-all duration-300">
                  {item.icon}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{item.text}</span>
              </div>
              ))}
              </div>
            
            {/* Quote with enhanced styling */}
            <div className="relative z-10 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-indigo-100">
              <p className="text-xs sm:text-sm text-indigo-700 font-medium text-center leading-relaxed">
                "Style speaks volumes. Find someone who appreciates your brand choices."
              </p>
            </div>
          </div>

          {/* Tech & Gadgets */}
          <div className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
            {/* Icon with animated glow */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
              </div>
            
            {/* Title */}
            <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300">
              Tech & Gadgets
            </h3>
            
            {/* Features with modern design */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />, text: "Gadgets" },
                { icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />, text: "Brands" },
                { icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />, text: "Tech Savvy" },
                { icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />, text: "Innovation" },
                { icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />, text: "Digital Life" },
                { icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />, text: "Latest Tech" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-cyan-50 transition-all duration-300">
                  {item.icon}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{item.text}</span>
              </div>
              ))}
              </div>
            
            {/* Quote with enhanced styling */}
            <div className="relative z-10 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-cyan-100">
              <p className="text-xs sm:text-sm text-cyan-700 font-medium text-center leading-relaxed">
                "Technology connects minds. Find someone who speaks your digital language."
              </p>
            </div>
          </div>

          {/* Hobbies & Interests */}
          <div className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
            {/* Icon with animated glow */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Palette className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
              </div>
            
            {/* Title */}
            <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300">
              Hobbies & Interests
            </h3>
            
            {/* Features with modern design */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />, text: "Creative Arts" },
                { icon: <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />, text: "Hobbies" },
                { icon: <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />, text: "Artistic" },
                { icon: <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />, text: "Collections" },
                { icon: <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />, text: "Skills" },
                { icon: <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />, text: "Passions" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-violet-50 transition-all duration-300">
                  {item.icon}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{item.text}</span>
              </div>
              ))}
              </div>
            
            {/* Quote with enhanced styling */}
            <div className="relative z-10 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-violet-100">
              <p className="text-xs sm:text-sm text-violet-700 font-medium text-center leading-relaxed">
                "Passions create connections. Find someone who shares your creative spark."
              </p>
            </div>
          </div>

          {/* Daily Habits & Lifestyle */}
          <div className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
            {/* Icon with animated glow */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Coffee className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
              </div>
            
            {/* Title */}
            <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300">
              Daily Habits & Lifestyle
            </h3>
            
            {/* Features with modern design */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />, text: "Morning Routine" },
                { icon: <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />, text: "Sleep Patterns" },
                { icon: <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />, text: "Work-Life Balance" },
                { icon: <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />, text: "Wellness" },
                { icon: <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />, text: "Daily Schedule" },
                { icon: <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />, text: "Health Goals" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-rose-50 transition-all duration-300">
                  {item.icon}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{item.text}</span>
              </div>
              ))}
              </div>
            
            {/* Quote with enhanced styling */}
            <div className="relative z-10 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-rose-100">
              <p className="text-xs sm:text-sm text-rose-700 font-medium text-center leading-relaxed">
                "Lifestyle compatibility is the foundation of lasting relationships."
              </p>
            </div>
          </div>

          {/* Animals & Pets */}
          <div className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
            {/* Icon with animated glow */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
              </div>
            
            {/* Title */}
            <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300">
              Animals & Pets
            </h3>
            
            {/* Features with modern design */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />, text: "Pet Preferences" },
                { icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />, text: "Fav Animals" },
                { icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />, text: "Animal Welfare" },
                { icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />, text: "Wildlife" },
                { icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />, text: "Compassion" },
                { icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />, text: "Pet Care" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-amber-50 transition-all duration-300">
                  {item.icon}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{item.text}</span>
              </div>
              ))}
              </div>
            
            {/* Quote with enhanced styling */}
            <div className="relative z-10 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-amber-100">
              <p className="text-xs sm:text-sm text-amber-700 font-medium text-center leading-relaxed">
                "Love for animals reveals the kindness in your heart. Find someone who shares it."
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full opacity-30 -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-30 translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-blue-100 px-4 py-2 rounded-full mb-6">
                <Star className="w-5 h-5 text-pink-600" />
                <span className="text-sm font-semibold text-pink-700">AI-Powered Matching</span>
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Every Preference Tells Your Story
              </h3>
              
              <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
              From your morning playlist to your midnight movie choices, from your travel dreams to your food cravings – 
                <span className="font-semibold text-gray-900"> every single preference</span> helps us find people who truly understand your world.
            </p>
              
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Because the best connections happen when someone loves the <span className="font-bold text-gray-900">exact same things</span> you do.
            </p>
              
              {/* Preference icons with real icons */}
              <div className="flex justify-center space-x-6 mt-6">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-pink-600" />
          </div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                  <Film className="w-5 h-5 text-blue-600" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-violet-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-600" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-amber-600" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Enhanced: CTA Section */}
    <section className="lp-section py-20 px-6 sm:px-8 lg:px-12 xl:px-16 bg-white">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-r from-indigo-200 to-pink-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-r from-pink-200 to-indigo-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-cyan-200 to-blue-200 rounded-full opacity-20 blur-xl"></div>
      </div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="lp-chip mb-4 sm:mb-6">
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
          <span className="lp-chip-text">Get Started Today</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
          Ready to Find Your Perfect Connections?
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl sm:max-w-3xl mx-auto mb-8">
            Join thousands of people who have found meaningful relationships
        </p>
        <div className="lp-cta-row">
          <button 
              onClick={handleGetStarted}
              className="lp-btn-primary-lg"
          >
              Get Started
          </button>
        <button 
            onClick={handleSignIn}
            className="lp-btn-secondary-lg"
        >
            Sign In
        </button>
        </div>

        {/* Ending Salute Image - Seamlessly integrated */}
        <div className="mt-16 sm:mt-20 md:mt-24">
          <div className="relative max-w-5xl mx-auto">
            {/* Heroic background frame for the ending salute */}
            <div className="relative bg-gradient-to-br from-indigo-50 via-white to-pink-50 rounded-3xl p-8 sm:p-10 md:p-12 shadow-2xl border border-gray-100 overflow-hidden">
              {/* Subtle background patterns */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-full h-full" style={{
                  backgroundImage: `radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)`
                }}></div>
              </div>
              
              {/* Main image with enhanced presentation */}
              <div className="relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="People connecting and building relationships" 
                  className="w-full h-64 sm:h-72 md:h-80 lg:h-96 object-cover rounded-2xl shadow-xl border border-gray-200"
                />
                
                {/* Inspirational overlay message */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl flex items-end">
                  <div className="p-6 sm:p-8 text-white">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold">Your Journey Begins Here</h3>
                        <p className="text-sm sm:text-base text-gray-200">Join the community that understands you</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);
};

export default App;