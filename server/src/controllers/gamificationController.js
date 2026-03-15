import prisma from '../prisma/client.js';
import { apiResponse, xpForLevel, FREE_TIER_LIMITS } from '../../../shared/constants.js';

/**
 * GET /api/gamification/profile — XP, level, streak, freeze count
 */
export async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        totalXp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        streakFreezes: true,
        plan: true,
        planExpiresAt: true,
      },
    });

    if (!user) {
      return res.status(404).json(apiResponse(false, null, 'User not found'));
    }

    const currentLevelXp = xpForLevel(user.level);
    const nextLevelXp = xpForLevel(user.level + 1);

    res.json(apiResponse(true, {
      ...user,
      currentLevelXp,
      nextLevelXp,
      progressXp: user.totalXp - currentLevelXp,
      neededXp: nextLevelXp - currentLevelXp,
    }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/gamification/badges — All badges with earned status
 */
export async function getBadges(req, res, next) {
  try {
    const allBadges = await prisma.badge.findMany({
      orderBy: [{ category: 'asc' }, { xpReward: 'asc' }],
    });

    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.user.userId },
      select: { badgeId: true, earnedAt: true },
    });

    const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));

    const badges = allBadges.map((badge) => ({
      ...badge,
      earned: earnedMap.has(badge.id),
      earnedAt: earnedMap.get(badge.id) || null,
    }));

    res.json(apiResponse(true, { badges }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/gamification/rewards — All rewards with owned status
 */
export async function getRewards(req, res, next) {
  try {
    const allRewards = await prisma.reward.findMany({
      orderBy: { xpCost: 'asc' },
    });

    const userRewards = await prisma.userReward.findMany({
      where: { userId: req.user.userId },
      select: { rewardId: true, redeemedAt: true },
    });

    const ownedMap = new Map(userRewards.map((ur) => [ur.rewardId, ur.redeemedAt]));

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { totalXp: true },
    });

    const rewards = allRewards.map((reward) => ({
      ...reward,
      owned: ownedMap.has(reward.id),
      redeemedAt: ownedMap.get(reward.id) || null,
      canAfford: user.totalXp >= reward.xpCost,
    }));

    res.json(apiResponse(true, { rewards, availableXp: user.totalXp }));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/gamification/rewards/:id/redeem — Spend XP on a reward
 */
export async function redeemReward(req, res, next) {
  try {
    const userId = req.user.userId;
    const rewardId = req.params.id;

    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward) {
      return res.status(404).json(apiResponse(false, null, 'Reward not found'));
    }

    // Check if already owned
    const existing = await prisma.userReward.findUnique({
      where: { userId_rewardId: { userId, rewardId } },
    });
    if (existing) {
      return res.status(409).json(apiResponse(false, null, 'Reward already owned'));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.totalXp < reward.xpCost) {
      return res.status(400).json(apiResponse(false, null, 'Not enough XP'));
    }

    // Deduct XP and grant reward in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { totalXp: { decrement: reward.xpCost } },
      }),
      prisma.userReward.create({
        data: { userId, rewardId },
      }),
    ]);

    // Handle special rewards
    if (reward.name === 'Extra Streak Freeze') {
      await prisma.user.update({
        where: { id: userId },
        data: { streakFreezes: { increment: 1 } },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXp: true },
    });

    res.json(apiResponse(true, {
      message: `Redeemed "${reward.name}"`,
      remainingXp: updatedUser.totalXp,
    }));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/gamification/plan/upgrade — Upgrade/downgrade plan (placeholder for payment integration)
 */
export async function upgradePlan(req, res, next) {
  try {
    const userId = req.user.userId;
    const { plan } = req.body;

    if (!['FREE', 'PRO'].includes(plan)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid plan'));
    }

    const data = { plan };
    if (plan === 'PRO') {
      // Set expiry 30 days from now (placeholder — real payments would set this)
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      data.planExpiresAt = expires;
    } else {
      data.planExpiresAt = null;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { plan: true, planExpiresAt: true },
    });

    res.json(apiResponse(true, user));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/gamification/stats — Aggregated stats for progress page
 */
export async function getStats(req, res, next) {
  try {
    const userId = req.user.userId;

    // Check user plan to determine data range
    const userPlan = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    });

    const isPro = userPlan.plan === 'PRO' && (!userPlan.planExpiresAt || userPlan.planExpiresAt > new Date());
    const heatmapDays = isPro ? 90 : FREE_TIER_LIMITS.heatmapDays;

    // Completion history for heatmap
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - heatmapDays);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const completions = await prisma.routineCompletion.findMany({
      where: { userId, date: { gte: ninetyDaysAgo }, completedAt: { not: null } },
      select: { date: true, completionPct: true, xpEarned: true },
      orderBy: { date: 'asc' },
    });

    // Build heatmap data: { date: string, completionPct: number, xpEarned: number }
    const heatmap = completions.map((c) => ({
      date: c.date.toISOString().split('T')[0],
      completionPct: c.completionPct,
      xpEarned: c.xpEarned,
    }));

    // Aggregate stats
    const totalCompleted = await prisma.routineCompletion.count({
      where: { userId, completedAt: { not: null } },
    });

    const avgCompletion = await prisma.routineCompletion.aggregate({
      where: { userId, completedAt: { not: null } },
      _avg: { completionPct: true },
    });

    // XP earned per week (pro: 8 weeks, free: 1 week)
    const weekCount = isPro ? 8 : 1;
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - weekCount * 7);
    eightWeeksAgo.setHours(0, 0, 0, 0);

    const recentCompletions = await prisma.routineCompletion.findMany({
      where: { userId, date: { gte: eightWeeksAgo }, completedAt: { not: null } },
      select: { date: true, xpEarned: true },
      orderBy: { date: 'asc' },
    });

    // Group XP by week
    const weeklyXp = {};
    for (const c of recentCompletions) {
      const weekStart = new Date(c.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = weekStart.toISOString().split('T')[0];
      weeklyXp[key] = (weeklyXp[key] || 0) + c.xpEarned;
    }

    res.json(apiResponse(true, {
      heatmap,
      totalCompleted,
      avgCompletionPct: avgCompletion._avg.completionPct || 0,
      weeklyXp: Object.entries(weeklyXp).map(([week, xp]) => ({ week, xp })),
      isPro,
    }));
  } catch (err) {
    next(err);
  }
}
