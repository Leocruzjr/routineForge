import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { startCompletionSchema, completeStepSchema } from '../validations/completions.js';
import {
  startCompletion,
  completeStep,
  finishCompletion,
  getTodayCompletions,
  getHistory,
} from '../controllers/completionController.js';

const router = Router();

router.use(authenticate);

router.post('/start', validate(startCompletionSchema), startCompletion);
router.put('/:id/step', validate(completeStepSchema), completeStep);
router.put('/:id/finish', finishCompletion);
router.get('/today', getTodayCompletions);
router.get('/history', getHistory);

export default router;
