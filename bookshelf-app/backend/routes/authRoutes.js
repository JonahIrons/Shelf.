import express from 'express';
import { register, log, verify } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register-user', register);
router.post('/log-user', log);
router.get('/verify', authenticate, verify); // Protected route to verify token

export default router;