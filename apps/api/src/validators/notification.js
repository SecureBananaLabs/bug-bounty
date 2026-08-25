const { z } = require('zod');

const validateCreateNotification = (data) => {
  const schema = z.object({
    userId: z.string().min(1, "userId is required"),
    title: z.string().min(2, "title must be at least 2 characters long"),
    body: z.string().min(2, "body must be at least 2 characters long"),
  });

  return schema.safeParse(data);
};

module.exports = {
  validateCreateNotification,
};
