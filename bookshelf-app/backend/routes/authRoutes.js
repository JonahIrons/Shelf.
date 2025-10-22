import express from 'express';
import { register, log } from '../controllers/authController.js';

const router = express.Router();

router.post('/register-user', register);
router.post('/log-user', log);

export default router;