import prisma from '../prisma/client.js';
import { apiResponse } from '../../../shared/constants.js';

/**
 * GET /api/routines — Get all routines for the authenticated user
 */
export async function getRoutines(req, res, next) {
  try {
    const routines = await prisma.routine.findMany({
      where: { userId: req.user.userId },
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(apiResponse(true, { routines }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/routines/:id — Get a single routine with steps
 */
export async function getRoutine(req, res, next) {
  try {
    const routine = await prisma.routine.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!routine) {
      return res.status(404).json(apiResponse(false, null, 'Routine not found'));
    }

    res.json(apiResponse(true, { routine }));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/routines — Create a new routine with optional steps
 */
export async function createRoutine(req, res, next) {
  try {
    const { steps, ...routineData } = req.body;

    const routine = await prisma.routine.create({
      data: {
        ...routineData,
        userId: req.user.userId,
        steps: steps.length > 0
          ? { create: steps.map((step, i) => ({ ...step, order: i + 1 })) }
          : undefined,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    res.status(201).json(apiResponse(true, { routine }));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/routines/:id — Update routine properties (not steps)
 */
export async function updateRoutine(req, res, next) {
  try {
    const existing = await prisma.routine.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });

    if (!existing) {
      return res.status(404).json(apiResponse(false, null, 'Routine not found'));
    }

    const routine = await prisma.routine.update({
      where: { id: req.params.id },
      data: req.body,
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    res.json(apiResponse(true, { routine }));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/routines/:id — Delete a routine
 */
export async function deleteRoutine(req, res, next) {
  try {
    const existing = await prisma.routine.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });

    if (!existing) {
      return res.status(404).json(apiResponse(false, null, 'Routine not found'));
    }

    await prisma.routine.delete({ where: { id: req.params.id } });
    res.json(apiResponse(true, { message: 'Routine deleted' }));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/routines/:id/steps — Add a step to a routine
 */
export async function addStep(req, res, next) {
  try {
    const routine = await prisma.routine.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: { steps: true },
    });

    if (!routine) {
      return res.status(404).json(apiResponse(false, null, 'Routine not found'));
    }

    const maxOrder = routine.steps.reduce((max, s) => Math.max(max, s.order), 0);

    const step = await prisma.routineStep.create({
      data: {
        ...req.body,
        routineId: req.params.id,
        order: maxOrder + 1,
      },
    });

    res.status(201).json(apiResponse(true, { step }));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/routines/:id/steps/:stepId — Update a step
 */
export async function updateStep(req, res, next) {
  try {
    const step = await prisma.routineStep.findFirst({
      where: { id: req.params.stepId, routine: { id: req.params.id, userId: req.user.userId } },
    });

    if (!step) {
      return res.status(404).json(apiResponse(false, null, 'Step not found'));
    }

    const updated = await prisma.routineStep.update({
      where: { id: req.params.stepId },
      data: req.body,
    });

    res.json(apiResponse(true, { step: updated }));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/routines/:id/steps/:stepId — Delete a step
 */
export async function deleteStep(req, res, next) {
  try {
    const step = await prisma.routineStep.findFirst({
      where: { id: req.params.stepId, routine: { id: req.params.id, userId: req.user.userId } },
    });

    if (!step) {
      return res.status(404).json(apiResponse(false, null, 'Step not found'));
    }

    await prisma.routineStep.delete({ where: { id: req.params.stepId } });

    // Re-order remaining steps
    const remaining = await prisma.routineStep.findMany({
      where: { routineId: req.params.id },
      orderBy: { order: 'asc' },
    });

    await Promise.all(
      remaining.map((s, i) =>
        prisma.routineStep.update({ where: { id: s.id }, data: { order: i + 1 } })
      )
    );

    res.json(apiResponse(true, { message: 'Step deleted' }));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/routines/:id/steps/reorder — Reorder steps
 */
export async function reorderSteps(req, res, next) {
  try {
    const routine = await prisma.routine.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });

    if (!routine) {
      return res.status(404).json(apiResponse(false, null, 'Routine not found'));
    }

    const { orderedStepIds } = req.body;

    await prisma.$transaction(
      orderedStepIds.map((stepId, i) =>
        prisma.routineStep.update({
          where: { id: stepId },
          data: { order: i + 1 },
        })
      )
    );

    const steps = await prisma.routineStep.findMany({
      where: { routineId: req.params.id },
      orderBy: { order: 'asc' },
    });

    res.json(apiResponse(true, { steps }));
  } catch (err) {
    next(err);
  }
}
