export interface Freelancer {
  id: string;
  username: string;
  name: string;
  role: string;
  hourlyRate: number;
  bio: string;
  skills: string[];
}

export const freelancers: Freelancer[] = [
  {
    id: '1',
    username: 'maya-dev',
    name: 'Maya Chen',
    role: 'Full-Stack Developer',
    hourlyRate: 85,
    bio: 'Experienced full-stack developer with 8 years in web technologies.',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
  },
  {
    id: '2',
    username: 'jordan-ux',
    name: 'Jordan Lee',
    role: 'UX Designer',
    hourlyRate: 70,
    bio: 'Creative UX designer focused on user-centered design and accessibility.',
    skills: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
  },
];
