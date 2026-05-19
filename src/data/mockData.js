// Mock student user
export const currentStudent = {
  id: 'S001',
  name: 'Arjun Mehta',
  email: 'arjun.mehta@example.com',
  phone: '+91 98765 43210',
  course: 'Full Stack Web Development',
  batch: 'Batch 2024-B',
  enrollmentDate: '2024-01-15',
  mentor: {
    id: 'M001',
    name: 'Priya Sharma',
    specialisation: 'Full Stack Development',
    experience: '8 years',
    email: 'priya.sharma@catalyst.com',
    phone: '+91 99887 76655',
  },
  progress: 62,
  totalSessions: 24,
  completedSessions: 15,
  upcomingSessions: 2,
};

// Mock assignments
export const assignments = [
  {
    id: 'A001',
    title: 'Build a REST API with Node.js',
    description:
      'Create a fully functional REST API using Node.js and Express. Include CRUD operations for a user management system with proper authentication using JWT tokens.',
    dueDate: '2024-04-20',
    assignedDate: '2024-04-08',
    status: 'pending',
    mentor: 'Priya Sharma',
    attachments: 0,
  },
  {
    id: 'A002',
    title: 'React Component Architecture',
    description:
      'Design and implement a reusable component library in React. Focus on component composition, prop drilling alternatives, and state management patterns.',
    dueDate: '2024-04-15',
    assignedDate: '2024-04-01',
    status: 'submitted',
    mentor: 'Priya Sharma',
    submittedDate: '2024-04-13',
    attachments: 2,
  },
  {
    id: 'A003',
    title: 'Database Design — E-Commerce Schema',
    description:
      'Design a normalized database schema for an e-commerce platform. Include tables for users, products, orders, and inventory management.',
    dueDate: '2024-04-10',
    assignedDate: '2024-03-28',
    status: 'overdue',
    mentor: 'Priya Sharma',
    attachments: 1,
  },
  {
    id: 'A004',
    title: 'CSS Grid & Flexbox Layouts',
    description:
      'Build three responsive webpage layouts using CSS Grid and Flexbox. Each layout must be fully responsive from mobile to desktop.',
    dueDate: '2024-05-01',
    assignedDate: '2024-04-10',
    status: 'upcoming',
    mentor: 'Priya Sharma',
    attachments: 0,
  },
  {
    id: 'A005',
    title: 'JavaScript Array Methods Deep Dive',
    description:
      'Complete a set of 20 coding challenges using only native JS array methods. No loops allowed — use map, filter, reduce, find, etc.',
    dueDate: '2024-03-25',
    assignedDate: '2024-03-10',
    status: 'submitted',
    mentor: 'Priya Sharma',
    submittedDate: '2024-03-23',
    attachments: 1,
  },
];

// Mock sessions
export const sessions = [
  {
    id: 'SES001',
    title: 'React Hooks Deep Dive',
    mentor: 'Priya Sharma',
    date: '2024-04-18',
    time: '10:00 AM',
    duration: '60 min',
    type: 'One-on-One',
    status: 'upcoming',
    notes: 'Cover useEffect, useMemo, useCallback patterns',
    meetLink: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: 'SES002',
    title: 'Node.js Performance Optimization',
    mentor: 'Priya Sharma',
    date: '2024-04-22',
    time: '3:00 PM',
    duration: '45 min',
    type: 'One-on-One',
    status: 'upcoming',
    notes: 'Review assignment progress and discuss optimization techniques',
    meetLink: 'https://meet.google.com/xyz-uvwx-yz',
  },
  {
    id: 'SES003',
    title: 'JavaScript Fundamentals Review',
    mentor: 'Priya Sharma',
    date: '2024-04-05',
    time: '11:00 AM',
    duration: '60 min',
    type: 'One-on-One',
    status: 'completed',
    notes: 'Covered closures, prototype chain, async/await',
    feedback: 'Great session! Arjun showed solid understanding of async concepts.',
  },
  {
    id: 'SES004',
    title: 'Database Design Walkthrough',
    mentor: 'Priya Sharma',
    date: '2024-04-01',
    time: '2:00 PM',
    duration: '60 min',
    type: 'One-on-One',
    status: 'completed',
    notes: 'Reviewed schema design for assignment #3',
    feedback: 'Good effort. Need to improve normalization techniques.',
  },
  {
    id: 'SES005',
    title: 'CSS & Responsive Design',
    mentor: 'Priya Sharma',
    date: '2024-03-28',
    time: '10:00 AM',
    duration: '45 min',
    type: 'One-on-One',
    status: 'completed',
    notes: 'Flexbox, Grid, and media queries',
    feedback: 'Excellent implementation of grid layouts.',
  },
];

// Mock available slots
export const availableSlots = [
  {
    id: 'SL001',
    mentor: { name: 'Priya Sharma', specialisation: 'Full Stack Development', id: 'M001' },
    date: '2024-04-19',
    time: '10:00 AM – 11:00 AM',
    duration: '60 min',
    type: 'One-on-One',
    topic: 'Open Discussion / Doubt Clearing',
    available: true,
  },
  {
    id: 'SL002',
    mentor: { name: 'Priya Sharma', specialisation: 'Full Stack Development', id: 'M001' },
    date: '2024-04-20',
    time: '3:00 PM – 3:45 PM',
    duration: '45 min',
    type: 'One-on-One',
    topic: 'Code Review Session',
    available: true,
  },
  {
    id: 'SL003',
    mentor: { name: 'Priya Sharma', specialisation: 'Full Stack Development', id: 'M001' },
    date: '2024-04-24',
    time: '11:00 AM – 12:00 PM',
    duration: '60 min',
    type: 'One-on-One',
    topic: 'Project Planning & Roadmap',
    available: true,
  },
  {
    id: 'SL004',
    mentor: { name: 'Priya Sharma', specialisation: 'Full Stack Development', id: 'M001' },
    date: '2024-04-26',
    time: '4:00 PM – 4:30 PM',
    duration: '30 min',
    type: 'Quick Check-in',
    topic: 'Progress Review',
    available: true,
  },
];

// Mock chat messages
export const chatContacts = [
  {
    id: 'M001',
    name: 'Priya Sharma',
    role: 'Mentor',
    specialisation: 'Full Stack Development',
    online: true,
    lastMessage: 'Great work on the last assignment!',
    lastTime: '10:32 AM',
    unread: 2,
  },
];

export const chatMessages = {
  M001: [
    {
      id: 1,
      from: 'M001',
      text: 'Hi Arjun! How are you progressing with the REST API assignment?',
      time: '9:15 AM',
      date: 'Today',
    },
    {
      id: 2,
      from: 'self',
      text: "Hi Priya! I've completed the basic CRUD operations. Working on the JWT authentication part now.",
      time: '9:22 AM',
      date: 'Today',
    },
    {
      id: 3,
      from: 'M001',
      text: 'That sounds great! Make sure you handle token expiry and refresh tokens properly. It\'s a common pain point.',
      time: '9:25 AM',
      date: 'Today',
    },
    {
      id: 4,
      from: 'self',
      text: 'Yes, I was just looking into that. Should I use a separate refresh token endpoint or handle it in middleware?',
      time: '9:28 AM',
      date: 'Today',
    },
    {
      id: 5,
      from: 'M001',
      text: 'A dedicated refresh endpoint is cleaner. Keep the middleware focused on validation only. I\'ll share a reference architecture in our next session.',
      time: '9:31 AM',
      date: 'Today',
    },
    {
      id: 6,
      from: 'M001',
      text: 'Great work on the last assignment!',
      time: '10:32 AM',
      date: 'Today',
    },
  ],
};

// Credentials for login (demo)
export const validCredentials = {
  email: 'arjun.mehta@example.com',
  password: 'student123',
};
