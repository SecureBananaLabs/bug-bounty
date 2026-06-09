import { Request, Response, NextFunction } from 'express';
import { globalSearch } from '../services/searchService';
import { z } from 'zod';

const searchQuerySchema = z.string().trim().max(100);

export const search = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q;
    const parsedQuery = searchQuerySchema.parse(query);

    const results = await globalSearch(parsedQuery);
    res.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid search query' });
    } else {
      next(error);
    }
  }
};