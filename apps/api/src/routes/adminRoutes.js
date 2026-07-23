import express from 'express';
import { ok, fail } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../../../packages/db/src/index.js';

const router = express.Router();

/**
 * Admin guard
 */
function isAdmin(req, res, next) {
  if (!req.user) return fail(res, 'Unauthorized', 401);
  if (req.user.role !== 'ADMIN') return fail(res, 'Forbidden: Admin only', 403);
  next();
}

/**
 * Helpers
 */
function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

function getPagination(query) {
  const page = Math.max(1, toInt(query.page, 1));
  const pageSize = Math.min(100, Math.max(1, toInt(query.pageSize, 20)));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

function parseDateRange(dateRange) {
  if (!dateRange) return null;
  const [start, end] = String(dateRange).split(',');
  const where = {};
  if (start) {
    const s = new Date(start);
    if (!Number.isNaN(s.getTime())) where.gte = s;
  }
  if (end) {
    const e = new Date(end);
    if (!Number.isNaN(e.getTime())) where.lte = e;
  }
  return Object.keys(where).length ? where : null;
}

async function writeAuditLog({ actorId, action, targetType, targetId, metadata = {} }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId: String(targetId),
        metadata,
      },
    });
  } catch (e) {
    // Avoid blocking primary flow if audit log fails
    console.error('Audit log write failed:', e);
  }
}

router.use(authMiddleware, isAdmin);

/**
 * 1) GET /users - 用户列表
 * query: page, pageSize, role, status, search, dateRange
 */
router.get('/users', async (req, res) => {
  try {
    const { page, pageSize, skip } = getPagination(req.query);
    const { role, status, search } = req.query;
    const createdAtRange = parseDateRange(req.query.dateRange);

    const where = {
      ...(role ? { role: String(role) } : {}),
      ...(status ? { status: String(status) } : {}),
      ...(createdAtRange ? { createdAt: createdAtRange } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: String(search), mode: 'insensitive' } },
              { email: { contains: String(search), mode: 'insensitive' } },
              { username: { contains: String(search), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to fetch users', 500);
  }
});

/**
 * 2) GET /users/:id - 用户详情(含关联数据)
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        jobsPosted: true,
        disputesRaised: true,
        disputesAgainst: true,
      },
    });

    if (!user) return fail(res, 'User not found', 404);
    return ok(res, user);
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to fetch user detail', 500);
  }
});

/**
 * 3) PATCH /users/:id/ban
 */
router.patch('/users/:id/ban', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'BANNED' },
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'USER_BAN',
      targetType: 'USER',
      targetId: id,
      metadata: { previousStatus: user.status, newStatus: 'BANNED' },
    });

    return ok(res, user);
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to ban user', 500);
  }
});

/**
 * 4) PATCH /users/:id/unban
 */
router.patch('/users/:id/unban', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'USER_UNBAN',
      targetType: 'USER',
      targetId: id,
      metadata: { newStatus: 'ACTIVE' },
    });

    return ok(res, user);
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to unban user', 500);
  }
});

/**
 * 5) DELETE /users/:id - 永久删除
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.user.delete({ where: { id } });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'USER_DELETE',
      targetType: 'USER',
      targetId: id,
      metadata: { email: deleted.email },
    });

    return ok(res, { deleted: true, userId: id });
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to delete user', 500);
  }
});

/**
 * 6) GET /jobs/flagged - 标记任务队列
 */
router.get('/jobs/flagged', async (req, res) => {
  try {
    const { page, pageSize, skip } = getPagination(req.query);

    const where = { moderationStatus: 'FLAGGED' };

    const [total, items] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to fetch flagged jobs', 500);
  }
});

/**
 * 7) PATCH /jobs/:id/approve
 */
router.patch('/jobs/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.update({
      where: { id },
      data: { moderationStatus: 'APPROVED' },
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'JOB_APPROVE',
      targetType: 'JOB',
      targetId: id,
      metadata: {},
    });

    return ok(res, job);
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to approve job', 500);
  }
});

/**
 * 8) PATCH /jobs/:id/reject - 需要 reason
 */
router.patch('/jobs/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !String(reason).trim()) {
      return fail(res, 'Reject reason is required', 400);
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        moderationStatus: 'REJECTED',
        moderationReason: String(reason),
      },
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'JOB_REJECT',
      targetType: 'JOB',
      targetId: id,
      metadata: { reason: String(reason) },
    });

    return ok(res, job);
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to reject job', 500);
  }
});

/**
 * 9) GET /disputes - 纠纷列表
 * query: status, page, pageSize
 */
router.get('/disputes', async (req, res) => {
  try {
    const { page, pageSize, skip } = getPagination(req.query);
    const { status } = req.query;

    const where = {
      ...(status ? { status: String(status) } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.findMany({
        where,
        include: {
          raisedBy: true,
          against: true,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to fetch disputes', 500);
  }
});

/**
 * 10) GET /disputes/:id - 纠纷详情
 */
router.get('/disputes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        raisedBy: true,
        against: true,
        job: true,
      },
    });

    if (!dispute) return fail(res, 'Dispute not found', 404);
    return ok(res, dispute);
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to fetch dispute detail', 500);
  }
});

/**
 * 11) POST /disputes/:id/rule - 裁决
 * body: ruling, reason
 */
router.post('/disputes/:id/rule', async (req, res) => {
  try {
    const { id } = req.params;
    const { ruling, reason } = req.body;

    if (!ruling || !String(ruling).trim()) return fail(res, 'ruling is required', 400);
    if (!reason || !String(reason).trim()) return fail(res, 'reason is required', 400);

    const dispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        ruling: String(ruling),
        resolutionReason: String(reason),
        resolvedById: req.user.id,
        resolvedAt: new Date(),
      },
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'DISPUTE_RULE',
      targetType: 'DISPUTE',
      targetId: id,
      metadata: { ruling: String(ruling), reason: String(reason) },
    });

    return ok(res, dispute);
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to rule dispute', 500);
  }
});

/**
 * 12) GET /metrics - 统计数据
 */
router.get('/metrics', async (req, res) => {
  try {
    const [
      totalUsers,
      activeJobs,
      totalDisputes,
      flaggedJobs,
      revenueAgg,
      trustScoreBuckets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count({ where: { status: 'ACTIVE' } }),
      prisma.dispute.count(),
      prisma.job.count({ where: { moderationStatus: 'FLAGGED' } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.user.groupBy({
        by: ['trustScore'],
        _count: { trustScore: true },
      }),
    ]);

    return ok(res, {
      totalUsers,
      activeJobs,
      totalDisputes,
      flaggedJobs,
      revenue: revenueAgg?._sum?.amount || 0,
      trustScoreDistribution: trustScoreBuckets.map((x) => ({
        trustScore: x.trustScore,
        count: x._count.trustScore,
      })),
    });
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to fetch metrics', 500);
  }
});

/**
 * 13) GET /settings - 第一条平台设置
 */
router.get('/settings', async (req, res) => {
  try {
    const setting = await prisma.platformSetting.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    return ok(res, setting || null);
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to fetch settings', 500);
  }
});

/**
 * 14) PATCH /settings - 更新设置
 * body: registrationOpen, jobPostingOpen
 */
router.patch('/settings', async (req, res) => {
  try {
    const { registrationOpen, jobPostingOpen } = req.body;

    let setting = await prisma.platformSetting.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!setting) {
      setting = await prisma.platformSetting.create({
        data: {
          registrationOpen: typeof registrationOpen === 'boolean' ? registrationOpen : true,
          jobPostingOpen: typeof jobPostingOpen === 'boolean' ? jobPostingOpen : true,
        },
      });
    } else {
      setting = await prisma.platformSetting.update({
        where: { id: setting.id },
        data: {
          ...(typeof registrationOpen === 'boolean' ? { registrationOpen } : {}),
          ...(typeof jobPostingOpen === 'boolean' ? { jobPostingOpen } : {}),
        },
      });
    }

    await writeAuditLog({
      actorId: req.user.id,
      action: 'SETTINGS_UPDATE',
      targetType: 'PLATFORM_SETTING',
      targetId: setting.id,
      metadata: { registrationOpen, jobPostingOpen },
    });

    return ok(res, setting);
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to update settings', 500);
  }
});

/**
 * 15) GET /audit-log - 审计日志
 * query: page, pageSize, actorId, action, dateRange
 */
router.get('/audit-log', async (req, res) => {
  try {
    const { page, pageSize, skip } = getPagination(req.query);
    const { actorId, action } = req.query;
    const createdAtRange = parseDateRange(req.query.dateRange);

    const where = {
      ...(actorId ? { actorId: String(actorId) } : {}),
      ...(action ? { action: String(action) } : {}),
      ...(createdAtRange ? { createdAt: createdAtRange } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (e) {
    console.error(e);
    return fail(res, 'Failed to fetch audit logs', 500);
  }
});

export default router;