import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminPanelClient, { type AdminPanelData } from "./AdminPanelClient";

const initialAdminData: AdminPanelData = {
  users: [
    {
      id: "usr_client_1",
      name: "Avery Client",
      email: "avery@example.com",
      role: "client",
      status: "active",
      joinedAt: "2026-01-12T09:20:00.000Z",
      trustScore: 86,
      activeJobs: ["job_101"],
      disputeHistory: ["dsp_1001"]
    },
    {
      id: "usr_freelancer_1",
      name: "Maya Freelancer",
      email: "maya@example.com",
      role: "freelancer",
      status: "active",
      joinedAt: "2026-02-03T14:10:00.000Z",
      trustScore: 94,
      activeJobs: ["job_102"],
      disputeHistory: []
    },
    {
      id: "usr_client_2",
      name: "Jordan Client",
      email: "jordan@example.com",
      role: "client",
      status: "suspended",
      joinedAt: "2026-03-19T11:02:00.000Z",
      trustScore: 51,
      activeJobs: [],
      disputeHistory: ["dsp_1002"]
    },
    {
      id: "usr_freelancer_2",
      name: "Riley Freelancer",
      email: "riley@example.com",
      role: "freelancer",
      status: "active",
      joinedAt: "2026-04-21T08:42:00.000Z",
      trustScore: 73,
      activeJobs: ["job_103"],
      disputeHistory: ["dsp_1002"]
    }
  ],
  flaggedListings: [
    {
      id: "flag_2001",
      jobId: "job_103",
      title: "Design marketplace onboarding",
      reporter: "automated-rules",
      reason: "Suspicious external payment request",
      status: "pending",
      ownerId: "usr_client_2"
    },
    {
      id: "flag_2002",
      jobId: "job_101",
      title: "Build AI customer support widget",
      reporter: "usr_freelancer_1",
      reason: "Scope changed after proposal acceptance",
      status: "escalated",
      ownerId: "usr_client_1"
    }
  ],
  disputes: [
    {
      id: "dsp_1001",
      title: "Avery Client vs Maya Freelancer",
      amount: 4200,
      status: "open",
      thread: ["Milestone output was incomplete.", "Requested assets were missing until after delivery."]
    },
    {
      id: "dsp_1002",
      title: "Jordan Client vs Riley Freelancer",
      amount: 1900,
      status: "under_review",
      thread: ["Client requested off-platform settlement."]
    }
  ],
  controls: {
    registrationsEnabled: true,
    jobPostingsEnabled: true,
    updatedAt: "2026-05-20T12:00:00.000Z",
    updatedBy: "system"
  },
  auditEntries: [
    {
      id: "aud_1",
      adminId: "system",
      actionType: "platform.seeded",
      targetType: "platform",
      targetId: "controls",
      message: "Initial admin panel seed data created",
      createdAt: "2026-05-20T12:00:00.000Z"
    }
  ]
};

async function assertAdminAccess() {
  const store = await cookies();
  const role = store.get("freelanceflow_role")?.value;

  if (role !== "admin") {
    redirect("/admin/forbidden");
  }
}

export default async function AdminPanelPage() {
  await assertAdminAccess();

  return <AdminPanelClient initialData={initialAdminData} />;
}
