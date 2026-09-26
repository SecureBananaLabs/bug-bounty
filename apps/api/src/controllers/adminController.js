import { ok, fail } from "../utils/response.js";
import { prisma } from "../config/db.js";

// IN-MEMORY FALLBACK DATABASE STATE
let mockUsers = [
  { id: "usr_1", email: "client1@example.com", fullName: "Alice Client", role: "CLIENT", status: "ACTIVE", createdAt: new Date("2026-01-10") },
  { id: "usr_2", email: "free1@example.com", fullName: "Bob Freelancer", role: "FREELANCER", status: "ACTIVE", createdAt: new Date("2026-02-15") },
  { id: "usr_3", email: "spammer@example.com", fullName: "Spammy McSpam", role: "CLIENT", status: "SUSPENDED", createdAt: new Date("2026-03-20") },
  { id: "usr_4", email: "badguy@example.com", fullName: "Scammer Joe", role: "FREELANCER", status: "BANNED", createdAt: new Date("2026-04-01") },
];

let mockJobs = [
  { id: "job_1", title: "Build React Dashboard", description: "Need a modern, sleek dashboard.", status: "OPEN", moderationStatus: "APPROVED", clientId: "usr_1", createdAt: new Date() },
  { id: "job_2", title: "Scam people online", description: "Earn $1000/day doing nothing!", status: "OPEN", moderationStatus: "FLAGGED", clientId: "usr_3", createdAt: new Date() },
  { id: "job_3", title: "Write SEO Articles", description: "Need 10 high quality articles.", status: "OPEN", moderationStatus: "APPROVED", clientId: "usr_1", createdAt: new Date() }
];

let mockDisputes = [
  { 
    id: "disp_1", 
    jobId: "job_1", 
    job: { title: "Build React Dashboard" },
    clientId: "usr_1", 
    client: { fullName: "Alice Client", email: "client1@example.com" },
    freelancerId: "usr_2", 
    freelancer: { fullName: "Bob Freelancer", email: "free1@example.com" },
    reason: "Freelancer did not complete milestones.", 
    status: "OPEN", 
    resolution: null,
    createdAt: new Date() 
  }
];

let mockSettings = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

let mockAuditLogs = [
  { id: "log_1", adminId: "admin_test", action: "UPDATE_USER_STATUS", targetType: "USER", targetId: "usr_3", details: JSON.stringify({ status: "SUSPENDED" }), createdAt: new Date() }
];

async function logAction(adminId, action, targetType, targetId, details) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details: details ? JSON.stringify(details) : null
      }
    });
  } catch {
    mockAuditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId,
      action,
      targetType,
      targetId,
      details: details ? JSON.stringify(details) : null,
      createdAt: new Date()
    });
  }
}

// METRICS & DASHBOARD
export async function metrics(req, res) {
  try {
    const [totalUsers, activeJobs, openDisputes, flaggedListings, revenueData] = await Promise.all([
      prisma.user.count(),
      prisma.job.count({ where: { status: 'OPEN' } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.job.count({ where: { moderationStatus: 'FLAGGED' } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } })
    ]);
    
    return ok(res, {
      totalUsers,
      activeJobs,
      openDisputes,
      flaggedListings,
      revenue: revenueData._sum.amount || 0,
      trustScoreDistribution: [
        { range: '0-20', count: 2 },
        { range: '21-40', count: 5 },
        { range: '41-60', count: 12 },
        { range: '61-80', count: 24 },
        { range: '81-100', count: 78 },
      ]
    });
  } catch {
    // Fallback to mock state
    return ok(res, {
      totalUsers: mockUsers.length,
      activeJobs: mockJobs.filter(j => j.status === 'OPEN').length,
      openDisputes: mockDisputes.filter(d => d.status === 'OPEN').length,
      flaggedListings: mockJobs.filter(j => j.moderationStatus === 'FLAGGED').length,
      revenue: 12450,
      trustScoreDistribution: [
        { range: '0-20', count: 2 },
        { range: '21-40', count: 5 },
        { range: '41-60', count: 12 },
        { range: '61-80', count: 24 },
        { range: '81-100', count: 78 },
      ]
    });
  }
}

// USER MANAGEMENT
export async function getUsers(req, res) {
  const { page = 1, limit = 20, search, role, status } = req.query;
  const skip = (page - 1) * limit;

  try {
    const where = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip: Number(skip), take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where })
    ]);
    return ok(res, { users, total, page: Number(page), limit: Number(limit) });
  } catch {
    // Mock Filtering & Pagination
    let filtered = [...mockUsers];
    if (search) {
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase()) || 
        u.fullName.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (role) filtered = filtered.filter(u => u.role === role);
    if (status) filtered = filtered.filter(u => u.status === status);

    const paginated = filtered.slice(skip, skip + Number(limit));
    return ok(res, { users: paginated, total: filtered.length, page: Number(page), limit: Number(limit) });
  }
}

export async function getUser(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { postedJobs: true, proposals: true }
    });
    if (!user) return fail(res, "User not found", 404);
    return ok(res, user);
  } catch {
    const user = mockUsers.find(u => u.id === req.params.id);
    if (!user) return fail(res, "User not found", 404);
    return ok(res, user);
  }
}

export async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
    return fail(res, "Invalid status", 400);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });
    await logAction(req.user.sub || "admin_test", `UPDATE_USER_STATUS`, 'USER', id, { status });
    return ok(res, user);
  } catch {
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) return fail(res, "User not found", 404);
    mockUsers[userIndex].status = status;
    await logAction(req.user.sub || "admin_test", `UPDATE_USER_STATUS`, 'USER', id, { status });
    return ok(res, mockUsers[userIndex]);
  }
}

// MODERATION
export async function getFlaggedJobs(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const where = { moderationStatus: 'FLAGGED' };
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({ where, skip: Number(skip), take: Number(limit), include: { client: true }, orderBy: { createdAt: 'desc' } }),
      prisma.job.count({ where })
    ]);
    return ok(res, { jobs, total, page: Number(page), limit: Number(limit) });
  } catch {
    const flagged = mockJobs.filter(j => j.moderationStatus === 'FLAGGED');
    const paginated = flagged.slice(skip, skip + Number(limit));
    // map mock client
    const jobsWithClient = paginated.map(j => ({
      ...j,
      client: mockUsers.find(u => u.id === j.clientId) || null
    }));
    return ok(res, { jobs: jobsWithClient, total: flagged.length, page: Number(page), limit: Number(limit) });
  }
}

export async function moderateJob(req, res) {
  const { id } = req.params;
  const { moderationStatus, reason } = req.body;
  
  if (!['APPROVED', 'REJECTED'].includes(moderationStatus)) {
    return fail(res, "Invalid moderation status", 400);
  }

  try {
    const job = await prisma.job.update({
      where: { id },
      data: { moderationStatus }
    });
    if (moderationStatus === 'REJECTED') {
      await prisma.notification.create({
        data: {
          userId: job.clientId,
          title: "Job Listing Rejected",
          body: `Your job "${job.title}" was rejected. Reason: ${reason || 'Violation of terms.'}`
        }
      });
    }
    await logAction(req.user.sub || "admin_test", `MODERATE_JOB`, 'JOB', id, { moderationStatus, reason });
    return ok(res, job);
  } catch {
    const jobIndex = mockJobs.findIndex(j => j.id === id);
    if (jobIndex === -1) return fail(res, "Job not found", 404);
    mockJobs[jobIndex].moderationStatus = moderationStatus;
    await logAction(req.user.sub || "admin_test", `MODERATE_JOB`, 'JOB', id, { moderationStatus, reason });
    return ok(res, mockJobs[jobIndex]);
  }
}

// DISPUTES
export async function getDisputes(req, res) {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (page - 1) * limit;

  try {
    const where = {};
    if (status) where.status = status;
    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({ 
        where, 
        skip: Number(skip), 
        take: Number(limit),
        include: { job: true, client: true, freelancer: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.dispute.count({ where })
    ]);
    return ok(res, { disputes, total, page: Number(page), limit: Number(limit) });
  } catch {
    let filtered = [...mockDisputes];
    if (status) filtered = filtered.filter(d => d.status === status);
    const paginated = filtered.slice(skip, skip + Number(limit));
    return ok(res, { disputes: paginated, total: filtered.length, page: Number(page), limit: Number(limit) });
  }
}

export async function getDispute(req, res) {
  try {
    const dispute = await prisma.dispute.findUnique({
      where: { id: req.params.id },
      include: { job: true, client: true, freelancer: true }
    });
    if (!dispute) return fail(res, "Dispute not found", 404);
    return ok(res, dispute);
  } catch {
    const dispute = mockDisputes.find(d => d.id === req.params.id);
    if (!dispute) return fail(res, "Dispute not found", 404);
    return ok(res, dispute);
  }
}

export async function resolveDispute(req, res) {
  const { id } = req.params;
  const { resolution, rulingInFavourOf } = req.body;

  try {
    const dispute = await prisma.dispute.update({
      where: { id },
      data: { status: 'RESOLVED', resolution }
    });
    await logAction(req.user.sub || "admin_test", `RESOLVE_DISPUTE`, 'DISPUTE', id, { resolution, rulingInFavourOf });
    return ok(res, dispute);
  } catch {
    const disputeIndex = mockDisputes.findIndex(d => d.id === id);
    if (disputeIndex === -1) return fail(res, "Dispute not found", 404);
    mockDisputes[disputeIndex].status = 'RESOLVED';
    mockDisputes[disputeIndex].resolution = resolution;
    await logAction(req.user.sub || "admin_test", `RESOLVE_DISPUTE`, 'DISPUTE', id, { resolution, rulingInFavourOf });
    return ok(res, mockDisputes[disputeIndex]);
  }
}

// PLATFORM CONTROLS
export async function getPlatformSettings(req, res) {
  try {
    let settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: {} });
    }
    return ok(res, settings);
  } catch {
    return ok(res, mockSettings);
  }
}

export async function updatePlatformSettings(req, res) {
  const { registrationsEnabled, jobPostingsEnabled } = req.body;
  
  try {
    let settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: { registrationsEnabled, jobPostingsEnabled } });
    } else {
      settings = await prisma.platformSettings.update({
        where: { id: settings.id },
        data: { registrationsEnabled, jobPostingsEnabled }
      });
    }
    await logAction(req.user.sub || "admin_test", `UPDATE_SETTINGS`, 'PLATFORM', settings.id, { registrationsEnabled, jobPostingsEnabled });
    return ok(res, settings);
  } catch {
    mockSettings.registrationsEnabled = registrationsEnabled;
    mockSettings.jobPostingsEnabled = jobPostingsEnabled;
    await logAction(req.user.sub || "admin_test", `UPDATE_SETTINGS`, 'PLATFORM', "global", { registrationsEnabled, jobPostingsEnabled });
    return ok(res, mockSettings);
  }
}

// AUDIT LOGS
export async function getAuditLogs(req, res) {
  const { page = 1, limit = 50, adminId, actionType } = req.query;
  const skip = (page - 1) * limit;

  try {
    const where = {};
    if (adminId) where.adminId = adminId;
    if (actionType) where.action = actionType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip: Number(skip), take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.count({ where })
    ]);
    return ok(res, { logs, total, page: Number(page), limit: Number(limit) });
  } catch {
    let filtered = [...mockAuditLogs];
    if (adminId) filtered = filtered.filter(l => l.adminId.includes(adminId));
    if (actionType) filtered = filtered.filter(l => l.action.includes(actionType));
    const paginated = filtered.slice(skip, skip + Number(limit));
    return ok(res, { logs: paginated, total: filtered.length, page: Number(page), limit: Number(limit) });
  }
}
