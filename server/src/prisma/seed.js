import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- Badges (15+) ---
  const badges = [
    // Streak badges
    { slug: 'getting-started', name: 'Getting Started', description: 'Maintain a 3-day streak', icon: 'flame', category: 'streak', requirement: { type: 'streak', value: 3 }, xpReward: 50 },
    { slug: 'one-week-warrior', name: 'One Week Warrior', description: 'Maintain a 7-day streak', icon: 'flame', category: 'streak', requirement: { type: 'streak', value: 7 }, xpReward: 150 },
    { slug: 'fortnight-focus', name: 'Fortnight Focus', description: 'Maintain a 14-day streak', icon: 'flame', category: 'streak', requirement: { type: 'streak', value: 14 }, xpReward: 300 },
    { slug: 'habit-forming', name: 'Habit Forming', description: 'Maintain a 21-day streak', icon: 'brain', category: 'streak', requirement: { type: 'streak', value: 21 }, xpReward: 500 },
    { slug: 'monthly-master', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: 'crown', category: 'streak', requirement: { type: 'streak', value: 30 }, xpReward: 750 },
    { slug: 'the-real-deal', name: 'The Real Deal', description: 'Maintain a 60-day streak', icon: 'trophy', category: 'streak', requirement: { type: 'streak', value: 60 }, xpReward: 1500 },
    { slug: 'centurion', name: 'Centurion', description: 'Maintain a 100-day streak', icon: 'shield', category: 'streak', requirement: { type: 'streak', value: 100 }, xpReward: 3000 },
    { slug: 'year-of-consistency', name: 'Year of Consistency', description: 'Maintain a 365-day streak', icon: 'star', category: 'streak', requirement: { type: 'streak', value: 365 }, xpReward: 10000 },

    // Milestone badges
    { slug: 'first-step', name: 'First Step', description: 'Complete your first-ever routine', icon: 'footprints', category: 'milestone', requirement: { type: 'total_completions', value: 1 }, xpReward: 25 },
    { slug: 'routine-architect', name: 'Routine Architect', description: 'Create a custom routine', icon: 'wrench', category: 'milestone', requirement: { type: 'custom_routines_created', value: 1 }, xpReward: 50 },
    { slug: 'early-riser', name: 'Early Riser', description: 'Complete morning routine before 7 AM five times', icon: 'sunrise', category: 'milestone', requirement: { type: 'early_morning_completions', value: 5 }, xpReward: 200 },
    { slug: 'night-owl-tamed', name: 'Night Owl Tamed', description: 'Complete bedtime routine for 7 consecutive nights', icon: 'moon', category: 'milestone', requirement: { type: 'consecutive_bedtime', value: 7 }, xpReward: 200 },

    // Challenge badges
    { slug: 'perfect-week', name: 'Perfect Week', description: '100% completion for 7 straight days', icon: 'check-circle', category: 'challenge', requirement: { type: 'perfect_days', value: 7 }, xpReward: 500 },
    { slug: 'double-down', name: 'Double Down', description: 'Complete 2 different routines in one day', icon: 'layers', category: 'challenge', requirement: { type: 'routines_in_day', value: 2 }, xpReward: 100 },
    { slug: 'speed-runner', name: 'Speed Runner', description: 'Complete a routine faster than your personal average', icon: 'zap', category: 'challenge', requirement: { type: 'faster_than_average', value: 1 }, xpReward: 75 },

    // Special badges
    { slug: 'five-am-club', name: '5 AM Club', description: 'Complete a routine before 5 AM', icon: 'alarm-clock', category: 'special', requirement: { type: 'completion_before_hour', value: 5 }, xpReward: 150 },
    { slug: 'comeback-kid', name: 'Comeback Kid', description: 'Resume a streak after it breaks', icon: 'refresh-cw', category: 'special', requirement: { type: 'streak_resumed', value: 1 }, xpReward: 100 },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: badge,
      create: badge,
    });
  }
  console.log(`Seeded ${badges.length} badges`);

  // --- Rewards ---
  const rewards = [
    { name: 'Midnight Theme', description: 'Dark mode with deep purple accents', xpCost: 500, icon: 'moon', category: 'cosmetic' },
    { name: 'Ocean Theme', description: 'Cool blue tones for a calming vibe', xpCost: 500, icon: 'waves', category: 'cosmetic' },
    { name: 'Forest Theme', description: 'Earthy greens inspired by nature', xpCost: 500, icon: 'trees', category: 'cosmetic' },
    { name: 'Custom Routine Icons', description: 'Unlock extra icon options for your routines', xpCost: 300, icon: 'palette', category: 'cosmetic' },
    { name: 'Gold Avatar Frame', description: 'A golden border for your profile picture', xpCost: 750, icon: 'award', category: 'cosmetic' },
    { name: 'Diamond Avatar Frame', description: 'A sparkling diamond border for your profile', xpCost: 1500, icon: 'gem', category: 'cosmetic' },
    { name: 'Extra Streak Freeze', description: 'One additional streak freeze to protect your streak', xpCost: 1500, icon: 'shield', category: 'power-up' },
    { name: 'Routine Insights', description: 'Unlock detailed analytics for your routines', xpCost: 2000, icon: 'bar-chart', category: 'unlock' },
    { name: 'Completion Sound Pack', description: 'Custom sounds when you complete steps', xpCost: 800, icon: 'volume-2', category: 'cosmetic' },
    { name: 'Widget Styles', description: 'Unlock alternative dashboard widget designs', xpCost: 1000, icon: 'layout', category: 'cosmetic' },
  ];

  // Delete existing rewards and recreate (no unique slug field)
  await prisma.reward.deleteMany();
  for (const reward of rewards) {
    await prisma.reward.create({ data: reward });
  }
  console.log(`Seeded ${rewards.length} rewards`);

  // --- Demo Users ---
  const passwordHash = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'demo@routineforge.app' },
    update: {},
    create: {
      email: 'demo@routineforge.app',
      username: 'demouser',
      passwordHash,
      totalXp: 2450,
      level: 8,
      currentStreak: 12,
      longestStreak: 14,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'newbie@routineforge.app' },
    update: {},
    create: {
      email: 'newbie@routineforge.app',
      username: 'newbie',
      passwordHash,
      totalXp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
    },
  });

  console.log('Seeded 2 demo users');

  // --- Default Morning Routine for demo user ---
  const morningRoutine = await prisma.routine.create({
    data: {
      userId: user1.id,
      name: 'The Science Stack',
      type: 'MORNING',
      description: 'A science-backed morning routine for optimal energy and focus.',
      difficulty: 'COMMITTED',
      isDefault: true,
      scheduledTime: '07:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      steps: {
        create: [
          { title: 'Wake at consistent time', order: 1, icon: 'alarm-clock', scienceNote: 'Irregular wake times disrupt circadian rhythms and reduce sleep quality. Consistency regulates your internal clock.' },
          { title: 'No snooze — feet on floor', durationMinutes: 1, order: 2, icon: 'footprints', scienceNote: 'Snoozing fragments sleep and worsens sleep inertia, causing brain fog. A decisive wake-up builds momentum.' },
          { title: 'Drink water (16-20 oz)', durationMinutes: 2, order: 3, icon: 'glass-water', scienceNote: 'You lose ~1 liter of water overnight. Even mild dehydration impairs attention and memory.' },
          { title: 'Get sunlight (5-10 min outside)', durationMinutes: 10, order: 4, icon: 'sun', scienceNote: 'Morning light exposure triggers the cortisol awakening response, resets your circadian rhythm, and improves nighttime sleep quality.' },
          { title: 'Move your body', description: 'Light exercise or stretching', durationMinutes: 10, order: 5, icon: 'dumbbell', scienceNote: 'Movement clears residual adenosine, releases dopamine and norepinephrine, and raises core body temperature for alertness.' },
          { title: 'Mindful moment', description: '1-5 min meditation or journaling', durationMinutes: 5, order: 6, icon: 'brain', scienceNote: 'Activates the parasympathetic nervous system, reducing baseline cortisol. Journaling top priorities reduces decision fatigue.' },
          { title: 'Eat a real breakfast', order: 7, icon: 'utensils', isOptional: true, scienceNote: 'Protein and fiber sustain energy better than liquid calories. Skipping breakfast can compromise immune function.' },
        ],
      },
    },
  });

  // --- Default Bedtime Routine for demo user ---
  const bedtimeRoutine = await prisma.routine.create({
    data: {
      userId: user1.id,
      name: 'The Wind-Down Protocol',
      type: 'BEDTIME',
      description: 'A science-backed bedtime routine for better sleep quality.',
      difficulty: 'COMMITTED',
      isDefault: true,
      scheduledTime: '22:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      steps: {
        create: [
          { title: 'Set a "screens off" alarm', order: 1, icon: 'smartphone-off', scienceNote: 'Blue light from screens suppresses melatonin production.' },
          { title: 'Prep for tomorrow', description: 'To-do list, outfit, bag', durationMinutes: 10, order: 2, icon: 'list-checks', scienceNote: 'Writing tomorrow\'s to-do list before bed significantly reduces time to fall asleep.' },
          { title: 'Dim the lights', order: 3, icon: 'lamp', scienceNote: 'Reduced ambient light signals your brain to begin melatonin production.' },
          { title: 'Warm shower or bath', durationMinutes: 10, order: 4, icon: 'shower-head', scienceNote: 'Warm water causes core body temperature to drop afterward — the trigger your body needs to initiate sleep.' },
          { title: 'Light stretching or breathing', durationMinutes: 5, order: 5, icon: 'wind', scienceNote: 'Activates rest-and-digest mode. Even 3-5 minutes of deep breathing reduces heart rate and anxiety.' },
          { title: 'Read or listen to calming content', durationMinutes: 15, order: 6, icon: 'book-open', scienceNote: 'Replaces stimulating screen content and eases the transition to sleep.' },
          { title: 'Lights out at consistent time', order: 7, icon: 'moon', scienceNote: 'Consistent bedtimes reinforce your circadian rhythm. Aim for 7-9 hours before your wake time.' },
        ],
      },
    },
  });

  // --- Quick Start routine for demo user ---
  await prisma.routine.create({
    data: {
      userId: user1.id,
      name: 'Quick Start Morning',
      type: 'MORNING',
      description: 'The minimum viable morning routine — just 3 steps, Estimated 10 min.',
      difficulty: 'EASY',
      isDefault: true,
      isActive: false,
      scheduledTime: '07:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      steps: {
        create: [
          { title: 'Drink water (16-20 oz)', durationMinutes: 2, order: 1, icon: 'glass-water', scienceNote: 'Rehydrating first thing restores cognitive function after overnight water loss.' },
          { title: 'Get sunlight (5 min)', durationMinutes: 5, order: 2, icon: 'sun', scienceNote: 'Morning light resets your circadian clock and boosts alertness.' },
          { title: 'Write 3 priorities', durationMinutes: 3, order: 3, icon: 'list', scienceNote: 'Identifying your top 3 tasks reduces decision fatigue throughout the day.' },
        ],
      },
    },
  });

  // --- Sample completion history for demo user (14 days) ---
  const morningSteps = await prisma.routineStep.findMany({
    where: { routineId: morningRoutine.id },
    orderBy: { order: 'asc' },
  });

  const today = new Date();
  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    // Skip 2 days to make it realistic (days 5 and 10 ago)
    if (daysAgo === 5 || daysAgo === 10) continue;

    const stepsCompleted = daysAgo % 3 === 0 ? morningSteps.length : morningSteps.length - 1;
    const completionPct = stepsCompleted / morningSteps.length;

    const startedAt = new Date(date);
    startedAt.setHours(7, 0, 0, 0);
    const completedAt = new Date(startedAt);
    completedAt.setMinutes(completedAt.getMinutes() + 28);

    const completion = await prisma.routineCompletion.create({
      data: {
        userId: user1.id,
        routineId: morningRoutine.id,
        date,
        startedAt,
        completedAt,
        totalTimeMs: 28 * 60 * 1000,
        xpEarned: Math.floor(200 + Math.random() * 150),
        stepsCompleted,
        stepsTotal: morningSteps.length,
        completionPct,
        stepCompletions: {
          create: morningSteps.map((step, i) => ({
            stepId: step.id,
            completed: i < stepsCompleted,
            skipped: i >= stepsCompleted,
            completedAt: i < stepsCompleted ? new Date(startedAt.getTime() + (i + 1) * 4 * 60000) : null,
            timeSpentMs: i < stepsCompleted ? (step.durationMinutes || 2) * 60000 : null,
          })),
        },
      },
    });
  }

  console.log('Seeded 12 days of completion history');

  // Give demo user some badges
  const firstStepBadge = await prisma.badge.findUnique({ where: { slug: 'first-step' } });
  const gettingStartedBadge = await prisma.badge.findUnique({ where: { slug: 'getting-started' } });
  const oneWeekBadge = await prisma.badge.findUnique({ where: { slug: 'one-week-warrior' } });

  if (firstStepBadge) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: user1.id, badgeId: firstStepBadge.id } },
      update: {},
      create: { userId: user1.id, badgeId: firstStepBadge.id },
    });
  }
  if (gettingStartedBadge) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: user1.id, badgeId: gettingStartedBadge.id } },
      update: {},
      create: { userId: user1.id, badgeId: gettingStartedBadge.id },
    });
  }
  if (oneWeekBadge) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: user1.id, badgeId: oneWeekBadge.id } },
      update: {},
      create: { userId: user1.id, badgeId: oneWeekBadge.id },
    });
  }

  console.log('Seeded demo user badges');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
