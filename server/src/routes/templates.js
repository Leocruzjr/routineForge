import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getTemplates, adoptTemplate } from '../controllers/templateController.js';

const router = Router();

router.get('/', getTemplates);
router.post('/:id/adopt', authenticate, adoptTemplate);

export default router;
