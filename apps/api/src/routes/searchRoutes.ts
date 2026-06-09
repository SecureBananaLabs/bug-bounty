import { Router } from 'express';
import { search } from '../controllers/searchController';

const searchRouter = Router();

searchRouter.get('/search', search);

export default searchRouter;