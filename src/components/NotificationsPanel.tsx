import React from 'react';
import { Bell, X, Heart, MessageCircle, Calendar, MapPin, Users, Star, Trophy, Sparkles, Clock, Check, AlertCircle } from 'lucide-react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onNotificationAction: (notification: any) => void;
  formatTimestamp: (timestamp: string) => string;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onNotificationAction,
  formatTimestamp
}) => {
  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_match':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'date_request':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'location_share':
        return <MapPin className="w-5 h-5 text-green-500" />;
      case 'mutual_interest':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'achievement':
        return <Trophy className="w-5 h-5 text-orange-500" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-pink-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_match':
        return 'border-l-red-500 bg-red-50';
      case 'date_request':
        return 'border-l-purple-500 bg-purple-50';
      case 'message':
        return 'border-l-blue-500 bg-blue-50';
      case 'location_share':
        return 'border-l-green-500 bg-green-50';
      case 'mutual_interest':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'achievement':
        return 'border-l-orange-500 bg-orange-50';
      case 'system':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-pink-500 bg-pink-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors duration-75"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <h3 className="text-lg font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors duration-200"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No notifications yet</h3>
              <p className="text-gray-500">You'll see notifications here when you have new matches, messages, or updates.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getNotificationColor(notification.type)} hover:bg-gray-50 transition-colors duration-200 ${
                    !notification.isRead ? 'bg-opacity-80' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div
                            className="text-sm font-medium text-gray-900 mb-1"
                            dangerouslySetInnerHTML={{ __html: notification.title }}
                          />
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          {/* Profile Info for Match Notifications */}
                          {notification.profile && (
                            <div className="flex items-center space-x-3 mb-3 p-3 bg-white rounded-lg border border-gray-200">
                              <img
                                src={notification.profile.photos?.[0] || '/default-avatar.png'}
                                alt={notification.profile.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{notification.profile.name}</h4>
                                <p className="text-sm text-gray-600">{notification.profile.age} • {notification.profile.location}</p>
                                {notification.profile.matchPercentage && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <Heart className="w-3 h-3 text-pink-500 fill-current" />
                                    <span className="text-xs text-pink-600 font-medium">
                                      {notification.profile.matchPercentage}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(notification.timestamp)}</span>
                            </span>
                            
                            <div className="flex items-center space-x-2">
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                              )}
                              
                              {notification.action && (
                                <button
                                  onClick={() => onNotificationAction(notification)}
                                  className="text-xs bg-pink-500 text-white px-3 py-1 rounded-full hover:bg-pink-600 transition-colors duration-200"
                                >
                                  {notification.action === 'view_profile' ? 'View Profile' :
                                   notification.action === 'view_date_request' ? 'View Request' :
                                   notification.action === 'respond' ? 'Respond' :
                                   'View'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {!notification.isRead && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-green-500 transition-colors duration-200"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => onDeleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                            title="Delete notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
              {unreadCount > 0 && (
                <span className="text-pink-600 font-medium">{unreadCount} unread</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;





