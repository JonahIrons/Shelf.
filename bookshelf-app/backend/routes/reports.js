import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { generateBookReport } from '../controllers/reportController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Report routes
router.get('/books', generateBookReport); // GET /api/reports/books?bookshelf_id=1&author=Orwell&year_from=1940&year_to=1950&rating_min=7&rating_max=10

export default router;

