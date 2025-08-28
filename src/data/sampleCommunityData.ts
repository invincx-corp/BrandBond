export const sampleCommunityData = {
  id: 1,
  name: "Climate Action Warriors",
  description: "A passionate community of environmental activists, sustainability enthusiasts, and climate-conscious individuals working together to create positive change for our planet.",
  category: "Environment & Sustainability",
  type: "public" as const,
  foundedDate: "March 2023",
  memberCount: 2847,
  maxMembers: 5000,
  location: "Global",
  avatar: "https://images.unsplash.com/photo-1569163139394-de4e1f6d0c3e?w=150&h=150&fit=crop&crop=center",
  banner: "https://images.unsplash.com/photo-1569163139394-de4e1f6d0c3e?w=800&h=300&fit=crop&crop=center",
  matchPercentage: 87,
  sharedInterests: ["Climate Change", "Sustainability", "Renewable Energy", "Environmental Activism", "Green Living"],
  isJoined: false,
  tags: ["Climate Action", "Sustainability", "Environmental", "Activism", "Green Tech"],
  coreValues: ["Environmental Justice", "Scientific Integrity", "Community Action", "Innovation", "Inclusivity"],
  activityLevel: "very-active" as const,
  contentTypes: ["Discussions", "Events", "Projects", "Resources", "Success Stories"],
  rules: [
    "Respect all perspectives and experiences",
    "Share evidence-based information",
    "Support and encourage fellow members",
    "Take action in your local community",
    "Celebrate small wins and big victories"
  ],
  founder: {
    name: "Dr. Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=center",
    bio: "Environmental scientist and climate activist with 15+ years of experience in sustainability research and community organizing."
  },
  moderators: [
    {
      id: 1,
      name: "Marcus Rodriguez",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=center",
      role: "moderator" as const,
      joinedDate: "April 2023",
      interests: ["Renewable Energy", "Policy Advocacy", "Community Organizing"]
    },
    {
      id: 2,
      name: "Priya Patel",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=center",
      role: "moderator" as const,
      joinedDate: "May 2023",
      interests: ["Sustainable Agriculture", "Food Systems", "Education"]
    }
  ],
  recentPosts: [
    {
      id: 1,
      author: "Alex Thompson",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=center",
      content: "Just completed our community solar panel installation! We're now generating 80% of our building's energy needs. The feeling of contributing to a cleaner future is incredible! 🌞⚡",
      likes: 127,
      comments: 23,
      timestamp: "2 hours ago",
      type: "text" as const
    },
    {
      id: 2,
      author: "Emma Wilson",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=center",
      content: "Sharing our local climate action group's success story: We convinced our city council to adopt a climate action plan! Small steps lead to big changes. 💚",
      likes: 89,
      comments: 15,
      timestamp: "5 hours ago",
      type: "text" as const
    },
    {
      id: 3,
      author: "David Kim",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=center",
      content: "New research shows that community gardens can reduce urban heat island effects by up to 3°C. Let's start more green spaces in our neighborhoods! 🌱",
      likes: 156,
      comments: 31,
      timestamp: "1 day ago",
      type: "text" as const
    },
    {
      id: 4,
      author: "Lisa Chen",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=center",
      content: "Our youth climate strike this weekend was amazing! Over 500 students showed up to demand action. The future is in good hands! ✊🌍",
      likes: 203,
      comments: 42,
      timestamp: "2 days ago",
      type: "text" as const
    }
  ],
  upcomingEvents: [
    {
      id: 1,
      title: "Global Climate Action Day",
      date: "December 15, 2024",
      type: "hybrid" as const,
      attendees: 156,
      maxAttendees: 200
    },
    {
      id: 2,
      title: "Sustainable Living Workshop",
      date: "December 22, 2024",
      type: "online" as const,
      attendees: 89,
      maxAttendees: 100
    }
  ],
  memberStories: [
    {
      id: 1,
      member: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=center",
      story: "I was feeling overwhelmed by climate anxiety until I found this community. Now I'm leading local sustainability initiatives and feel empowered to make a difference.",
      impact: "Found purpose and community through climate action"
    },
    {
      id: 2,
      member: "Michael Brown",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=center",
      story: "This community helped me transition my business to 100% renewable energy. The support and resources here are incredible - we're stronger together!",
      impact: "Transformed business to sustainable practices"
    }
  ]
};

export const sampleUserProfile = {
  interests: ["Climate Change", "Sustainability", "Renewable Energy", "Environmental Activism", "Green Living", "Technology", "Innovation"],
  personality: ["Passionate", "Action-oriented", "Community-minded", "Innovative", "Empathetic"],
  location: "San Francisco",
  activityLevel: "very-active"
};

// Additional sample communities for variety
export const sampleCommunities = [
  {
    ...sampleCommunityData,
    id: 1,
    name: "Climate Action Warriors",
    matchPercentage: 87
  },
  {
    ...sampleCommunityData,
    id: 2,
    name: "Tech Innovators Hub",
    category: "Technology & Innovation",
    matchPercentage: 92,
    sharedInterests: ["Technology", "Innovation", "AI", "Startups", "Digital Transformation"],
    tags: ["Technology", "Innovation", "AI", "Startups", "Digital"],
    coreValues: ["Innovation", "Collaboration", "Learning", "Impact", "Excellence"],
    recentPosts: [
      {
        id: 1,
        author: "Tech Leader",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=center",
        content: "Just launched our AI-powered sustainability platform! The potential for positive impact is enormous. 🚀🤖",
        likes: 234,
        comments: 45,
        timestamp: "1 hour ago",
        type: "text" as const
      }
    ]
  },
  {
    ...sampleCommunityData,
    id: 3,
    name: "Creative Arts Collective",
    category: "Arts & Creativity",
    matchPercentage: 78,
    sharedInterests: ["Art", "Creativity", "Design", "Music", "Expression"],
    tags: ["Arts", "Creativity", "Design", "Music", "Expression"],
    coreValues: ["Creativity", "Expression", "Diversity", "Inspiration", "Community"],
    recentPosts: [
      {
        id: 1,
        author: "Creative Artist",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=center",
        content: "Our community art project is coming together beautifully! Art has the power to unite and inspire change. 🎨✨",
        likes: 156,
        comments: 28,
        timestamp: "3 hours ago",
        type: "text" as const
      }
    ]
  }
];
