import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createRoutineSchema,
  updateRoutineSchema,
  addStepSchema,
  updateStepSchema,
  reorderStepsSchema,
} from '../validations/routines.js';
import {
  getRoutines,
  getRoutine,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  addStep,
  updateStep,
  deleteStep,
  reorderSteps,
} from '../controllers/routineController.js';

const router = Router();

router.use(authenticate);

router.get('/', getRoutines);
router.get('/:id', getRoutine);
router.post('/', validate(createRoutineSchema), createRoutine);
router.put('/:id', validate(updateRoutineSchema), updateRoutine);
router.delete('/:id', deleteRoutine);

router.post('/:id/steps', validate(addStepSchema), addStep);
router.put('/:id/steps/:stepId', validate(updateStepSchema), updateStep);
router.delete('/:id/steps/:stepId', deleteStep);
router.put('/:id/steps/reorder', validate(reorderStepsSchema), reorderSteps);

export default router;
