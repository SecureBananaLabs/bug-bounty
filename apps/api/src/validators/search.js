const { z } = require('zod');

const searchQuerySchema = z.object({
  q: z.string().trim().min(2, "Search query 'q' must be at least 2 characters").max(100),
});

function validateSearchQuery(req, res, next) {
  const result = searchQuerySchema.safeParse(req.query);
  if (!result.success) {
    const errorMessage = result.error.errors[0]?.message || "Invalid search query";
    return res.status(400).json({ error: errorMessage });
  }
  req.query = result.data;
  next();
}

module.exports = { validateSearchQuery };
