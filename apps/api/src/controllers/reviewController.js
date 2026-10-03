import { prisma } from '../config/db.js';
import { response } from '../utils/response.js';
import { createReviewSchema, updateReviewSchema, reviewParamsSchema } from '../validators/review.js';
import { logger } from '../config/logger.js';

export const postReview = async (req, res) => {
  try {
    // Validate request payload
    const validatedData = createReviewSchema.parse(req.body);
    
    // Check if user has already reviewed this target user
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: req.user.id,
        targetUserId: validatedData.targetUserId,
      },
    });

    if (existingReview) {
      return response(res, 409, 'You have already reviewed this user');
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        reviewerId: req.user.id,
        targetUserId: validatedData.targetUserId,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    logger.info(`Review created by ${req.user.username} for user ${validatedData.targetUserId}`);

    return response(res, 201, 'Review created successfully', review);
  } catch (error) {
    if (error.name === 'ZodError') {
      return response(res, 400, 'Validation failed', error.errors);
    }
    logger.error('Error creating review:', error);
    return response(res, 500, 'Internal server error');
  }
};

export const getReviews = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    
    // Validate targetUserId
    const validatedParams = { id: targetUserId };
    reviewParamsSchema.parse(validatedParams);

    const reviews = await prisma.review.findMany({
      where: {
        targetUserId,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return response(res, 200, 'Reviews retrieved successfully', reviews);
  } catch (error) {
    if (error.name === 'ZodError') {
      return response(res, 400, 'Validation failed', error.errors);
    }
    logger.error('Error fetching reviews:', error);
    return response(res, 500, 'Internal server error');
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateReviewSchema.parse(req.body);
    
    // Validate review ID
    const validatedParams = { id };
    reviewParamsSchema.parse(validatedParams);

    // Check if review exists and belongs to the user
    const existingReview = await prisma.review.findFirst({
      where: {
        id,
        reviewerId: req.user.id,
      },
    });

    if (!existingReview) {
      return response(res, 404, 'Review not found or you do not have permission to update it');
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: validatedData,
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    logger.info(`Review updated by ${req.user.username} for review ${id}`);

    return response(res, 200, 'Review updated successfully', updatedReview);
  } catch (error) {
    if (error.name === 'ZodError') {
      return response(res, 400, 'Validation failed', error.errors);
    }
    logger.error('Error updating review:', error);
    return response(res, 500, 'Internal server error');
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate review ID
    const validatedParams = { id };
    reviewParamsSchema.parse(validatedParams);

    // Check if review exists and belongs to the user
    const existingReview = await prisma.review.findFirst({
      where: {
        id,
        reviewerId: req.user.id,
      },
    });

    if (!existingReview) {
      return response(res, 404, 'Review not found or you do not have permission to delete it');
    }

    // Delete the review
    await prisma.review.delete({
      where: { id },
    });

    logger.info(`Review deleted by ${req.user.username} for review ${id}`);

    return response(res, 200, 'Review deleted successfully');
  } catch (error) {
    if (error.name === 'ZodError') {
      return response(res, 400, 'Validation failed', error.errors);
    }
    logger.error('Error deleting review:', error);
    return response(res, 500, 'Internal server error');
  }
};