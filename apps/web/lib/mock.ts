// Mock freelancers data for development and testing

export interface Freelancer {
  id: string;
  username: string;
  name: string;
  headline: string;
  rate: number;
  skills: string[];
  bio: string;
  avatar: string;
  portfolio: {
    title: string;
    description: string;
    image: string;
    url: string;
  }[];
  rating: number;
  reviews: number;
  location: string;
  availability: string;
}

export const mockFreelancers: Freelancer[] = [
  {
    id: '1',
    username: 'maya-dev',
    name: 'Maya Chen',
    headline: 'Full-Stack Developer & UI/UX Designer',
    rate: 85,
    skills: ['React', 'TypeScript', 'Node.js', 'Figma', 'Tailwind CSS'],
    bio: 'Passionate full-stack developer with 6+ years of experience building scalable web applications. I specialize in React ecosystems and modern UI/UX design principles. Let me help bring your digital vision to life.',
    avatar: '/avatars/maya.jpg',
    portfolio: [
      {
        title: 'E-Commerce Platform',
        description: 'Built a full-featured e-commerce platform with React, Node.js, and Stripe integration.',
        image: '/portfolio/ecommerce.jpg',
        url: 'https://example.com/ecommerce'
      },
      {
        title: 'Task Management App',
        description: 'Designed and developed a collaborative task management tool with real-time updates.',
        image: '/portfolio/taskapp.jpg',
        url: 'https://example.com/taskapp'
      }
    ],
    rating: 4.9,
    reviews: 47,
    location: 'San Francisco, CA',
    availability: 'Full-time'
  },
  {
    id: '2',
    username: 'jordan-ux',
    name: 'Jordan Rivera',
    headline: 'Senior UX Designer & Design Systems Expert',
    rate: 95,
    skills: ['UX Research', 'Figma', 'Design Systems', 'Prototyping', 'User Testing'],
    bio: 'Award-winning UX designer with 8+ years of experience creating intuitive digital experiences. I help startups and enterprises build user-centered products that drive engagement and satisfaction.',
    avatar: '/avatars/jordan.jpg',
    portfolio: [
      {
        title: 'Banking App Redesign',
        description: 'Led the complete UX redesign of a mobile banking app, resulting in 40% increase in user engagement.',
        image: '/portfolio/banking.jpg',
        url: 'https://example.com/banking'
      },
      {
        title: 'Healthcare Portal',
        description: 'Designed an accessible patient portal with focus on usability and compliance.',
        image: '/portfolio/healthcare.jpg',
        url: 'https://example.com/healthcare'
      }
    ],
    rating: 4.8,
    reviews: 62,
    location: 'New York, NY',
    availability: 'Freelance'
  },
  {
    id: '3',
    username: 'alex-data',
    name: 'Alex Kim',
    headline: 'Data Scientist & Machine Learning Engineer',
    rate: 120,
    skills: ['Python', 'TensorFlow', 'SQL', 'Data Visualization', 'NLP'],
    bio: 'Data scientist with a PhD in Computer Science and 5 years of industry experience. I turn complex data into actionable insights and build ML models that solve real business problems.',
    avatar: '/avatars/alex.jpg',
    portfolio: [
      {
        title: 'Predictive Analytics Dashboard',
        description: 'Built a real-time predictive analytics dashboard for a logistics company.',
        image: '/portfolio/analytics.jpg',
        url: 'https://example.com/analytics'
      }
    ],
    rating: 4.7,
    reviews: 23,
    location: 'Austin, TX',
    availability: 'Part-time'
  }
];

export function getFreelancerByUsername(username: string): Freelancer | undefined {
  return mockFreelancers.find(
    (freelancer) => freelancer.username === username
  );
}
