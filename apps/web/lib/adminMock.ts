export const adminSnapshot = {
  session: {
    adminId: "admin_demo"
  },
  users: [
    {
      id: "usr_client_101",
      name: "Avery Stone",
      email: "avery@example.com",
      role: "client",
      status: "active",
      joinedAt: "2026-01-12",
      trustScore: 86,
      activeJobs: ["Marketplace redesign"],
      disputes: ["Landing page copy refresh"]
    },
    {
      id: "usr_freelancer_204",
      name: "Maya Patel",
      email: "maya@example.com",
      role: "freelancer",
      status: "active",
      joinedAt: "2026-02-03",
      trustScore: 94,
      activeJobs: ["API audit"],
      disputes: []
    },
    {
      id: "usr_client_188",
      name: "Noah Kim",
      email: "noah@example.com",
      role: "client",
      status: "suspended",
      joinedAt: "2026-03-21",
      trustScore: 41,
      activeJobs: [],
      disputes: ["Mobile checkout QA"]
    },
    {
      id: "usr_freelancer_319",
      name: "Lena Ortiz",
      email: "lena@example.com",
      role: "freelancer",
      status: "under_review",
      joinedAt: "2026-04-09",
      trustScore: 58,
      activeJobs: ["Checkout bug fix"],
      disputes: ["Mobile checkout QA"]
    }
  ],
  moderationJobs: [
    {
      id: "mod_job_901",
      title: "Crypto payout integration",
      postedByName: "Avery Stone",
      status: "pending",
      reason: "Payment terms mention off-platform settlement",
      reports: 3,
      flaggedAt: "2026-06-12"
    },
    {
      id: "mod_job_902",
      title: "Scrape competitor profiles",
      postedByName: "Noah Kim",
      status: "pending",
      reason: "Automated policy scanner detected prohibited scraping language",
      reports: 5,
      flaggedAt: "2026-06-13"
    }
  ],
  disputes: [
    {
      id: "dsp_escrow_copy",
      clientName: "Avery Stone",
      freelancerName: "Maya Patel",
      jobTitle: "Landing page copy refresh",
      status: "open",
      amountCents: 85000,
      openedAt: "2026-06-10",
      thread: [
        "Client says final copy missed compliance notes.",
        "Freelancer attached the approved brief and revision log."
      ],
      evidence: ["approved-brief.pdf", "revision-log.md"],
      transaction: "esc_2039 / refundable USD 850"
    },
    {
      id: "dsp_mobile_refund",
      clientName: "Noah Kim",
      freelancerName: "Lena Ortiz",
      jobTitle: "Mobile checkout QA",
      status: "under_review",
      amountCents: 42000,
      openedAt: "2026-06-11",
      thread: [
        "Client requested a refund after crash reports continued.",
        "Freelancer attached logs showing a third-party SDK fault."
      ],
      evidence: ["device-crash.log", "sdk-vendor-ticket.txt"],
      transaction: "esc_2044 / refundable USD 300"
    }
  ],
  controls: {
    registrationsEnabled: true,
    jobPostingsEnabled: true
  },
  auditLog: [
    {
      id: "aud_seed_001",
      adminId: "system",
      actionType: "system_snapshot",
      target: "platform/admin-panel",
      createdAt: "2026-06-12T00:00:00.000Z"
    }
  ]
};
