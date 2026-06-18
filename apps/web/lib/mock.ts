export interface MockJob {
  id: string;
  title: string;
  budget: number;
  description: string;
  status: string;
  createdAt: string;
  clientName: string;
}

ex const mockJobs: MockJob[] = [
  {
    id: 'job-101',
    title: 'Build a landing page with Next.js',
    budget: 500,
    description: 'We need a responsive landing page built with Next.js and Tailwind CSS.',
    status: 'open',
    createdAt: '2024-01-15T10:00:00Z',
    clientName: 'Alice Corp',
  },
  {
    id: 'job-102',
    title: 'Fix API rate limiting bug',
    budget: 300,
    description: 'Our API has a rate limiting issue that needs to be diagnosed and fixed.',
    status: 'open',
    createdAt: '2024-01-20T14:30:00Z',
    clientName: 'Bob Industries',
  },
  {
    id: 'job-103',
    title: 'Design database schema for e-commerce',
    budget: 800,
    description: 'Design a scalable PostgreSQL schema for an e-commerce platform.',
    status: 'open',
    createdAt: '2024-02-01T09:00:00Z',
    clientName: 'Charlie LLC',
  },
];

export function getMockJobById(id: string): MockJob | undefined {
  return mockJobs.find((job) => job.id === id);
}
