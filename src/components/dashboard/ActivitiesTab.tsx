import React, { useState } from 'react';
import { MessageCircle, Sparkles, ThumbsUp, Share2 } from 'lucide-react';
import { RecentActivity } from '../../services/dashboardService';
import { useUserActivitiesRealtime } from '../../hooks/useUserActivitiesRealtime';

interface ActivitiesTabProps {
  userId: string;
  onNavigate: (page: string) => void;
  handleMatchAction: (action: string, matchId: string) => void;
  handleCommunityAction: (action: string, communityId: string) => void;
  refreshData: () => void;
  isRefreshing: boolean;
  demoNotifications: string[];
  setActiveTab: (tab: string) => void;
}

const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  userId,
  onNavigate: _onNavigate,
  handleMatchAction: _handleMatchAction,
  handleCommunityAction: _handleCommunityAction,
  refreshData,
  isRefreshing: _isRefreshing,
  demoNotifications: _demoNotifications,
  setActiveTab
}) => {
  const { activities: rows, loading } = useUserActivitiesRealtime(userId, 50);
  const [selectedType, setSelectedType] = useState('all');

  const activities: RecentActivity[] = (rows || []).map((r) => ({
    id: r.id,
    type: r.activity_type as any,
    title: r.title,
    description: r.description,
    timestamp: r.created_at,
  }));

  const activityTypes = [
    { id: 'all', label: 'All Activities', icon: '✨' },
    { id: 'new_match', label: 'New Matches', icon: '💕' },
    { id: 'community_join', label: 'Community', icon: '🏘️' },
    { id: 'achievement_earned', label: 'Achievements', icon: '🏆' },
    { id: 'profile_update', label: 'Profile', icon: '👤' },
    { id: 'interest_change', label: 'Interests', icon: '🎯' }
  ];

  const filteredActivities = selectedType === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === selectedType);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_match': return '💕';
      case 'community_join': return '🏘️';
      case 'achievement_earned': return '🏆';
      case 'profile_update': return '👤';
      case 'interest_change': return '🎯';
      default: return '✨';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'new_match': return 'from-pink-400 to-rose-400';
      case 'community_join': return 'from-blue-400 to-indigo-400';
      case 'achievement_earned': return 'from-yellow-400 to-orange-400';
      case 'profile_update': return 'from-purple-400 to-pink-400';
      case 'interest_change': return 'from-green-400 to-emerald-400';
      default: return 'from-purple-400 to-pink-400';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading your activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Your Activity Feed ✨
        </h1>
        <p className="text-gray-600 text-lg">Stay updated with your latest interactions and achievements</p>
      </div>

      {/* Activity Type Filters */}
      <div className="flex items-center justify-center space-x-3 mb-8">
        {activityTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
              selectedType === type.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/80 text-gray-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {filteredActivities.map((activity) => (
          <div key={activity.id} className="bg-white/80 backdrop-blur-sm rounded-full p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-150 hover:scale-105 group">
            <div className="flex items-start space-x-4">
              {/* Activity Icon */}
              <div className={`w-16 h-16 bg-gradient-to-r ${getActivityColor(activity.type)} rounded-2xl flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* Activity Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800">{activity.title}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{activity.description}</p>
                
                {/* Activity Actions */}
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full hover:from-purple-200 hover:to-pink-200 transition-all duration-200">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Like</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full hover:from-blue-200 hover:to-cyan-200 transition-all duration-200">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Comment</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full hover:from-green-200 hover:to-emerald-200 transition-all duration-200">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-12 h-12 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {selectedType === 'all' ? 'No activities yet' : `No ${selectedType} activities`}
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedType === 'all' 
              ? 'Start interacting with matches and communities to see your activity feed come alive!' 
              : `No ${selectedType} activities found yet.`
            }
          </p>
          <button 
            onClick={refreshData}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200"
          >
            Refresh Activities
          </button>
        </div>
      )}

      {/* Activity Stats */}
      {activities.length > 0 && (
        <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Activity Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activityTypes.slice(1).map((type) => {
              const count = activities.filter(activity => activity.type === type.id).length;
              return (
                <div key={type.id} className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2 shadow-md">
                    {type.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{count}</div>
                  <div className="text-sm text-gray-600">{type.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="flex items-center justify-center space-x-4">
          <button 
            onClick={() => setActiveTab('matches')}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            Browse Matches
          </button>
          <button 
            onClick={() => setActiveTab('communities')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            Explore Communities
          </button>
          <button 
            onClick={() => setActiveTab('overview')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            Back to Overview
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesTab;
