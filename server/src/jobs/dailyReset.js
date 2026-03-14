import cron from 'node-cron';
import prisma from '../prisma/client.js';
import { dailyStreakCheck } from '../services/streakService.js';

/**
 * Daily cron job — runs at midnight (server time).
 * For each user, evaluates the previous day's streak status.
 */
export function startDailyResetJob() {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running daily streak check...');

    try {
      const users = await prisma.user.findMany({
        where: { currentStreak: { gt: 0 } },
        select: { id: true, username: true },
      });

      console.log(`[Cron] Checking ${users.length} users with active streaks`);

      for (const user of users) {
        try {
          await dailyStreakCheck(user.id);
        } catch (err) {
          console.error(`[Cron] Failed streak check for ${user.username}:`, err.message);
        }
      }

      console.log('[Cron] Daily streak check complete');
    } catch (err) {
      console.error('[Cron] Daily reset job failed:', err);
    }
  });

  console.log('Daily reset cron job scheduled (midnight)');
}
