import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';
import { loginSchema } from '../validation/authSchemas.js';

const router = Router();

router.post('/login', validate(loginSchema, 'body'), authController.login);
router.get('/me', verifyToken, authController.me);

export default router;
