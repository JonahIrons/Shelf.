import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { listUserReviews, createReview, updateReview, deleteReview } from '../controllers/reviewController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', listUserReviews);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

export default router;
