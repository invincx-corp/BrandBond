import { X, Clock, DollarSign, Coffee, Utensils, Film, Gamepad2, Book, Leaf } from 'lucide-react';

interface DatePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  step: 'type' | 'details' | 'review';
  datePlan: any;
  onDatePlanChange: (field: string, value: string) => void;
  onSelectDateSuggestion: (suggestion: any) => void;
  onSendDateRequest: () => void;
  onBack: () => void;
  onNext: () => void;
}

const DatePlanningModal: React.FC<DatePlanningModalProps> = ({
  isOpen,
  onClose,
  profile,
  step,
  datePlan,
  onDatePlanChange,
  onSelectDateSuggestion,
  onSendDateRequest,
  onBack,
  onNext
}) => {
  if (!isOpen) return null;

  const generateDateSuggestions = (profile: any) => {
    const suggestions = [
      {
        id: 1,
        type: 'Coffee & Conversation',
        icon: Coffee,
        description: 'A relaxed coffee date to get to know each other better',
        duration: '1-2 hours',
        budget: 'Low',
        location: 'Local coffee shop',
        tags: ['Casual', 'Conversation', 'Low pressure']
      },
      {
        id: 2,
        type: 'Dinner Date',
        icon: Utensils,
        description: 'An elegant dinner for a more romantic evening',
        duration: '2-3 hours',
        budget: 'Medium',
        location: 'Nice restaurant',
        tags: ['Romantic', 'Elegant', 'Dinner']
      },
      {
        id: 3,
        type: 'Movie Night',
        icon: Film,
        description: 'Watch a movie together and discuss it afterward',
        duration: '2-3 hours',
        budget: 'Low-Medium',
        location: 'Cinema or home',
        tags: ['Entertainment', 'Shared experience', 'Discussion']
      },
      {
        id: 4,
        type: 'Outdoor Adventure',
        icon: Leaf,
        description: 'Explore nature together with a hike or walk',
        duration: '2-4 hours',
        budget: 'Low',
        location: 'Park or trail',
        tags: ['Active', 'Nature', 'Healthy']
      },
      {
        id: 5,
        type: 'Cultural Experience',
        icon: Book,
        description: 'Visit a museum, gallery, or cultural event',
        duration: '2-3 hours',
        budget: 'Low-Medium',
        location: 'Cultural venue',
        tags: ['Educational', 'Cultural', 'Intellectual']
      },
      {
        id: 6,
        type: 'Game Night',
        icon: Gamepad2,
        description: 'Play board games or video games together',
        duration: '2-4 hours',
        budget: 'Low',
        location: 'Home or game cafe',
        tags: ['Fun', 'Interactive', 'Competitive']
      }
    ];

    return suggestions;
  };

  const renderStep1 = () => (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Choose Date Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {generateDateSuggestions(profile).map((suggestion) => {
          const IconComponent = suggestion.icon;
          return (
            <div
              key={suggestion.id}
              onClick={() => onSelectDateSuggestion(suggestion)}
              className="p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <IconComponent className="w-6 h-6 text-pink-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">{suggestion.type}</h4>
                  <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{suggestion.duration}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{suggestion.budget}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {suggestion.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Date Details</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Type</label>
          <input
            type="text"
            value={datePlan.type}
            onChange={(e) => onDatePlanChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="e.g., Coffee & Conversation"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={datePlan.date}
              onChange={(e) => onDatePlanChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <input
              type="time"
              value={datePlan.time}
              onChange={(e) => onDatePlanChange('time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={datePlan.location}
            onChange={(e) => onDatePlanChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="e.g., Starbucks on Main Street"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Activity</label>
          <input
            type="text"
            value={datePlan.activity}
            onChange={(e) => onDatePlanChange('activity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="e.g., Coffee and conversation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
          <select
            value={datePlan.budget}
            onChange={(e) => onDatePlanChange('budget', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Select budget</option>
            <option value="Low ($0-20)">Low ($0-20)</option>
            <option value="Medium ($20-50)">Medium ($20-50)</option>
            <option value="High ($50+)">High ($50+)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={datePlan.description}
            onChange={(e) => onDatePlanChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Describe your ideal date..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Special Notes</label>
          <textarea
            value={datePlan.specialNotes}
            onChange={(e) => onDatePlanChange('specialNotes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Any special requests or notes..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Review & Send</h3>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">Date Request Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium">{datePlan.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{datePlan.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium">{datePlan.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Location:</span>
            <span className="font-medium">{datePlan.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Budget:</span>
            <span className="font-medium">{datePlan.budget}</span>
          </div>
          {datePlan.description && (
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium">{datePlan.description}</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Ready to send this date request to <span className="font-semibold text-pink-600">{profile.name}</span>?
        </p>
        <button
          onClick={onSendDateRequest}
          className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
        >
          💕 Send Date Request
        </button>
      </div>
    </div>
  );

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
            <h3 className="text-lg font-bold">Plan a Date with {profile?.name}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              Step {step === 'type' ? 1 : step === 'details' ? 2 : 3} of 3
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 h-1">
          <div
            className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-300"
            style={{
              width: step === 'type' ? '33.33%' : step === 'details' ? '66.66%' : '100%'
            }}
          />
        </div>

        {/* Content */}
        {step === 'type' && renderStep1()}
        {step === 'details' && renderStep2()}
        {step === 'review' && renderStep3()}

        {/* Navigation */}
        {step !== 'type' && (
          <div className="border-t border-gray-200 p-4 flex justify-between">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              ← Back
            </button>
            {step === 'details' && (
              <button
                onClick={onNext}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
              >
                Next →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatePlanningModal;





