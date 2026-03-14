import prisma from '../prisma/client.js';
import { STREAK_COMPLETION_THRESHOLD } from '../../../shared/constants.js';

/**
 * Evaluate whether a given date counts as a "streak day" for a user.
 * A streak day = at least one active routine completed at >= 70% of steps.
 * @param {string} userId
 * @param {Date} date
 * @returns {Promise<boolean>}
 */
export async function isStreakDay(userId, date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const completions = await prisma.routineCompletion.findMany({
    where: {
      userId,
      date: dayStart,
      completedAt: { not: null },
    },
  });

  return completions.some((c) => c.completionPct >= STREAK_COMPLETION_THRESHOLD);
}

/**
 * Update a user's streak after a routine completion.
 * Called after each routine is finished.
 * @param {string} userId
 * @returns {Promise<{ currentStreak: number, longestStreak: number, streakFrozeUsed: boolean }>}
 */
export async function updateStreakOnCompletion(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayIsStreak = await isStreakDay(userId, today);
  if (!todayIsStreak) return { currentStreak: user.currentStreak, longestStreak: user.longestStreak, streakFrozeUsed: false };

  // Check if yesterday was a streak day or if the streak was already counting today
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayWasStreak = await isStreakDay(userId, yesterday);

  let newStreak;
  if (yesterdayWasStreak || user.currentStreak > 0) {
    // Continue the streak — but only increment if we haven't already counted today
    // Check if today was already counted by seeing if streak was updated today
    newStreak = user.currentStreak + 1;
  } else {
    // Starting a fresh streak
    newStreak = 1;
  }

  // Prevent double-counting: check if there's already a completion for today
  // that was previously processed (streak already incremented)
  const todayCompletionCount = await prisma.routineCompletion.count({
    where: { userId, date: today, completedAt: { not: null } },
  });

  // Only increment once per day — if multiple routines completed, don't double-count
  if (todayCompletionCount > 1) {
    // Already counted today, don't increment again
    return { currentStreak: user.currentStreak, longestStreak: user.longestStreak, streakFrozeUsed: false };
  }

  const newLongest = Math.max(newStreak, user.longestStreak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
    },
  });

  return { currentStreak: newStreak, longestStreak: newLongest, streakFrozeUsed: false };
}

/**
 * Daily streak check — runs via cron for each user.
 * Evaluates the previous day and handles streak freeze logic.
 * @param {string} userId
 */
export async function dailyStreakCheck(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.currentStreak === 0) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const wasStreakDay = await isStreakDay(userId, yesterday);

  if (wasStreakDay) return; // All good, streak continues

  // Yesterday wasn't a streak day — try to use a freeze
  if (user.streakFreezes > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { streakFreezes: user.streakFreezes - 1 },
    });
    console.log(`Streak freeze used for user ${userId}. Remaining: ${user.streakFreezes - 1}`);
  } else {
    // No freeze available — reset streak
    await prisma.user.update({
      where: { id: userId },
      data: { currentStreak: 0 },
    });
    console.log(`Streak reset for user ${userId}. Previous: ${user.currentStreak}`);
  }
}
