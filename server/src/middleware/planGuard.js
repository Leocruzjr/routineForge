import prisma from '../prisma/client.js';
import { apiResponse, FREE_TIER_LIMITS } from '../../../shared/constants.js';

/**
 * Middleware that checks if a user has hit their free-tier routine limit.
 * Attach to POST /api/routines (create routine).
 */
export async function enforceRoutineLimit(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { plan: true, planExpiresAt: true },
    });

    if (!user) {
      return res.status(401).json(apiResponse(false, null, 'User not found'));
    }

    // Pro users with valid subscription skip limit
    if (user.plan === 'PRO' && (!user.planExpiresAt || user.planExpiresAt > new Date())) {
      return next();
    }

    // Count active routines
    const activeCount = await prisma.routine.count({
      where: { userId: req.user.userId, isActive: true },
    });

    if (activeCount >= FREE_TIER_LIMITS.maxActiveRoutines) {
      return res.status(403).json(
        apiResponse(false, null, `Free plan is limited to ${FREE_TIER_LIMITS.maxActiveRoutines} active routines. Upgrade to Pro for unlimited routines.`)
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
