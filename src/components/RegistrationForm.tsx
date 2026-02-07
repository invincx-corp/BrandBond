import React, { useState, useEffect, useRef } from 'react';
import { Heart, Users, Star, ChevronLeft, ChevronRight, Camera, X, Check, Search, MapPin } from 'lucide-react';
import { RegistrationService, Language } from '../services/registrationService';
import { supabase } from '../lib/supabase';

interface LocationSuggestion {
  place_id: string;
  display_name: string;
  type: string;
}

interface RegistrationData {
  // Step 0 - Intent
  intent: 'dating' | 'friends' | 'both';
  
  // Step 1 - Basic Info
  email: string;
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
  
  // Step 2 - Personal Details
  dob: string;
  age: number;
  gender: string;
  location: string;
  
  // Step 3 - Preferences
  spokenLanguages: Language[];
  preferredAgeGap: number;
  genderPreference: string;
  distancePreference: number;
  
  // Step 4 - Interests
  interests: {
    musicCategory: string;
    song: string;
    singer: string;
    singerGroups: string;
    singerIdols: string;
    musicBands: string;
    movie: string;
    movieCategory: string;
    tvSeries: string;
    tvSeriesCategory: string;
    book: string;
    bookCategory: string;
    cartoon: string;
    travelDestination: string;
    travelDestinationCategory: string;
    foodCuisine: string;
    foodCuisineCategory: string;
    sport: string;
    athlete: string;
    videoGame: string;
    techGadget: string;
    shoppingBrand: string;
    hobbyInterest: string;
    habit: string;
  };

  // Step 5 - Additional Favorites (multiple per category)
  additionalFavorites: {
    musicCategory: string[];
    song: string[];
    singer: string[];
    singerGroups: string[];
    singerIdols: string[];
    musicBands: string[];
    movie: string[];
    movieCategory: string[];
    tvSeries: string[];
    tvSeriesCategory: string[];
    book: string[];
    bookCategory: string[];
    cartoon: string[];
    travelDestination: string[];
    travelDestinationCategory: string[];
    foodCuisine: string[];
    foodCuisineCategory: string[];
    sport: string[];
    athlete: string[];
    videoGame: string[];
    techGadget: string[];
    shoppingBrand: string[];
    hobbyInterest: string[];
    habit: string[];
  };
  
  // Step 6 - Photos
  photos: string[];
  
  // Generated
  generatedBio: string;
}

interface RegistrationFormProps {
  onBack?: () => void;
  forcedStep?: number;
  onStepChange?: (nextStep: number) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onBack, forcedStep, onStepChange }) => {
  const REGISTRATION_STORAGE_KEY = 'brandbond_registration_progress_v1';

  const [internalStep, setInternalStep] = useState(0);
  const currentStep = typeof forcedStep === 'number' ? forcedStep : internalStep;
  const [data, setData] = useState<RegistrationData>({
    intent: 'dating',
    email: '',
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    dob: '',
    age: 0,
    gender: '',
    location: '',
    spokenLanguages: [],
    preferredAgeGap: 5,
    genderPreference: '',
    distancePreference: 25,
    interests: {
      musicCategory: '',
      song: '',
      singer: '',
      singerGroups: '',
      singerIdols: '',
      musicBands: '',
      movie: '',
      movieCategory: '',
      tvSeries: '',
      tvSeriesCategory: '',
      book: '',
      bookCategory: '',
      cartoon: '',
      travelDestination: '',
      travelDestinationCategory: '',
      foodCuisine: '',
      foodCuisineCategory: '',
      sport: '',
      athlete: '',
      videoGame: '',
      techGadget: '',
      shoppingBrand: '',
      hobbyInterest: '',
      habit: '',
    },
    additionalFavorites: {
      musicCategory: [],
      song: [],
      singer: [],
      singerGroups: [],
      singerIdols: [],
      musicBands: [],
      movie: [],
      movieCategory: [],
      tvSeries: [],
      tvSeriesCategory: [],
      book: [],
      bookCategory: [],
      cartoon: [],
      travelDestination: [],
      travelDestinationCategory: [],
      foodCuisine: [],
      foodCuisineCategory: [],
      sport: [],
      athlete: [],
      videoGame: [],
      techGadget: [],
      shoppingBrand: [],
      hobbyInterest: [],
      habit: [],
    },
    photos: [],
    generatedBio: '',
  });

  const [errors, setErrors] = useState<{
    intent?: string;
    email?: string;
    name?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    dob?: string;
    gender?: string;
    location?: string;
    genderPreference?: string;
    interests?: string;
    additionalFavorites?: string;
    photos?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [verificationPassword, setVerificationPassword] = useState<string>('');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);

  // Language and location search state
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');
  const [languageSuggestions, setLanguageSuggestions] = useState<Language[]>([]);
  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);
  
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  // Refs for click outside handling
  const languageSearchRef = useRef<HTMLDivElement>(null);
  const locationSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (locationSearchQuery !== data.location) {
      handleInputChange('location', locationSearchQuery);
    }
  }, [locationSearchQuery]);

  // Restore registration progress after reload
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { currentStep?: number; data?: RegistrationData };
      if (parsed?.data) {
        setData(parsed.data);
      }
      if (typeof parsed?.currentStep === 'number') {
        setInternalStep(Math.max(0, Math.min(parsed.currentStep, 7)));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist registration progress continuously
  useEffect(() => {
    try {
      localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify({ currentStep, data }));
    } catch {
      // ignore
    }
  }, [currentStep, data]);

  // Fast language search with instant results
  const searchLanguages = (query: string) => {
    if (!query.trim()) {
      setLanguageSuggestions([]);
      setShowLanguageSuggestions(false);
      return;
    }

    // Instant search from comprehensive language list
    const allLanguages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
      { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
      { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski' },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
      { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
      { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
      { code: 'da', name: 'Danish', nativeName: 'Dansk' },
      { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
      { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
      { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
      { code: 'ro', name: 'Romanian', nativeName: 'Română' },
      { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
      { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
      { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
      { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
      { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
      { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
      { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' }
    ];
    
    // Instant filter - no delay
    const filtered = allLanguages.filter(lang => 
      lang.name.toLowerCase().includes(query.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(query.toLowerCase()) ||
      lang.code.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
    
    setLanguageSuggestions(filtered);
    setShowLanguageSuggestions(true);
  };

  // Fast location search with instant results
  const searchLocations = (query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    // Instant search from predefined cities
    const majorCities = [
      { place_id: '1', display_name: 'Mumbai, Maharashtra, India', type: 'city' },
      { place_id: '2', display_name: 'Delhi, India', type: 'city' },
      { place_id: '3', display_name: 'Bangalore, Karnataka, India', type: 'city' },
      { place_id: '4', display_name: 'Hyderabad, Telangana, India', type: 'city' },
      { place_id: '5', display_name: 'Chennai, Tamil Nadu, India', type: 'city' },
      { place_id: '6', display_name: 'Kolkata, West Bengal, India', type: 'city' },
      { place_id: '7', display_name: 'Pune, Maharashtra, India', type: 'city' },
      { place_id: '8', display_name: 'Ahmedabad, Gujarat, India', type: 'city' },
      { place_id: '9', display_name: 'Jaipur, Rajasthan, India', type: 'city' },
      { place_id: '10', display_name: 'Surat, Gujarat, India', type: 'city' },
      { place_id: '11', display_name: 'Lucknow, Uttar Pradesh, India', type: 'city' },
      { place_id: '12', display_name: 'Kanpur, Uttar Pradesh, India', type: 'city' },
      { place_id: '13', display_name: 'Nagpur, Maharashtra, India', type: 'city' },
      { place_id: '14', display_name: 'Indore, Madhya Pradesh, India', type: 'city' },
      { place_id: '15', display_name: 'Thane, Maharashtra, India', type: 'city' },
      { place_id: '16', display_name: 'Bhopal, Madhya Pradesh, India', type: 'city' },
      { place_id: '17', display_name: 'Visakhapatnam, Andhra Pradesh, India', type: 'city' },
      { place_id: '18', display_name: 'Patna, Bihar, India', type: 'city' },
      { place_id: '19', display_name: 'Vadodara, Gujarat, India', type: 'city' },
      { place_id: '20', display_name: 'Ghaziabad, Uttar Pradesh, India', type: 'city' },
      { place_id: '21', display_name: 'Ludhiana, Punjab, India', type: 'city' },
      { place_id: '22', display_name: 'Agra, Uttar Pradesh, India', type: 'city' },
      { place_id: '23', display_name: 'Nashik, Maharashtra, India', type: 'city' },
      { place_id: '24', display_name: 'Faridabad, Haryana, India', type: 'city' },
      { place_id: '25', display_name: 'Meerut, Uttar Pradesh, India', type: 'city' },
      { place_id: '26', display_name: 'Rajkot, Gujarat, India', type: 'city' },
      { place_id: '27', display_name: 'Kalyan, Maharashtra, India', type: 'city' },
      { place_id: '28', display_name: 'Vasai, Maharashtra, India', type: 'city' },
      { place_id: '29', display_name: 'Varanasi, Uttar Pradesh, India', type: 'city' },
      { place_id: '30', display_name: 'Srinagar, Jammu & Kashmir, India', type: 'city' },
      { place_id: '31', display_name: 'New York, USA', type: 'city' },
      { place_id: '32', display_name: 'London, UK', type: 'city' },
      { place_id: '33', display_name: 'Toronto, Canada', type: 'city' },
      { place_id: '34', display_name: 'Sydney, Australia', type: 'city' },
      { place_id: '35', display_name: 'Berlin, Germany', type: 'city' },
      { place_id: '36', display_name: 'Paris, France', type: 'city' },
      { place_id: '37', display_name: 'Tokyo, Japan', type: 'city' },
      { place_id: '38', display_name: 'Beijing, China', type: 'city' },
      { place_id: '39', display_name: 'Dubai, UAE', type: 'city' },
      { place_id: '40', display_name: 'Singapore', type: 'city' }
    ];
    
    // Instant filter - no delay
    const filteredCities = majorCities.filter(city => 
      city.display_name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8); // Show top 8 results
    
    setLocationSuggestions(filteredCities);
    setShowLocationSuggestions(true);
  };

  // Handle language selection
  const handleLanguageSelect = (language: Language) => {
    if (!data.spokenLanguages.find(lang => lang.code === language.code)) {
      const newLangs = [...data.spokenLanguages, language];
      handleInputChange('spokenLanguages', newLangs);
    }
    setLanguageSearchQuery('');
    setShowLanguageSuggestions(false);
  };

  // Handle language removal
  const handleLanguageRemove = (index: number) => {
    const newLangs = data.spokenLanguages.filter((_, i) => i !== index);
    handleInputChange('spokenLanguages', newLangs);
  };

  // Handle location selection
  const handleLocationSelect = (location: LocationSuggestion) => {
    handleInputChange('location', location.display_name);
    setLocationSearchQuery(location.display_name);
    setShowLocationSuggestions(false);
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageSearchRef.current && !languageSearchRef.current.contains(event.target as Node)) {
        setShowLanguageSuggestions(false);
      }
      if (locationSearchRef.current && !locationSearchRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Generate bio when interests are complete
  useEffect(() => {
    if (Object.values(data.interests).every(value => value.trim() !== '')) {
      const bio = generateBio(data.interests);
      setData(prev => ({ ...prev, generatedBio: bio }));
    }
  }, [data.interests]);

  const generateBio = (interests: RegistrationData['interests']): string => {
    const templates = [
      `A soul who finds rhythm in ${interests.musicCategory} beats, with ${interests.song} as my anthem and ${interests.singer} as my muse. I'm inspired by ${interests.singerIdols} and love jamming to ${interests.singerGroups} and ${interests.musicBands}. When I'm not lost in the world of ${interests.movie} (${interests.movieCategory} fan here!) or binge-watching ${interests.tvSeries} (${interests.tvSeriesCategory} addict), you'll find me curled up with ${interests.book} from the ${interests.bookCategory} section. I grew up watching ${interests.cartoon} and still dream of exploring ${interests.travelDestination} for that perfect ${interests.travelDestinationCategory} experience. My taste buds crave ${interests.foodCuisine} (especially ${interests.foodCuisineCategory}), while my competitive spirit comes alive during ${interests.sport} matches - ${interests.athlete} is my ultimate inspiration. I'm a ${interests.videoGame} enthusiast, always excited about the latest ${interests.techGadget}, and you'll spot me sporting ${interests.shoppingBrand} gear. My creative soul finds peace in ${interests.hobbyInterest}, and I have this quirky habit of ${interests.habit}. Life's too short not to embrace every passion that makes your heart sing!`,
      
      `Imagine someone who starts their day with ${interests.song} playing in the background, finds comfort in ${interests.movie} classics (${interests.movieCategory} genre lover), and dreams of exploring ${interests.travelDestination} for that perfect ${interests.travelDestinationCategory} adventure. I'm that person who gets excited about ${interests.sport} matches, admires ${interests.athlete}'s dedication, and finds peace in ${interests.hobbyInterest}. My perfect evening? ${interests.foodCuisine} dinner (${interests.foodCuisineCategory} style) while watching ${interests.tvSeries} (${interests.tvSeriesCategory} enthusiast), followed by some ${interests.videoGame} action. I'm a ${interests.musicCategory} lover through and through, with ${interests.singer} as my constant companion, inspired by ${interests.singerIdols}, and always jamming to ${interests.singerGroups} and ${interests.musicBands}. I grew up with ${interests.cartoon}, love diving into ${interests.book} from the ${interests.bookCategory} world, and I'm always excited about the latest ${interests.techGadget}. You'll find me in ${interests.shoppingBrand} gear, and I have this unique habit of ${interests.habit}. Life's magic lies in embracing every interest that makes you smile!`,
      
      `A wanderer at heart who finds solace in ${interests.musicCategory} melodies, with ${interests.singer} as my constant companion. I'm inspired by ${interests.singerIdols} and love the energy of ${interests.singerGroups} and ${interests.musicBands}. My world revolves around ${interests.movie} magic (${interests.movieCategory} fanatic), ${interests.tvSeries} marathons (${interests.tvSeriesCategory} lover), and the dream of visiting ${interests.travelDestination} for that perfect ${interests.travelDestinationCategory} experience. I'm passionate about ${interests.sport}, look up to ${interests.athlete}, and find joy in ${interests.hobbyInterest}. Whether it's trying new ${interests.foodCuisine} (${interests.foodCuisineCategory} adventures), diving into ${interests.videoGame} worlds, or exploring the latest ${interests.techGadget}, I believe every day is a new chapter waiting to be written. I grew up with ${interests.cartoon}, love getting lost in ${interests.book} from the ${interests.bookCategory} realm, and you'll always spot me in ${interests.shoppingBrand} style. My unique habit? ${interests.habit}. Life's beauty lies in embracing every passion that makes your soul dance!`,
      
      `Meet someone whose heart beats to ${interests.musicCategory} rhythms, with ${interests.song} as their personal anthem and ${interests.singer} as their musical soulmate. I'm inspired by ${interests.singerIdols}, love the harmony of ${interests.singerGroups}, and can't resist the energy of ${interests.musicBands}. My entertainment world is filled with ${interests.movie} magic (${interests.movieCategory} enthusiast), ${interests.tvSeries} adventures (${interests.tvSeriesCategory} lover), and the literary treasures of ${interests.book} from the ${interests.bookCategory} universe. I grew up with ${interests.cartoon} and still dream of exploring ${interests.travelDestination} for that perfect ${interests.travelDestinationCategory} experience. My taste buds crave ${interests.foodCuisine} (${interests.foodCuisineCategory} style), while my competitive spirit comes alive during ${interests.sport} matches - ${interests.athlete} is my ultimate hero. I'm a ${interests.videoGame} enthusiast, always excited about the latest ${interests.techGadget}, and you'll find me sporting ${interests.shoppingBrand} gear. My creative soul finds peace in ${interests.hobbyInterest}, and I have this quirky habit of ${interests.habit}. Life's too short not to embrace every passion that makes your heart sing!`,
      
      `A creative soul who finds rhythm in ${interests.musicCategory} beats, with ${interests.song} as my daily inspiration and ${interests.singer} as my artistic muse. I'm deeply inspired by ${interests.singerIdols}, love the energy of ${interests.singerGroups}, and can't resist the magic of ${interests.musicBands}. My entertainment world revolves around ${interests.movie} classics (${interests.movieCategory} fanatic), ${interests.tvSeries} marathons (${interests.tvSeriesCategory} enthusiast), and the literary wonders of ${interests.book} from the ${interests.bookCategory} realm. I grew up with ${interests.cartoon} and still dream of exploring ${interests.travelDestination} for that perfect ${interests.travelDestinationCategory} adventure. My culinary heart beats for ${interests.foodCuisine} (${interests.foodCuisineCategory} style), while my competitive spirit comes alive during ${interests.sport} matches - ${interests.athlete} is my ultimate inspiration. I'm a ${interests.videoGame} enthusiast, always excited about the latest ${interests.techGadget}, and you'll find me sporting ${interests.shoppingBrand} gear. My creative soul finds peace in ${interests.hobbyInterest}, and I have this unique habit of ${interests.habit}. Life's magic lies in embracing every passion that makes your soul dance!`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  };

  const validateStep = (step: number) => {
    const newErrors: {
      intent?: string;
      email?: string;
      name?: string;
      username?: string;
      password?: string;
      confirmPassword?: string;
      dob?: string;
      gender?: string;
      location?: string;
      genderPreference?: string;
      interests?: string;
      additionalFavorites?: string;
      photos?: string;
    } = {};
    
    switch (step) {
      case 0:
        if (!data.intent) {
          newErrors.intent = 'Please select your intent';
        }
        break;
      case 1:
        if (!data.name.trim()) newErrors.name = 'Name is required';
        if (!data.username.trim()) newErrors.username = 'Username is required';
        if (!data.dob) newErrors.dob = 'Date of birth is required';
        if (!data.gender) newErrors.gender = 'Gender is required';
        if (!data.location.trim()) newErrors.location = 'Location is required';
        break;
      case 2:
        if (data.intent !== 'friends' && !data.genderPreference) {
          newErrors.genderPreference = 'Gender preference is required for dating';
        }
        break;
      case 3:
        const emptyInterests = Object.entries(data.interests).filter(([_, value]) => !value.trim());
        if (emptyInterests.length > 0) {
          newErrors.interests = 'Please fill in all interest fields';
        }
        break;
      case 4:
        const totalAdditional = Object.values(data.additionalFavorites).reduce((acc, arr) => acc + arr.length, 0);
        if (totalAdditional === 0) {
          newErrors.additionalFavorites = 'Please add at least one additional favorite across any category';
        }
        break;
      case 5:
        if (!data.photos[0]) newErrors.photos = 'Please upload at least one photo';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const next = Math.min(currentStep + 1, 6);
      if (onStepChange) {
        onStepChange(next);
      } else {
        setInternalStep(next);
      }
    }
  };

  const handleSkipOnboarding = async () => {
    try {
      setIsSkipping(true);
      setRegistrationError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setRegistrationError('Please sign in to skip onboarding.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, onboarding_skipped: true });

      if (error) {
        setRegistrationError(error.message || 'Failed to skip onboarding');
        return;
      }

      try {
        localStorage.removeItem(REGISTRATION_STORAGE_KEY);
      } catch {
        // ignore
      }

      window.location.href = '/universe-selection';
    } catch (e) {
      setRegistrationError(e instanceof Error ? e.message : 'Failed to skip onboarding');
    } finally {
      setIsSkipping(false);
    }
  };

  const prevStep = () => {
    const prev = Math.max(currentStep - 1, 0);
    if (onStepChange) {
      onStepChange(prev);
    } else {
      setInternalStep(prev);
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear specific error if it exists
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleInterestChange = (field: keyof RegistrationData['interests'], value: string) => {
    setData(prev => ({
      ...prev,
      interests: { ...prev.interests, [field]: value }
    }));
  };

  const addAdditionalFavorite = (field: keyof RegistrationData['additionalFavorites'], value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setData(prev => {
      const existing = prev.additionalFavorites[field] || [];
      if (existing.some(v => v.toLowerCase() === trimmed.toLowerCase())) return prev;
      return {
        ...prev,
        additionalFavorites: {
          ...prev.additionalFavorites,
          [field]: [...existing, trimmed]
        }
      };
    });
    if (errors.additionalFavorites) {
      setErrors(prev => ({ ...prev, additionalFavorites: undefined }));
    }
  };

  const removeAdditionalFavorite = (field: keyof RegistrationData['additionalFavorites'], index: number) => {
    setData(prev => ({
      ...prev,
      additionalFavorites: {
        ...prev.additionalFavorites,
        [field]: prev.additionalFavorites[field].filter((_, i) => i !== index)
      }
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const newPhotos = [...data.photos];
        newPhotos[index] = reader.result as string;
        handleInputChange('photos', newPhotos);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoRemove = (index: number) => {
    setData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleRegistration = async () => {
    try {
      setIsSubmitting(true);
      setRegistrationError(null);
      setVerificationMessage(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setRegistrationError('Please sign in at /register/auth to complete onboarding.');
        return;
      }

      const result = await RegistrationService.finalizeRegistration(data as any, userId);

      if (result.success) {
        setRegistrationSuccess(true);
        try {
          localStorage.removeItem(REGISTRATION_STORAGE_KEY);
        } catch {
          // ignore
        }
        window.location.href = '/universe-selection';
      } else {
        setRegistrationError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsSubmitting(true);
      setRegistrationError(null);
      setVerificationMessage(null);

      const result = await RegistrationService.resendConfirmationEmail(verificationEmail || data.email);
      if (result.success) {
        setVerificationMessage('Verification email resent. Please check your inbox (and spam/junk folder).');
      } else {
        setRegistrationError(result.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Failed to resend verification email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndSignIn = async () => {
    try {
      setIsSubmitting(true);
      setRegistrationError(null);
      setVerificationMessage(null);

      const signInResult = await RegistrationService.signIn(verificationEmail, verificationPassword);
      if (!signInResult.success || !signInResult.userId) {
        setRegistrationError(signInResult.error || 'Sign in failed');
        return;
      }

      const finalizeResult = await RegistrationService.finalizeRegistration(data as any, signInResult.userId);
      if (!finalizeResult.success) {
        setRegistrationError(finalizeResult.error || 'Failed to complete registration');
        return;
      }

      setRegistrationSuccess(true);
      setPendingVerification(false);
      try {
        localStorage.removeItem(REGISTRATION_STORAGE_KEY);
      } catch {
        // ignore
      }
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify your email</h2>
        <p className="text-gray-600">
          We sent a verification link to <span className="font-semibold">{verificationEmail || data.email}</span>.
          Open it to verify your account, then sign in here to finish setting up your profile.
        </p>
      </div>

      {verificationMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-700 text-sm">{verificationMessage}</p>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-50 to-pink-50 rounded-xl p-6 border border-indigo-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={verificationEmail}
              onChange={(e) => setVerificationEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={verificationPassword}
              onChange={(e) => setVerificationPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm"
          >
            Resend verification email
          </button>
          <button
            type="button"
            onClick={handleVerifyAndSignIn}
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-pink-500 text-white hover:from-indigo-600 hover:to-pink-600 shadow-lg"
          >
            I verified my email — Sign in & continue
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep0 = () => (
    <div className="text-center space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to BrandBond! 🎉
        </h2>
        <p className="text-lg text-gray-600">
          What brings you here today? Let's personalize your experience.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div 
          className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
            data.intent === 'dating' 
              ? 'border-pink-500 bg-pink-50 shadow-lg' 
              : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-md'
          }`}
          onClick={() => handleInputChange('intent', 'dating')}
        >
          <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-pink-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Find Love</h3>
          <p className="text-gray-600">Discover romantic connections based on shared interests and values</p>
        </div>
        
        <div 
          className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
            data.intent === 'friends' 
              ? 'border-blue-500 bg-blue-50 shadow-lg' 
              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
          }`}
          onClick={() => handleInputChange('intent', 'friends')}
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Build Friendships</h3>
          <p className="text-gray-600">Connect with like-minded people and join communities</p>
        </div>
        
        <div 
          className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
            data.intent === 'both' 
              ? 'border-purple-500 bg-purple-50 shadow-lg' 
              : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
          }`}
          onClick={() => handleInputChange('intent', 'both')}
        >
          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Both Worlds</h3>
          <p className="text-gray-600">Explore all possibilities - love, friendship, and communities</p>
        </div>
      </div>
      
      {errors.intent && (
        <p className="text-red-500 text-sm">{errors.intent}</p>
      )}
      
      {/* Progress Indicator */}
      <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Step 0 of 6</span>
          <span>Get Started</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="bg-pink-500 h-2 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Your Account</h2>
        <p className="text-gray-600">Let's start with the basics to get you set up</p>
      </div>

      {/* Personal Information Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">👤</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Choose a unique username"
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
          </div>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">🎂</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Demographics</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={data.dob}
              onChange={(e) => {
                const nextDob = e.target.value;
                handleInputChange('dob', nextDob);
                handleInputChange('age', nextDob ? calculateAge(nextDob) : 0);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
            {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age <span className="text-gray-500">(Auto-calculated)</span>
            </label>
            <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {data.dob ? calculateAge(data.dob) : 'Enter DOB first'}
            </div>
          </div>
        </div>
      </div>

      {/* Identity Section */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">👥</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Identity</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['Male', 'Female', 'Other'].map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => handleInputChange('gender', gender)}
                className={`px-4 py-3 rounded-full border-2 transition-all ${
                  data.gender === gender
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-300 hover:border-pink-300 hover:bg-pink-50'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
          {errors.gender && <p className="text-red-500 text-sm mt-2">{errors.gender}</p>}
        </div>
      </div>

      {/* Location Section */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">📍</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Location</h3>
        </div>
        
        <div className="relative" ref={locationSearchRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={locationSearchQuery}
              onChange={(e) => {
                setLocationSearchQuery(e.target.value);
                searchLocations(e.target.value);
              }}
              onFocus={() => setShowLocationSuggestions(true)}
              onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="Type your city, state, or country (or select from suggestions)"
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          
          {/* Fast Suggestions */}
          {showLocationSuggestions && locationSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="p-2 bg-gray-50 border-b border-gray-200">
                <p className="text-xs text-gray-600 font-medium">Quick Select:</p>
              </div>
              {locationSuggestions.map((location) => (
                <button
                  key={location.place_id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleLocationSelect(location);
                  }}
                  onClick={() => handleLocationSelect(location)}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-800 text-sm">{location.display_name}</div>
                  <div className="text-xs text-gray-500">{location.type}</div>
                </button>
              ))}
            </div>
          )}
          
          {/* Manual Input Option */}
          {locationSearchQuery && !locationSuggestions.some(loc => loc.display_name === locationSearchQuery) && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 <strong>Custom Location:</strong> "{locationSearchQuery}" will be saved as your location.
              </p>
            </div>
          )}
          
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
          <p className="text-xs text-gray-500 mt-1">
            ⚡ Instant suggestions • ✏️ Or type your own location
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Step 1 of 7</span>
          <span>Account Setup</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '14.29%' }}></div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Communication & Preferences</h2>
        <p className="text-gray-600">Set your language skills and dating preferences</p>
      </div>

      {/* Spoken Languages Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">🗣️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Spoken Languages</h3>
        </div>
        
        <div className="relative" ref={languageSearchRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Languages <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={languageSearchQuery}
              onChange={(e) => {
                setLanguageSearchQuery(e.target.value);
                searchLanguages(e.target.value);
              }}
              onFocus={() => setShowLanguageSuggestions(true)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="Search for languages you speak..."
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          
          {showLanguageSuggestions && languageSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {languageSuggestions.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-800">{language.name}</div>
                  <div className="text-sm text-gray-500">{language.nativeName}</div>
                </button>
              ))}
            </div>
          )}
          
          {data.spokenLanguages.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.spokenLanguages.map((language, index) => (
                <span
                  key={language.code}
                  className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200"
                >
                  {language.name}
                  <button
                    type="button"
                    onClick={() => handleLanguageRemove(index)}
                    className="ml-2 text-emerald-600 hover:text-emerald-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <p className="text-sm text-gray-600 mt-3">
            Search and select all languages you're comfortable communicating in
            <span className="text-xs text-gray-500 block mt-1">
              ⚡ Instant search • 40+ languages available
            </span>
          </p>
        </div>
      </div>

      {/* Dating Preferences Section - Only show if user wants to find dates */}
      {data.intent === 'dating' || data.intent === 'both' ? (
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-lg">💕</span>
          </div>
            <h3 className="text-xl font-semibold text-gray-800">Dating Preferences</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Age Gap <span className="text-gray-500">(0-30 years)</span>
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={data.preferredAgeGap}
                  onChange={(e) => handleInputChange('preferredAgeGap', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-center text-sm font-medium text-gray-700">
                  {data.preferredAgeGap} years
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender Preference
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Male', 'Female', 'Both', 'No Preference'].map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => handleInputChange('genderPreference', pref)}
                    className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                      data.genderPreference === pref
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-300 hover:border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distance Preference <span className="text-gray-500">(0-20,000 km)</span>
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="20000"
                  step="100"
                  value={data.distancePreference}
                  onChange={(e) => handleInputChange('distancePreference', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-center text-sm font-medium text-gray-700">
                  {data.distancePreference.toLocaleString()} km
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-slate-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">📋</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Summary</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Languages:</span>
            <span className="ml-2 text-gray-600">
              {data.spokenLanguages.length > 0 
                ? data.spokenLanguages.map(l => l.name).join(', ')
                : 'None selected'
              }
            </span>
          </div>
          
          {data.intent === 'dating' || data.intent === 'both' ? (
            <>
              <div>
                <span className="font-medium text-gray-700">Age Gap:</span>
                <span className="ml-2 text-gray-600">{data.preferredAgeGap} years</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Gender Preference:</span>
                <span className="ml-2 text-gray-600">{data.genderPreference || 'Not set'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Distance:</span>
                <span className="ml-2 text-gray-600">{data.distancePreference.toLocaleString()} km</span>
              </div>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Dating preferences hidden (not looking for dates)
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Step 3 of 7</span>
          <span>Communication & Preferences</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '42.86%' }}></div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your All-Time Favorites</h2>
        <p className="text-gray-600">This is what makes you unique! Tell us about your absolute favorites</p>
        <div className="mt-4 inline-flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-indigo-100 px-4 py-2 rounded-full">
          <span className="text-sm font-medium text-gray-700">
            Progress: {Object.values(data.interests).filter(value => value.trim() !== '').length}/23 interests
          </span>
          <div className="w-16 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${(Object.values(data.interests).filter(value => value.trim() !== '').length / 23) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Music Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">🎵 Music & Audio</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Music Category</label>
            <input
              type="text"
              value={data.interests.musicCategory}
              onChange={(e) => handleInterestChange('musicCategory', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Pop, Rock, Classical"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">All-Time Favorite Song</label>
            <input
              type="text"
              value={data.interests.song}
              onChange={(e) => handleInterestChange('song', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Bohemian Rhapsody"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Singer/Artist</label>
            <input
              type="text"
              value={data.interests.singer}
              onChange={(e) => handleInterestChange('singer', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Freddie Mercury"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Singer Group</label>
            <input
              type="text"
              value={data.interests.singerGroups}
              onChange={(e) => handleInterestChange('singerGroups', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Queen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Music Idol</label>
            <input
              type="text"
              value={data.interests.singerIdols}
              onChange={(e) => handleInterestChange('singerIdols', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Michael Jackson"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Music Band</label>
            <input
              type="text"
              value={data.interests.musicBands}
              onChange={(e) => handleInterestChange('musicBands', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., The Beatles"
            />
          </div>
        </div>

        {/* Entertainment Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">🎬 Entertainment</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">All-Time Favorite Movie</label>
            <input
              type="text"
              value={data.interests.movie}
              onChange={(e) => handleInterestChange('movie', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., The Shawshank Redemption"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Movie Category</label>
            <input
              type="text"
              value={data.interests.movieCategory}
              onChange={(e) => handleInterestChange('movieCategory', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Drama, Action, Comedy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">All-Time Favorite TV Series</label>
            <input
              type="text"
              value={data.interests.tvSeries}
              onChange={(e) => handleInterestChange('tvSeries', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Breaking Bad"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite TV Series Category</label>
            <input
              type="text"
              value={data.interests.tvSeriesCategory}
              onChange={(e) => handleInterestChange('tvSeriesCategory', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Crime, Comedy, Drama"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">All-Time Favorite Book</label>
            <input
              type="text"
              value={data.interests.book}
              onChange={(e) => handleInterestChange('book', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., To Kill a Mockingbird"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Book Category</label>
            <input
              type="text"
              value={data.interests.bookCategory}
              onChange={(e) => handleInterestChange('bookCategory', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Fiction, Mystery, Biography"
            />
          </div>
        </div>

        {/* Lifestyle Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">🌟 Lifestyle & Interests</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Cartoon/Anime</label>
            <input
              type="text"
              value={data.interests.cartoon}
              onChange={(e) => handleInterestChange('cartoon', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., SpongeBob, Naruto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dream Travel Destination</label>
            <input
              type="text"
              value={data.interests.travelDestination}
              onChange={(e) => handleInterestChange('travelDestination', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Paris, Bali, Tokyo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Travel Category</label>
            <input
              type="text"
              value={data.interests.travelDestinationCategory}
              onChange={(e) => handleInterestChange('travelDestinationCategory', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Beach, Mountains, City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Food/Cuisine</label>
            <input
              type="text"
              value={data.interests.foodCuisine}
              onChange={(e) => handleInterestChange('foodCuisine', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Italian, Indian, Japanese"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Food Category</label>
            <input
              type="text"
              value={data.interests.foodCuisineCategory}
              onChange={(e) => handleInterestChange('foodCuisineCategory', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Street Food, Fine Dining"
            />
          </div>
        </div>

        {/* Sports & Tech Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">🏃‍♂️ Sports & Tech</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Sport</label>
            <input
              type="text"
              value={data.interests.sport}
              onChange={(e) => handleInterestChange('sport', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Football, Cricket, Tennis"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Athlete</label>
            <input
              type="text"
              value={data.interests.athlete}
              onChange={(e) => handleInterestChange('athlete', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Messi, Federer, Dhoni"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Video Game</label>
            <input
              type="text"
              value={data.interests.videoGame}
              onChange={(e) => handleInterestChange('videoGame', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Minecraft, GTA, FIFA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Tech Gadget</label>
            <input
              type="text"
              value={data.interests.techGadget}
              onChange={(e) => handleInterestChange('techGadget', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., iPhone, MacBook, PlayStation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Shopping Brand</label>
            <input
              type="text"
              value={data.interests.shoppingBrand}
              onChange={(e) => handleInterestChange('shoppingBrand', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Nike, Apple, Zara"
            />
          </div>
        </div>

        {/* Personal Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">💫 Personal</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Hobby/Interest</label>
            <input
              type="text"
              value={data.interests.hobbyInterest}
              onChange={(e) => handleInterestChange('hobbyInterest', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Photography, Cooking, Reading"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unique Habit</label>
            <input
              type="text"
              value={data.interests.habit}
              onChange={(e) => handleInterestChange('habit', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Morning meditation, Night reading"
            />
          </div>
        </div>
      </div>

      {/* Generated Bio Preview */}
      {data.generatedBio && (
        <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-indigo-50 rounded-2xl border border-pink-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">✨ Your Generated Bio</h3>
          <p className="text-gray-700 leading-relaxed italic">{data.generatedBio}</p>
          <div className="mt-4 p-3 bg-white/60 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold text-green-600">✓ All 23 interests included!</span>
            </p>
            <div className="flex flex-wrap gap-1 text-xs">
              <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full">Music</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Movies</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">TV</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Books</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Travel</span>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">Food</span>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">Sports</span>
              <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full">Tech</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Hobbies</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">This comprehensive bio will be automatically added to your profile!</p>
        </div>
      )}

      {errors.interests && (
        <p className="text-red-500 text-sm text-center">{errors.interests}</p>
      )}
    </div>
  );

  const renderStep4 = () => {
    const fields: Array<{ key: keyof RegistrationData['additionalFavorites']; label: string; placeholder: string }> = [
      { key: 'musicCategory', label: 'Additional Music Categories', placeholder: 'e.g., Indie Rock' },
      { key: 'song', label: 'Additional Favorite Songs', placeholder: 'e.g., Yellow' },
      { key: 'singer', label: 'Additional Favorite Singers/Artists', placeholder: 'e.g., The Weeknd' },
      { key: 'singerGroups', label: 'Additional Singer Groups', placeholder: 'e.g., BTS' },
      { key: 'singerIdols', label: 'Additional Idols', placeholder: 'e.g., Adele' },
      { key: 'musicBands', label: 'Additional Music Bands', placeholder: 'e.g., Coldplay' },
      { key: 'movie', label: 'Additional Favorite Movies', placeholder: 'e.g., Interstellar' },
      { key: 'movieCategory', label: 'Additional Movie Categories', placeholder: 'e.g., Sci-Fi' },
      { key: 'tvSeries', label: 'Additional TV Series', placeholder: 'e.g., The Office' },
      { key: 'tvSeriesCategory', label: 'Additional TV Series Categories', placeholder: 'e.g., Sitcom' },
      { key: 'book', label: 'Additional Favorite Books', placeholder: 'e.g., 1984' },
      { key: 'bookCategory', label: 'Additional Book Categories', placeholder: 'e.g., Fantasy' },
      { key: 'cartoon', label: 'Additional Cartoons/Anime', placeholder: 'e.g., One Piece' },
      { key: 'travelDestination', label: 'Additional Travel Destinations', placeholder: 'e.g., Kyoto' },
      { key: 'travelDestinationCategory', label: 'Additional Travel Destination Categories', placeholder: 'e.g., Mountains' },
      { key: 'foodCuisine', label: 'Additional Food/Cuisines', placeholder: 'e.g., Thai' },
      { key: 'foodCuisineCategory', label: 'Additional Food Categories', placeholder: 'e.g., Street Food' },
      { key: 'sport', label: 'Additional Sports', placeholder: 'e.g., Basketball' },
      { key: 'athlete', label: 'Additional Athletes', placeholder: 'e.g., Serena Williams' },
      { key: 'videoGame', label: 'Additional Video Games', placeholder: 'e.g., Valorant' },
      { key: 'techGadget', label: 'Additional Tech Gadgets', placeholder: 'e.g., Kindle' },
      { key: 'shoppingBrand', label: 'Additional Shopping Brands', placeholder: 'e.g., Uniqlo' },
      { key: 'hobbyInterest', label: 'Additional Hobbies/Interests', placeholder: 'e.g., Gardening' },
      { key: 'habit', label: 'Additional Habits', placeholder: 'e.g., Late-night reading' },
    ];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">More Favorites (For Better Matches)</h2>
          <p className="text-gray-600">Add as many as you want in each category. These are separate from your all-time favorites.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder={placeholder}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAdditionalFavorite(key, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium"
                    onClick={(e) => {
                      const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement | null);
                      if (!input) return;
                      addAdditionalFavorite(key, input.value);
                      input.value = '';
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {data.additionalFavorites[key].length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.additionalFavorites[key].map((item, idx) => (
                    <span key={`${key}-${item}-${idx}`} className="inline-flex items-center gap-2 px-3 py-1 bg-pink-50 text-pink-700 rounded-full border border-pink-200">
                      <span className="text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeAdditionalFavorite(key, idx)}
                        className="text-pink-600 hover:text-pink-800"
                        aria-label="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {errors.additionalFavorites && (
          <p className="text-red-500 text-sm text-center">{errors.additionalFavorites}</p>
        )}

        {/* Progress Indicator */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Step 5 of 7</span>
            <span>Additional Favorites</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-pink-500 h-2 rounded-full" style={{ width: '62.5%' }}></div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Add Your Photos</h2>
        <p className="text-gray-600">Upload your best photos to make a great first impression</p>
      </div>

      {/* Photo Upload Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">📸</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Photo Guidelines</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="space-y-2">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Clear, high-quality photos</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Show your face clearly</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Recent photos (within 2 years)</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <X className="w-4 h-4 text-red-500 mr-2" />
              <span>No group photos</span>
            </div>
            <div className="flex items-center">
              <X className="w-4 h-4 text-red-500 mr-2" />
              <span>No blurry or dark images</span>
            </div>
            <div className="flex items-center">
              <X className="w-4 h-4 text-red-500 mr-2" />
              <span>No inappropriate content</span>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">🖼️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Photo Gallery</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo {index + 1} {index === 0 && <span className="text-red-500">*</span>}
              </label>
              
              <div className="relative group aspect-[3/4]">
                {data.photos[index] ? (
                  <div className="relative w-full h-full">
                    <img
                      src={data.photos[index]}
                      alt={`Photo ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => handlePhotoRemove(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                    <Camera className="w-8 h-8 text-gray-400 mb-2 group-hover:text-gray-600" />
                    <span className="text-sm text-gray-500 group-hover:text-gray-600">Add Photo</span>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, index)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              
              {index === 0 && (
                <p className="text-xs text-gray-500 mt-1 text-center">Main Profile Photo</p>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Photos will be added to both your dating and friendship profiles
          </p>
        </div>
      </div>

      {/* Photo Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">📊</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Photo Summary</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {data.photos.filter(photo => photo).length}
            </div>
            <div className="text-sm text-gray-600">Photos Uploaded</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-blue-600">
              {6 - data.photos.filter(photo => photo).length}
            </div>
            <div className="text-sm text-gray-600">Remaining Slots</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-purple-600">
              {data.photos[0] ? '✅' : '❌'}
            </div>
            <div className="text-sm text-gray-600">Main Photo</div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Step 6 of 7</span>
          <span>Photo Gallery</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Review & Complete</h2>
        <p className="text-gray-600">Take a final look at your profile before completing registration</p>
      </div>

      {/* Profile Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">👤</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Profile Summary</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Name:</span>
            <span className="ml-2 text-gray-600">{data.name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Username:</span>
            <span className="ml-2 text-gray-600">@{data.username}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Age:</span>
            <span className="ml-2 text-gray-600">{data.dob ? calculateAge(data.dob) : 'Not set'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Location:</span>
            <span className="ml-2 text-gray-600">{data.location || 'Not set'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Languages:</span>
            <span className="ml-2 text-gray-600">
              {data.spokenLanguages.length > 0 
                ? data.spokenLanguages.map(l => l.name).join(', ')
                : 'None selected'
              }
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Photos:</span>
            <span className="ml-2 text-gray-600">{data.photos.filter(p => p).length}/6 uploaded</span>
          </div>
        </div>
      </div>

      {/* Generated Bio */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">✨</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Your Unique Bio</h3>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-pink-200">
          <p className="text-gray-700 leading-relaxed">
            {data.generatedBio || 'Bio will be generated from your interests...'}
          </p>
        </div>
      </div>

      {/* Final Checklist */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">✅</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Final Checklist</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Account information completed</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Personal details added</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Preferences configured</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Interests selected</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Bio generated</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Photos uploaded</span>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Step 7 of 8</span>
          <span>Review & Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: '87.5%' }}></div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">Create Your Profile</h1>
            </div>
            <span className="text-sm text-gray-500">{pendingVerification ? 'Email Verification' : `Step ${currentStep + 1} of 7`}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${pendingVerification ? 100 : ((currentStep + 1) / 7) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  pendingVerification ? 'bg-pink-500' : (i <= currentStep ? 'bg-pink-500' : 'bg-gray-300')
                }`}
              ></div>
            ))}
          </div>
        </div>

                 {/* Step Content */}
         <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
           {pendingVerification ? renderVerificationStep() : renderStepContent()}
           
           {/* Registration Error Message */}
           {registrationError && (
             <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
               <p className="text-red-600 text-sm">{registrationError}</p>
             </div>
           )}
           
           {/* Registration Success Message */}
           {registrationSuccess && (
             <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
               <p className="text-green-600 text-sm font-medium">
                 🎉 Registration successful! Welcome to BrandBond!
               </p>
               <p className="text-green-600 text-sm mt-1">You're all set.</p>
             </div>
           )}
         </div>

        {/* Navigation */}
        {pendingVerification ? (
          <div className="flex justify-center">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium bg-white text-gray-700 hover:bg-gray-50 shadow-lg hover:shadow-xl"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg hover:shadow-xl'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={handleSkipOnboarding}
              disabled={isSubmitting || isSkipping}
              className="px-6 py-3 rounded-xl font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-lg hover:shadow-xl"
            >
              {isSkipping ? 'Skipping...' : 'Skip for now'}
            </button>

            <button
              onClick={currentStep === 6 ? handleRegistration : nextStep}
              disabled={isSubmitting}
              className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition-all ${
                currentStep === 6
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                  : 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white hover:from-indigo-600 hover:to-pink-600'
              } shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <span>{currentStep === 6 ? 'Complete Registration' : 'Next'}</span>
              )}
              {currentStep !== 6 && !isSubmitting && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationForm;
