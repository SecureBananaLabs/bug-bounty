export const jobs = [
  { id: "job-101", title: "Build an AI customer support widget", budget: "$1,500" },
  { id: "job-102", title: "Migrate legacy API to Node.js", budget: "$2,800" },
  { id: "job-103", title: "Design SaaS onboarding flows", budget: "$900" }
];

export const freelancers = [
  { username: "maya-dev", skills: ["Next.js", "TypeScript"], rate: "$65/hr" },
  { username: "jordan-ux", skills: ["Figma", "UX Research"], rate: "$52/hr" }
];

export const freelancerProfiles = [
  {
    username: "maya-dev",
    name: "Maya Chen",
    role: "Full-stack product engineer",
    location: "Remote, GMT+5:30",
    rate: "$65/hr",
    availability: "20 hrs/week starting Monday",
    responseTime: "Usually replies in 2 hours",
    summary:
      "Builds production-ready SaaS features across Next.js, TypeScript, API integration, and analytics workflows.",
    skills: ["Next.js", "TypeScript", "Node.js", "Prisma", "Analytics"],
    metrics: [
      { label: "Completed projects", value: "24" },
      { label: "Client rating", value: "4.9/5" },
      { label: "Repeat clients", value: "68%" }
    ],
    portfolio: [
      {
        title: "AI support widget",
        detail: "Delivered a self-serve support widget with admin controls, event tracking, and handoff rules."
      },
      {
        title: "Marketplace billing flow",
        detail: "Integrated milestone review states, payout status, and invoice export surfaces for a freelance platform."
      }
    ],
    reviews: [
      {
        author: "Northstar Labs",
        quote: "Maya translated a fuzzy product brief into shippable milestones and kept the API work easy to review."
      },
      {
        author: "Acme Retail",
        quote: "Strong communication, clean TypeScript, and a useful demo for every delivery checkpoint."
      }
    ],
    activeProposals: [
      { title: "Legacy API migration", status: "Milestone 2 in progress" },
      { title: "SaaS onboarding flows", status: "Discovery scheduled" }
    ]
  },
  {
    username: "jordan-ux",
    name: "Jordan Patel",
    role: "UX researcher and product designer",
    location: "Remote, GMT+1",
    rate: "$52/hr",
    availability: "12 hrs/week, two-week lead time",
    responseTime: "Usually replies same day",
    summary:
      "Designs B2B product workflows with research plans, wireframes, usability scripts, and handoff-ready UI states.",
    skills: ["Figma", "UX Research", "Design Systems", "Prototyping", "Usability Testing"],
    metrics: [
      { label: "Research studies", value: "31" },
      { label: "Client rating", value: "4.8/5" },
      { label: "Prototype tests", value: "86" }
    ],
    portfolio: [
      {
        title: "Ops dashboard redesign",
        detail: "Reduced review time by grouping alerts, ownership, and next actions into one workflow surface."
      },
      {
        title: "Hiring marketplace IA",
        detail: "Mapped client search, shortlist, and freelancer-profile flows into a reusable design system."
      }
    ],
    reviews: [
      {
        author: "PilotWorks",
        quote: "Jordan found the confusing parts of our workflow quickly and gave engineering clean, testable screens."
      },
      {
        author: "LedgerNest",
        quote: "The prototype helped us align sales, design, and engineering before we wrote production code."
      }
    ],
    activeProposals: [
      { title: "Onboarding flow audit", status: "Awaiting client brief" },
      { title: "Design system cleanup", status: "Proposal viewed" }
    ]
  }
];
