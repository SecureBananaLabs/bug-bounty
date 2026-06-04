export interface MockJob {
  id: string;
  title: string;
  budget: number;
  description: string;
  status: string;
  createdAt: string;
}

export const mockJobs: MockJob[] = [
  {
    id: 'job-101',
    title: 'Build a landing page',
    budget: 500,
    description: 'Need a responsive landing page for a SaaS product.',
    status: 'open',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'job-102',
    title: 'Fix API authentication bug',
    budget: 300,
    description: 'Users are unable to log in after password reset.',
    status: 'open',
    createdAt: '2024-01-16T14:30:00Z',
  },
  {
    id: 'job-103',
    title: 'Design mobile app UI',
    budget: 800,
    description: 'Create a modern UI for a fitness tracking app.',
    status: 'open',
    createdAt: '2024-01-17T09:15:00Z',
  },
];

export function getJobById(id: string): MockJob | undefined {
  return mockJobs.find((job) => job.id === id);
}
