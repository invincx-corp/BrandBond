export const sampleFanclubData = {
  id: 1,
  name: "Tech Enthusiasts United",
  description: "A passionate community of technology lovers, developers, and innovators who share the latest tech trends, discuss cutting-edge developments, and collaborate on exciting projects. We're not just fans - we're creators, builders, and dreamers who believe technology can change the world.",
  category: "Technology & Innovation",
  type: 'public' as const,
  foundedDate: "January 2023",
  memberCount: 12450,
  maxMembers: 50000,
  location: "Global",
  avatar: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=80&h=80&fit=crop",
  banner: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop",
  matchPercentage: 92,
  sharedInterests: ["Technology", "Programming", "Artificial Intelligence", "Innovation", "Startups", "Gadgets"],
  isJoined: false,
  tags: ["Tech", "Innovation", "Programming", "AI", "Startups"],
  coreValues: ["Innovation", "Collaboration", "Learning", "Inclusivity", "Excellence"],
  activityLevel: 'very-active' as const,
  contentTypes: ["Discussions", "Tutorials", "Project Showcases", "Tech News", "Q&A Sessions"],
  rules: ["Be respectful and inclusive", "Share knowledge generously", "No spam or self-promotion", "Stay on topic"],
  founder: {
    name: "Alex Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    bio: "Tech entrepreneur and AI researcher with 15+ years in the industry"
  },
  moderators: [
    {
      id: 1,
      name: "Sarah Kim",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
      role: 'moderator' as const,
      joinedDate: "February 2023",
      interests: ["Machine Learning", "Data Science", "Python"]
    },
    {
      id: 2,
      name: "Mike Rodriguez",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      role: 'moderator' as const,
      joinedDate: "March 2023",
      interests: ["Web Development", "JavaScript", "React"]
    }
  ],
  recentPosts: [
    {
      id: 1,
      author: "Emma Watson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      content: "Just built my first AI chatbot using the resources shared here! The community support was incredible.",
      likes: 156,
      comments: 23,
      timestamp: "2 hours ago",
      type: 'text' as const
    },
    {
      id: 2,
      author: "David Park",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      content: "Anyone interested in collaborating on a blockchain project? Looking for developers and designers!",
      likes: 89,
      comments: 45,
      timestamp: "5 hours ago",
      type: 'text' as const
    },
    {
      id: 3,
      author: "Lisa Chang",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
      content: "Check out this amazing tutorial on building responsive web apps with modern CSS!",
      likes: 234,
      comments: 67,
      timestamp: "1 day ago",
      type: 'text' as const
    },
    {
      id: 4,
      author: "Tom Wilson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      content: "The future of quantum computing is here! Let's discuss the implications for our industry.",
      likes: 312,
      comments: 89,
      timestamp: "2 days ago",
      type: 'text' as const
    }
  ],
  upcomingEvents: [
    {
      id: 1,
      title: "AI Hackathon 2024",
      date: "March 15-17, 2024",
      type: 'hybrid' as const,
      attendees: 150,
      maxAttendees: 200
    },
    {
      id: 2,
      title: "Tech Talk: Future of Web3",
      date: "March 25, 2024",
      type: 'online' as const,
      attendees: 75,
      maxAttendees: 100
    }
  ],
  memberStories: [
    {
      id: 1,
      member: "Jennifer Lee",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
      story: "Joined this fanclub as a beginner programmer and now I'm leading a team of 5 developers! The mentorship here is incredible.",
      impact: "Career transformation from junior to senior developer in 18 months"
    },
    {
      id: 2,
      member: "Robert Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      story: "Met my co-founder here and we just raised $2M for our startup. This community doesn't just talk tech - it builds the future.",
      impact: "Successfully launched startup with community connections"
    }
  ]
};

export const sampleUserProfile = {
  interests: ["Technology", "Programming", "Artificial Intelligence", "Innovation", "Startups", "Gadgets", "Machine Learning", "Data Science"],
  personality: ["Analytical", "Creative", "Ambitious", "Collaborative"],
  location: "San Francisco",
  activityLevel: "Very Active"
};
