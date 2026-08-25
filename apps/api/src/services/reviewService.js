const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createReview(data) {
  return prisma.review.create({ data });
}

async function getReviewsByJob(jobId) {
  return prisma.review.findMany({
    where: { jobId },
    include: { reviewer: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function getReviewsByFreelancer(freelancerId) {
  return prisma.review.findMany({
    where: { freelancerId },
    include: { reviewer: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function getFreelancerRating(freelancerId) {
  const reviews = await prisma.review.findMany({
    where: { freelancerId },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    return { averageRating: 0.0, totalReviews: 0 };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = sum / reviews.length;
  const roundedAverage = Math.round(average * 10) / 10;

  return {
    averageRating: roundedAverage,
    totalReviews: reviews.length,
  };
}

module.exports = {
  createReview,
  getReviewsByJob,
  getReviewsByFreelancer,
  getFreelancerRating,
};