import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: err.errors,
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
};
