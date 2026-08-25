const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listJobs({ status, categoryId, minBudget } = {}) {
  const where = {};
  
  if (status) {
    where.status = status;
  }
  
  if (categoryId) {
    where.categoryId = categoryId;
  }
  
  if (minBudget !== undefined && minBudget !== null) {
    where.budget = {
      gte: Number(minBudget),
    };
  }

  return prisma.job.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      client: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });
}

async function getJobById(id) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      category: true,
      client: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });
}

async function createJob(data) {
  return prisma.job.create({ data });
}

async function updateJob(id, data) {
  return prisma.job.update({ where: { id }, data });
}

async function deleteJob(id) {
  return prisma.job.delete({ where: { id } });
}

module.exports = {
  listJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
};