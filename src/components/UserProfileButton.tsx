import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, LogOut, Edit3, Heart, Users, X, Palette, UserPlus, Trash2, ChevronRight } from 'lucide-react';
import DashboardService from '../services/dashboardService';
import { supabase } from '../lib/supabase';

interface UserProfileButtonProps {
  userProfile?: {
    id: string;
    name: string;
    photos: string[];
    email?: string;
  };
  stats?: {
    datesCount?: number;
    friendsCount?: number;
    communitiesCount?: number;
  };
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  theme?: 'love' | 'friends';
  className?: string;
}

const UserProfileButton: React.FC<UserProfileButtonProps> = ({
  userProfile,
  stats,
  onProfileClick,
  onSettingsClick,
  onLogout,
  theme = 'friends',
  className = ''
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const userName = userProfile?.name ?? 'User';
  const userPhotos = userProfile?.photos ?? [];

  const datesCount = typeof stats?.datesCount === 'number' ? stats.datesCount : 12;
  const friendsCount = typeof stats?.friendsCount === 'number' ? stats.friendsCount : 400;
  const communitiesCount = typeof stats?.communitiesCount === 'number' ? stats.communitiesCount : 25;

  const themeColors = {
    love: {
      primary: 'text-indigo-600 hover:text-indigo-700 active:text-indigo-800',
      bg: 'bg-indigo-50 hover:bg-indigo-100',
      border: 'border-indigo-200',
      gradient: 'from-indigo-600 via-purple-500 to-pink-600',
      accent: 'from-purple-500 to-pink-500'
    },
    friends: {
      primary: 'text-blue-600 hover:text-blue-700 active:text-blue-800',
      bg: 'bg-blue-50 hover:bg-blue-100',
      border: 'border-blue-200',
      gradient: 'from-blue-600 via-cyan-500 to-teal-600',
      accent: 'from-cyan-500 to-teal-500'
    }
  };

  const colors = themeColors[theme];

  const handleDeleteAccount = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await DashboardService.deleteAccount();

      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }

      try {
        localStorage.removeItem('brandbond_registration_progress_v1');
        localStorage.removeItem('brandbond_last_route_v1');
      } catch {
        // ignore
      }

      window.location.href = '/';
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete account';
      setDeleteError(msg);
      setIsDeleting(false);
    }
  };

  // Render the menu using Portal to escape header constraints
  const renderMenu = () => {
    if (!showDropdown) return null;

    return createPortal(
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[99998] bg-black/20"
          onClick={() => setShowDropdown(false)}
        />
        
        {/* Full Screen Menu - Slides in from right */}
        <div className="fixed top-0 right-0 w-full h-full z-[99999] flex items-start justify-end">
          <div className="w-96 h-full bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out overflow-y-auto">
            {/* 1. Top Section - Profile Image, Name, Username with Close Button */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 sm:space-x-5">
                  {userPhotos.length > 0 ? (
                    <div className="relative">
                      <img
                        src={userPhotos[0]}
                        alt={userName}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      {/* Edit Button Overlay */}
                      <button className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-all duration-200">
                        <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      {/* Edit Button Overlay */}
                      <button className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-all duration-200">
                        <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </button>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">{userName}</h3>
                    {userProfile?.email && (
                      <p className="text-xs text-gray-500 mt-1">{userProfile.email}</p>
                    )}
                  </div>
                </div>
                {/* Close Button - Top Right */}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Stats Section - Dates, Friends & Communities/Fanclubs */}
            <div className="px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-gray-100 to-gray-200">
              <div className="flex space-x-6 sm:space-x-8">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-gray-800">{datesCount}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Dates</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-gray-800">{friendsCount}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Friends</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl flex items-center justify-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-gray-800">{communitiesCount}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Communities & Fanclubs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Main Menu Options */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* My Account */}
              <button className="w-full p-4 sm:p-5 text-left bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex items-center justify-between group">
                <div className="flex items-center space-x-4 sm:space-x-5">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-semibold text-gray-800">My Account</span>
                    <p className="text-xs sm:text-sm text-gray-500">Manage your profile</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </button>

              {/* Customize */}
              <button className="w-full p-4 sm:p-5 text-left bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex items-center justify-between group">
                <div className="flex items-center space-x-4 sm:space-x-5">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-semibold text-gray-800">Customize</span>
                    <p className="text-xs sm:text-sm text-gray-500">Personalize your experience</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </button>

              {/* Ads & Promotions */}
              <button className="w-full p-4 sm:p-5 text-left bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex items-center justify-between group">
                <div className="flex items-center space-x-4 sm:space-x-5">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-white">AD</span>
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-semibold text-gray-800">Ads & Promotions</span>
                    <p className="text-xs sm:text-sm text-gray-500">Manage notifications</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </button>

              {/* Invite Friends */}
              <button className="w-full p-4 sm:p-5 text-left bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex items-center justify-between group">
                <div className="flex items-center space-x-4 sm:space-x-5">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-semibold text-gray-800">Invite Friends</span>
                    <p className="text-xs sm:text-sm text-gray-500">Share with others</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </button>
            </div>

            {/* 4. Highlighted Footer Section - Logout & Delete Side by Side with No Taglines */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-red-50 to-pink-50 border-t border-red-200">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    onLogout();
                    setShowDropdown(false);
                  }}
                  className="flex-1 p-3 sm:p-4 text-left bg-white rounded-2xl border border-red-200 hover:border-red-300 hover:shadow-lg transition-all duration-200 flex items-center space-x-3 sm:space-x-4 group"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-red-700">Logout</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDeleteError(null);
                    setShowDeleteConfirm(true);
                  }}
                  className="flex-1 p-3 sm:p-4 text-left bg-white rounded-2xl border border-red-200 hover:border-red-300 hover:shadow-lg transition-all duration-200 flex items-center space-x-3 sm:space-x-4 group"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-red-700 whitespace-nowrap">Delete Account</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => {
                if (isDeleting) return;
                setShowDeleteConfirm(false);
              }}
            />

            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-gray-900">Delete your account?</h3>
                <button
                  onClick={() => {
                    if (isDeleting) return;
                    setShowDeleteConfirm(false);
                  }}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="mt-2 text-sm text-gray-600">
                This will permanently delete your account and you will be logged out.
              </p>

              {deleteError && (
                <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  {deleteError}
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => {
                    if (isDeleting) return;
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body
    );
  };

  return (
    <>
      {/* Profile Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`p-1 xs:p-1.5 sm:p-2 ${colors.primary} hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full ${colors.bg} ${className}`}
        title={`${userName}'s Profile`}
      >
        {userPhotos.length > 0 ? (
          <img
            src={userPhotos[0]}
            alt={userName}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-white shadow-sm"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <User className={`w-6 h-6 sm:w-7 sm:h-7 ${userPhotos.length === 0 ? '' : 'hidden'}`} />
      </button>

      {/* Render Menu using Portal */}
      {renderMenu()}
    </>
  );
};

export default UserProfileButton;
