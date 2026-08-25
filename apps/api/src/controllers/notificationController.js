const notificationService = require('../services/notificationService');
const { validateCreateNotification } = require('../validators/notification');
const { Response } = require('express');

const postNotification = async (req, res, next) => {
  try {
    const validation = validateCreateNotification(req.body);

    if (!validation.success) {
      return res.status(400).json({
        errors: validation.error.errors.map(err => ({ field: err.path[0], message: err.message }))
      });
    }

    const notification = await notificationService.createNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  postNotification,
};
