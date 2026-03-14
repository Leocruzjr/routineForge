import prisma from '../prisma/client.js';
import { apiResponse } from '../../../shared/constants.js';
import { updateStreakOnCompletion } from '../services/streakService.js';
import { checkAndAwardBadges } from '../services/badgeService.js';

/**
 * POST /api/completions/start — Start a routine run
 */
export async function startCompletion(req, res, next) {
  try {
    const { routineId } = req.body;
    const userId = req.user.userId;

    const routine = await prisma.routine.findFirst({
      where: { id: routineId, userId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!routine) {
      return res.status(404).json(apiResponse(false, null, 'Routine not found'));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's already a completion for today
    const existing = await prisma.routineCompletion.findUnique({
      where: { userId_routineId_date: { userId, routineId, date: today } },
      include: { stepCompletions: true },
    });

    if (existing) {
      return res.json(apiResponse(true, { completion: existing, resumed: true }));
    }

    const completion = await prisma.routineCompletion.create({
      data: {
        userId,
        routineId,
        date: today,
        startedAt: new Date(),
        stepsTotal: routine.steps.length,
        stepCompletions: {
          create: routine.steps.map((step) => ({
            stepId: step.id,
            completed: false,
            skipped: false,
          })),
        },
      },
      include: { stepCompletions: true },
    });

    res.status(201).json(apiResponse(true, { completion, resumed: false }));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/completions/:id/step — Mark a step complete or skipped
 */
export async function completeStep(req, res, next) {
  try {
    const { stepId, completed, skipped, timeSpentMs } = req.body;
    const completionId = req.params.id;

    // Verify ownership
    const completion = await prisma.routineCompletion.findFirst({
      where: { id: completionId, userId: req.user.userId },
    });

    if (!completion) {
      return res.status(404).json(apiResponse(false, null, 'Completion not found'));
    }

    const stepCompletion = await prisma.stepCompletion.findFirst({
      where: { routineCompletionId: completionId, stepId },
    });

    if (!stepCompletion) {
      return res.status(404).json(apiResponse(false, null, 'Step not found in this run'));
    }

    const updated = await prisma.stepCompletion.update({
      where: { id: stepCompletion.id },
      data: {
        completed,
        skipped,
        timeSpentMs: timeSpentMs ?? null,
        completedAt: completed ? new Date() : null,
      },
    });

    // Update completion progress
    const allSteps = await prisma.stepCompletion.findMany({
      where: { routineCompletionId: completionId },
    });

    const stepsCompleted = allSteps.filter((s) => s.completed).length;
    const completionPct = allSteps.length > 0 ? stepsCompleted / allSteps.length : 0;

    await prisma.routineCompletion.update({
      where: { id: completionId },
      data: { stepsCompleted, completionPct },
    });

    res.json(apiResponse(true, { stepCompletion: updated, stepsCompleted, completionPct }));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/completions/:id/finish — Finish a routine run and calculate XP
 */
export async function finishCompletion(req, res, next) {
  try {
    const completionId = req.params.id;
    const userId = req.user.userId;

    const completion = await prisma.routineCompletion.findFirst({
      where: { id: completionId, userId },
      include: {
        stepCompletions: { include: { step: true } },
        routine: true,
      },
    });

    if (!completion) {
      return res.status(404).json(apiResponse(false, null, 'Completion not found'));
    }

    // Calculate XP
    const { XP, DIFFICULTY_TIERS } = await import('../../../shared/constants.js');
    const user = await prisma.user.findUnique({ where: { id: userId } });

    let baseXp = 0;

    for (const sc of completion.stepCompletions) {
      if (sc.completed) {
        baseXp += sc.step.isOptional ? XP.OPTIONAL_STEP_COMPLETE : XP.STEP_COMPLETE;
      }
    }

    const stepsCompleted = completion.stepCompletions.filter((s) => s.completed).length;
    const stepsTotal = completion.stepCompletions.length;

    // Full routine bonus
    if (stepsCompleted === stepsTotal) {
      baseXp += XP.FULL_ROUTINE_BONUS;
    }

    // On-time bonus: completed within scheduled time window
    if (completion.routine.scheduledTime) {
      const [targetHour, targetMin] = completion.routine.scheduledTime.split(':').map(Number);
      const startHour = completion.startedAt.getHours();
      const startMin = completion.startedAt.getMinutes();
      if (startHour < targetHour || (startHour === targetHour && startMin <= targetMin)) {
        baseXp += XP.ON_TIME_BONUS;
      }
    }

    // Day starter bonus — check if this is the first completion today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCompletions = await prisma.routineCompletion.count({
      where: { userId, date: today, completedAt: { not: null } },
    });
    if (todayCompletions === 0) {
      baseXp += XP.DAY_STARTER_BONUS;
    }

    // Streak multiplier
    const streakMult = Math.min(
      1.0 + user.currentStreak * XP.STREAK_MULTIPLIER_PER_DAY,
      XP.STREAK_MULTIPLIER_CAP
    );

    // Difficulty multiplier
    const diffMult = DIFFICULTY_TIERS[completion.routine.difficulty]?.multiplier || 1.0;

    // Weekend bonus
    const dayOfWeek = new Date().getDay();
    const weekendMult = (dayOfWeek === 0 || dayOfWeek === 6) ? XP.WEEKEND_MULTIPLIER : 1.0;

    const totalXp = Math.floor(baseXp * streakMult * diffMult * weekendMult);

    // Update completion
    const now = new Date();
    const totalTimeMs = now.getTime() - completion.startedAt.getTime();
    const completionPct = stepsTotal > 0 ? stepsCompleted / stepsTotal : 0;

    const updated = await prisma.routineCompletion.update({
      where: { id: completionId },
      data: {
        completedAt: now,
        totalTimeMs,
        xpEarned: totalXp,
        stepsCompleted,
        completionPct,
      },
    });

    // Update user XP and check level up
    const { xpForLevel } = await import('../../../shared/constants.js');
    const newTotalXp = user.totalXp + totalXp;
    let newLevel = user.level;
    while (xpForLevel(newLevel + 1) <= newTotalXp) {
      newLevel++;
    }

    const leveledUp = newLevel > user.level;

    await prisma.user.update({
      where: { id: userId },
      data: { totalXp: newTotalXp, level: newLevel },
    });

    // Update streak
    const streakResult = await updateStreakOnCompletion(userId);

    // Check for newly earned badges
    const newBadges = await checkAndAwardBadges(userId);

    res.json(apiResponse(true, {
      completion: updated,
      xpBreakdown: {
        baseXp,
        streakMultiplier: streakMult,
        difficultyMultiplier: diffMult,
        weekendMultiplier: weekendMult,
        totalXp,
      },
      leveledUp,
      newLevel,
      newTotalXp,
      streak: streakResult,
      newBadges,
    }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/completions/today — Get today's completion status for all routines
 */
export async function getTodayCompletions(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completions = await prisma.routineCompletion.findMany({
      where: { userId: req.user.userId, date: today },
      include: { stepCompletions: true, routine: { include: { steps: { orderBy: { order: 'asc' } } } } },
    });

    res.json(apiResponse(true, { completions }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/completions/history — Get completion history with optional filters
 */
export async function getHistory(req, res, next) {
  try {
    const { routineId, startDate, endDate } = req.query;

    const where = { userId: req.user.userId };
    if (routineId) where.routineId = routineId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const completions = await prisma.routineCompletion.findMany({
      where,
      include: { routine: true },
      orderBy: { date: 'desc' },
    });

    res.json(apiResponse(true, { completions }));
  } catch (err) {
    next(err);
  }
}
