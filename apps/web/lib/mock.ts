export const jobs = [
  {
    id: "job-101",
    title: "Build an AI customer support widget",
    budget: "$1,500",
    status: "Interviewing",
    proposals: 12,
    nextStep: "Shortlist 3 candidates",
    due: "Review today"
  },
  {
    id: "job-102",
    title: "Migrate legacy API to Node.js",
    budget: "$2,800",
    status: "In progress",
    proposals: 8,
    nextStep: "Approve milestone scope",
    due: "Milestone due Friday"
  },
  {
    id: "job-103",
    title: "Design SaaS onboarding flows",
    budget: "$900",
    status: "Draft",
    proposals: 0,
    nextStep: "Publish job brief",
    due: "Ready to post"
  }
];

export const freelancers = [
  {
    username: "maya-dev",
    skills: ["Next.js", "TypeScript"],
    rate: "$65/hr",
    status: "Available this week",
    match: "92% match"
  },
  {
    username: "jordan-ux",
    skills: ["Figma", "UX Research"],
    rate: "$52/hr",
    status: "2 active projects",
    match: "Strong design fit"
  }
];

export const clientDashboard = {
  metrics: [
    { label: "Active jobs", value: "2", detail: "1 draft waiting to publish" },
    { label: "Open proposals", value: "20", detail: "5 new since yesterday" },
    { label: "Shortlisted", value: "4", detail: "Interviews ready to book" },
    { label: "Escrow pending", value: "$1,400", detail: "2 milestones need review" }
  ],
  activeJobs: jobs,
  shortlistedFreelancers: freelancers,
  paymentMilestones: [
    { label: "API migration kickoff", amount: "$700", status: "Fund escrow", href: "/billing" },
    { label: "Widget prototype review", amount: "$450", status: "Approve or request changes", href: "/billing" },
    { label: "Onboarding flow deposit", amount: "$250", status: "Due after job publish", href: "/jobs/post" }
  ]
};

export const freelancerDashboard = {
  metrics: [
    { label: "Active proposals", value: "6", detail: "2 viewed by clients" },
    { label: "In progress", value: "1", detail: "API migration milestone" },
    { label: "Unread client updates", value: "3", detail: "Respond within 24h" },
    { label: "This month earnings", value: "$3,240", detail: "$700 pending release" }
  ],
  proposalQueue: [
    { jobId: "job-101", title: "AI support widget", status: "Interview requested", nextStep: "Send availability", href: "/jobs/job-101" },
    { jobId: "job-103", title: "SaaS onboarding flows", status: "Draft response", nextStep: "Attach portfolio case study", href: "/jobs/job-103" },
    { jobId: "job-102", title: "Legacy API migration", status: "Won", nextStep: "Complete milestone checklist", href: "/jobs/job-102" }
  ],
  activeWork: [
    { title: "Legacy API migration", client: "Northstar Labs", due: "Milestone due Friday", status: "In progress", href: "/jobs/job-102" },
    { title: "Support widget follow-up", client: "Acme Retail", due: "Interview today", status: "Client waiting", href: "/messaging" }
  ],
  earnings: [
    { label: "Available payout", amount: "$2,540", status: "Ready" },
    { label: "Pending milestone", amount: "$700", status: "Client review" },
    { label: "Projected pipeline", amount: "$1,950", status: "If 2 proposals win" }
  ]
};
