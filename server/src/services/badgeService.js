import prisma from '../prisma/client.js';

/**
 * Check all unearned badges for a user and award any that are now met.
 * Called after routine completion and streak updates.
 * @param {string} userId
 * @returns {Promise<Array>} Newly earned badges
 */
export async function checkAndAwardBadges(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { badges: { include: { badge: true } } },
  });

  if (!user) return [];

  const earnedSlugs = new Set(user.badges.map((ub) => ub.badge.slug));

  const allBadges = await prisma.badge.findMany();
  const unearned = allBadges.filter((b) => !earnedSlugs.has(b.slug));

  if (unearned.length === 0) return [];

  // Gather stats needed for badge checks
  const stats = await gatherUserStats(userId);
  const newlyEarned = [];

  for (const badge of unearned) {
    const met = await evaluateRequirement(badge.requirement, stats, userId);
    if (met) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });

      // Award badge XP
      if (badge.xpReward > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { totalXp: { increment: badge.xpReward } },
        });
      }

      // Award streak freezes for milestone badges
      const freezeBadges = ['one-week-warrior', 'monthly-master', 'centurion'];
      if (freezeBadges.includes(badge.slug)) {
        const freezeAmount = badge.slug === 'centurion' ? 2 : 1;
        await prisma.user.update({
          where: { id: userId },
          data: { streakFreezes: { increment: freezeAmount } },
        });
      }

      newlyEarned.push(badge);
    }
  }

  return newlyEarned;
}

/**
 * Gather aggregate stats for badge evaluation
 */
async function gatherUserStats(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const totalCompletions = await prisma.routineCompletion.count({
    where: { userId, completedAt: { not: null } },
  });

  const customRoutines = await prisma.routine.count({
    where: { userId, isDefault: false },
  });

  // Count morning completions before 7 AM
  const earlyMorningCompletions = await prisma.routineCompletion.count({
    where: {
      userId,
      completedAt: { not: null },
      routine: { type: 'MORNING' },
    },
  });

  // Completions before 5 AM
  const allCompletions = await prisma.routineCompletion.findMany({
    where: { userId, completedAt: { not: null } },
    select: { startedAt: true },
  });

  const before5am = allCompletions.filter((c) => c.startedAt.getHours() < 5).length;
  const before7am = allCompletions.filter(
    (c) => c.startedAt.getHours() < 7 && c.routine?.type === 'MORNING'
  ).length;

  // Check for routines in same day
  const completionsByDate = await prisma.routineCompletion.groupBy({
    by: ['date'],
    where: { userId, completedAt: { not: null } },
    _count: { routineId: true },
  });

  const maxRoutinesInDay = completionsByDate.reduce(
    (max, d) => Math.max(max, d._count.routineId),
    0
  );

  // Perfect days (100% completion)
  const perfectDays = await prisma.routineCompletion.count({
    where: { userId, completedAt: { not: null }, completionPct: 1.0 },
  });

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalCompletions,
    customRoutines,
    earlyMorningCompletions,
    before5am,
    before7am,
    maxRoutinesInDay,
    perfectDays,
    hadPreviousStreak: user.longestStreak > 0 && user.currentStreak > 0 && user.currentStreak < user.longestStreak,
  };
}

/**
 * Evaluate a single badge requirement against user stats
 */
async function evaluateRequirement(requirement, stats, userId) {
  const { type, value } = requirement;

  switch (type) {
    case 'streak':
      return stats.currentStreak >= value || stats.longestStreak >= value;

    case 'total_completions':
      return stats.totalCompletions >= value;

    case 'custom_routines_created':
      return stats.customRoutines >= value;

    case 'early_morning_completions':
      return stats.before7am >= value;

    case 'consecutive_bedtime': {
      // Check for N consecutive days of bedtime routine completion
      const bedtimeCompletions = await prisma.routineCompletion.findMany({
        where: {
          userId,
          completedAt: { not: null },
          routine: { type: 'BEDTIME' },
        },
        orderBy: { date: 'desc' },
        take: value,
      });
      if (bedtimeCompletions.length < value) return false;
      // Check they're consecutive
      for (let i = 1; i < bedtimeCompletions.length; i++) {
        const diff = bedtimeCompletions[i - 1].date - bedtimeCompletions[i].date;
        const dayMs = 24 * 60 * 60 * 1000;
        if (Math.abs(diff - dayMs) > dayMs * 0.5) return false;
      }
      return true;
    }

    case 'perfect_days':
      return stats.perfectDays >= value;

    case 'routines_in_day':
      return stats.maxRoutinesInDay >= value;

    case 'faster_than_average': {
      // Check if latest completion is faster than user's average for that routine
      const latest = await prisma.routineCompletion.findFirst({
        where: { userId, completedAt: { not: null }, totalTimeMs: { not: null } },
        orderBy: { completedAt: 'desc' },
      });
      if (!latest) return false;
      const avg = await prisma.routineCompletion.aggregate({
        where: { userId, routineId: latest.routineId, completedAt: { not: null }, totalTimeMs: { not: null } },
        _avg: { totalTimeMs: true },
      });
      return avg._avg.totalTimeMs && latest.totalTimeMs < avg._avg.totalTimeMs;
    }

    case 'completion_before_hour':
      return stats.before5am >= 1;

    case 'streak_resumed':
      return stats.hadPreviousStreak;

    default:
      return false;
  }
}
