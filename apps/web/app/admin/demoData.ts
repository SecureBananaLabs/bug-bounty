import type { AuditLog, Control, Dispute, DisputeDetail, Listing, MetricState, User } from "./types";

export type DemoStore = {
  metrics: MetricState;
  users: User[];
  listings: Listing[];
  disputes: DisputeDetail[];
  controls: Record<string, Control>;
  auditLogs: AuditLog[];
};

const demoStore: DemoStore = {
  metrics: {
    totalUsers: 4,
    activeJobs: 4,
    openDisputes: 1,
    flaggedListings: 2,
    revenueCurrentPeriod: 5200,
    trustScoreDistribution: [
      { label: "0-49", count: 1 },
      { label: "50-79", count: 1 },
      { label: "80-100", count: 2 }
    ]
  },
  users: [
    {
      id: "usr_freelancer_1",
      email: "maya@example.com",
      fullName: "Maya Chen",
      role: "freelancer",
      status: "active",
      joinedAt: "2026-02-11T10:30:00.000Z",
      trustScore: 92,
      location: "Austin, TX"
    },
    {
      id: "usr_client_1",
      email: "olivia@example.com",
      fullName: "Olivia Grant",
      role: "client",
      status: "active",
      joinedAt: "2026-03-08T12:00:00.000Z",
      trustScore: 87,
      location: "Seattle, WA"
    },
    {
      id: "usr_client_2",
      email: "noah@example.com",
      fullName: "Noah Price",
      role: "client",
      status: "active",
      joinedAt: "2026-04-02T08:15:00.000Z",
      trustScore: 64,
      location: "Chicago, IL"
    },
    {
      id: "usr_freelancer_2",
      email: "leo@example.com",
      fullName: "Leo Martin",
      role: "freelancer",
      status: "suspended",
      joinedAt: "2026-01-22T15:45:00.000Z",
      trustScore: 46,
      location: "Toronto, CA"
    }
  ],
  listings: [
    {
      id: "flagged_job_1",
      title: "Payment integration review",
      clientId: "usr_client_1",
      clientName: "Olivia Grant",
      budget: 900,
      moderationStatus: "flagged",
      flagReason: "Escrow bypass language detected",
      reports: 3,
      automatedFlags: ["payment-policy"],
      createdAt: "2026-05-14T11:35:00.000Z",
      flaggedAt: "2026-05-16T09:00:00.000Z"
    },
    {
      id: "flagged_job_2",
      title: "Landing page copy refresh",
      clientId: "usr_client_2",
      clientName: "Noah Price",
      budget: 450,
      moderationStatus: "flagged",
      flagReason: "Multiple duplicate reports",
      reports: 2,
      automatedFlags: ["duplicate-content"],
      createdAt: "2026-05-12T13:05:00.000Z",
      flaggedAt: "2026-05-15T18:25:00.000Z"
    }
  ],
  disputes: [
    {
      id: "dispute_1",
      jobId: "flagged_job_1",
      jobTitle: "Payment integration review",
      clientId: "usr_client_1",
      clientName: "Olivia Grant",
      freelancerId: "usr_freelancer_1",
      freelancerName: "Maya Chen",
      status: "open",
      openedAt: "2026-05-16T17:20:00.000Z",
      summary: "Client requested refund after the milestone delivery missed the agreed acceptance criteria.",
      transaction: { id: "txn_900", amount: 900, currency: "USD", escrowStatus: "held" },
      ruling: null,
      refundTriggered: false,
      thread: [
        {
          authorId: "usr_client_1",
          body: "The delivered integration does not connect to the sandbox account.",
          createdAt: "2026-05-16T17:22:00.000Z"
        },
        {
          authorId: "usr_freelancer_1",
          body: "The sandbox credentials failed during final verification; I uploaded logs.",
          createdAt: "2026-05-16T18:02:00.000Z"
        }
      ],
      evidence: [
        { id: "ev_1", label: "Milestone brief", type: "document" },
        { id: "ev_2", label: "Sandbox error log", type: "log" }
      ]
    },
    {
      id: "dispute_2",
      jobId: "job_active_2",
      jobTitle: "Design mobile onboarding flows",
      clientId: "usr_client_2",
      clientName: "Noah Price",
      freelancerId: "usr_freelancer_2",
      freelancerName: "Leo Martin",
      status: "under_review",
      openedAt: "2026-05-10T08:40:00.000Z",
      summary: "Freelancer disputes late payment release after client approved draft work.",
      transaction: { id: "txn_451", amount: 450, currency: "USD", escrowStatus: "pending_release" },
      ruling: null,
      refundTriggered: false,
      thread: [],
      evidence: []
    }
  ],
  controls: {
    registrations: {
      key: "registrations",
      label: "New user registrations",
      description: "Allow new clients and freelancers to create accounts.",
      enabled: true,
      updatedAt: "2026-05-01T00:00:00.000Z",
      updatedBy: "system"
    },
    jobPostings: {
      key: "jobPostings",
      label: "New job postings",
      description: "Allow clients to publish new job listings.",
      enabled: true,
      updatedAt: "2026-05-01T00:00:00.000Z",
      updatedBy: "system"
    }
  },
  auditLogs: [
    {
      id: "audit_seed_1",
      adminId: "admin_100",
      actionType: "session",
      targetType: "admin_console",
      targetId: "admin",
      summary: "Admin console opened",
      createdAt: "2026-05-18T04:00:00.000Z"
    }
  ]
};

export function createDemoStore(): DemoStore {
  return JSON.parse(JSON.stringify(demoStore));
}

export function disputeSummary(dispute: DisputeDetail): Dispute {
  const { thread, evidence, ...summary } = dispute;
  return summary;
}
