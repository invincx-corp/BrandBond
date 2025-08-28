import React from 'react';
import CommunityPage from './CommunityPage';

const CommunityDemo: React.FC = () => {
  const mockUserProfile = {
    interests: [
      'Technology', 'Programming', 'Artificial Intelligence', 'Innovation',
      'Startups', 'Machine Learning', 'Data Science', 'Web Development'
    ],
    name: 'Alex Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'
  };

  return (
    <CommunityPage
      communityId={1}
      userProfile={mockUserProfile}
    />
  );
};

export default CommunityDemo;
