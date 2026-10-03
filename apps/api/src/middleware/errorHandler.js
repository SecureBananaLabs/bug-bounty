<content>
import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, error: err.message });
  }
  // ... existing error handling logic
};
</content>