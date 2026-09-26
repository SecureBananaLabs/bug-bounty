function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function createInitialState() {
  return {
    users: [
      {
        id: "usr_admin",
        name: "Avery Admin",
        email: "admin@freelanceflow.test",
        role: "admin",
        status: "active",
        joinedAt: daysAgo(45),
        lastActiveAt: daysAgo(1),
        location: "Berlin"
      },
      {
        id: "usr_client_1",
        name: "Nora Client",
        email: "nora.client@example.com",
        role: "client",
        status: "active",
        joinedAt: daysAgo(12),
        lastActiveAt: daysAgo(1),
        location: "London"
      },
      {
        id: "usr_client_2",
        name: "Martin Sponsor",
        email: "martin.sponsor@example.com",
        role: "client",
        status: "suspended",
        joinedAt: daysAgo(120),
        lastActiveAt: daysAgo(25),
        location: "Madrid",
        statusReason: "Repeated policy violations"
      },
      {
        id: "usr_freelancer_1",
        name: "Lina Builder",
        email: "lina.builder@example.com",
        role: "freelancer",
        status: "active",
        joinedAt: daysAgo(28),
        lastActiveAt: daysAgo(2),
        location: "Warsaw"
      },
      {
        id: "usr_freelancer_2",
        name: "Devon Sharp",
        email: "devon.sharp@example.com",
        role: "freelancer",
        status: "banned",
        joinedAt: daysAgo(400),
        lastActiveAt: daysAgo(180),
        location: "Lisbon",
        statusReason: "Chargeback abuse"
      }
    ],
    jobs: [
      {
        id: "job_active_1",
        title: "Build onboarding dashboard",
        description: "Need a modern onboarding flow with analytics and role gates.",
        ownerId: "usr_client_1",
        status: "active",
        category: "web",
        budgetMin: 2500,
        budgetMax: 4500,
        skills: ["react", "node"],
        createdAt: daysAgo(14),
        updatedAt: daysAgo(14),
        flagReason: null,
        moderationHistory: []
      },
      {
        id: "job_flagged_1",
        title: "Guaranteed earnings with no effort",
        description: "Promotional listing that violates marketplace rules.",
        ownerId: "usr_client_2",
        status: "flagged",
        category: "marketing",
        budgetMin: 500,
        budgetMax: 1000,
        skills: ["copywriting"],
        createdAt: daysAgo(5),
        updatedAt: daysAgo(5),
        flagReason: "Suspicious promotional language",
        moderationHistory: [
          {
            action: "flagged",
            reason: "Suspicious promotional language",
            at: daysAgo(5),
            by: "system"
          }
        ]
      },
      {
        id: "job_flagged_2",
        title: "Urgent data export script",
        description: "Potentially risky request awaiting moderation review.",
        ownerId: "usr_client_1",
        status: "escalated",
        category: "automation",
        budgetMin: 800,
        budgetMax: 1400,
        skills: ["python"],
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1),
        flagReason: "Requires policy review",
        moderationHistory: [
          {
            action: "flagged",
            reason: "Requires policy review",
            at: daysAgo(3),
            by: "system"
          },
          {
            action: "escalated",
            reason: "Potential compliance issue",
            at: daysAgo(1),
            by: "usr_admin"
          }
        ]
      }
    ],
    disputes: [
      {
        id: "dsp_open_1",
        status: "open",
        title: "Milestone not delivered",
        buyerId: "usr_client_1",
        sellerId: "usr_freelancer_1",
        openedAt: daysAgo(6),
        updatedAt: daysAgo(6),
        thread: [
          {
            authorId: "usr_client_1",
            role: "buyer",
            message: "The first milestone is overdue and communication has stalled.",
            at: daysAgo(6)
          },
          {
            authorId: "usr_freelancer_1",
            role: "seller",
            message: "I delivered draft assets but the review never came back.",
            at: daysAgo(5)
          }
        ],
        evidence: [
          {
            type: "file",
            name: "deliverables.zip",
            url: "https://files.example.com/deliverables.zip"
          }
        ],
        transactions: [
          {
            id: "txn_1",
            amount: 1200,
            currency: "EUR",
            type: "escrow",
            status: "held",
            createdAt: daysAgo(6)
          }
        ],
        resolution: null
      },
      {
        id: "dsp_review_1",
        status: "under_review",
        title: "Scope change fee dispute",
        buyerId: "usr_client_2",
        sellerId: "usr_freelancer_1",
        openedAt: daysAgo(20),
        updatedAt: daysAgo(4),
        thread: [
          {
            authorId: "usr_client_2",
            role: "buyer",
            message: "The seller added charges outside the original scope.",
            at: daysAgo(20)
          },
          {
            authorId: "usr_freelancer_1",
            role: "seller",
            message: "The additional work was explicitly requested in writing.",
            at: daysAgo(18)
          }
        ],
        evidence: [
          {
            type: "text",
            name: "scope-change-notes",
            content: "Client approved the additional work in email."
          },
          {
            type: "file",
            name: "invoice.pdf",
            url: "https://files.example.com/invoice.pdf"
          }
        ],
        transactions: [
          {
            id: "txn_2",
            amount: 850,
            currency: "EUR",
            type: "payment",
            status: "captured",
            createdAt: daysAgo(19)
          }
        ],
        resolution: null
      },
      {
        id: "dsp_resolved_1",
        status: "resolved",
        title: "Refund after missed deadline",
        buyerId: "usr_client_1",
        sellerId: "usr_freelancer_2",
        openedAt: daysAgo(90),
        updatedAt: daysAgo(82),
        thread: [
          {
            authorId: "usr_client_1",
            role: "buyer",
            message: "The deadline slipped by three weeks.",
            at: daysAgo(90)
          },
          {
            authorId: "usr_freelancer_2",
            role: "seller",
            message: "I was blocked by access issues from the client side.",
            at: daysAgo(89)
          }
        ],
        evidence: [
          {
            type: "file",
            name: "project-log.txt",
            url: "https://files.example.com/project-log.txt"
          }
        ],
        transactions: [
          {
            id: "txn_3",
            amount: 1500,
            currency: "EUR",
            type: "platform_fee",
            status: "settled",
            createdAt: daysAgo(83)
          }
        ],
        resolution: {
          ruledInFavorOf: "buyer",
          reason: "Deadline breach without documented extension",
          decidedBy: "usr_admin",
          decidedAt: daysAgo(82)
        }
      }
    ],
    notifications: [
      {
        id: "ntf_1",
        userId: "usr_client_2",
        type: "account_status",
        message: "Your account was suspended for repeated policy violations.",
        createdAt: daysAgo(30)
      }
    ]
  };
}

let state = createInitialState();

export function resetAdminData() {
  state = createInitialState();
  return state;
}

export function getAdminData() {
  return state;
}

export function nextAdminId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}
