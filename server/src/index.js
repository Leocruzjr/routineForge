import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import routineRoutes from './routes/routines.js';
import completionRoutes from './routes/completions.js';
import templateRoutes from './routes/templates.js';
import gamificationRoutes from './routes/gamification.js';
import feedbackRoutes from './routes/feedback.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startDailyResetJob } from './jobs/dailyReset.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/completions', completionRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed endpoint (for initial production setup — seeds badges and rewards)
app.post('/api/seed', async (req, res) => {
  try {
    const { default: prisma } = await import('./prisma/client.js');

    const badges = [
      { slug: 'getting-started', name: 'Getting Started', description: 'Maintain a 3-day streak', icon: 'flame', category: 'streak', requirement: { type: 'streak', value: 3 }, xpReward: 50 },
      { slug: 'one-week-warrior', name: 'One Week Warrior', description: 'Maintain a 7-day streak', icon: 'flame', category: 'streak', requirement: { type: 'streak', value: 7 }, xpReward: 150 },
      { slug: 'fortnight-focus', name: 'Fortnight Focus', description: 'Maintain a 14-day streak', icon: 'flame', category: 'streak', requirement: { type: 'streak', value: 14 }, xpReward: 300 },
      { slug: 'habit-forming', name: 'Habit Forming', description: 'Maintain a 21-day streak', icon: 'brain', category: 'streak', requirement: { type: 'streak', value: 21 }, xpReward: 500 },
      { slug: 'monthly-master', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: 'crown', category: 'streak', requirement: { type: 'streak', value: 30 }, xpReward: 750 },
      { slug: 'the-real-deal', name: 'The Real Deal', description: 'Maintain a 60-day streak', icon: 'trophy', category: 'streak', requirement: { type: 'streak', value: 60 }, xpReward: 1500 },
      { slug: 'centurion', name: 'Centurion', description: 'Maintain a 100-day streak', icon: 'shield', category: 'streak', requirement: { type: 'streak', value: 100 }, xpReward: 3000 },
      { slug: 'year-of-consistency', name: 'Year of Consistency', description: 'Maintain a 365-day streak', icon: 'star', category: 'streak', requirement: { type: 'streak', value: 365 }, xpReward: 10000 },
      { slug: 'first-step', name: 'First Step', description: 'Complete your first-ever routine', icon: 'footprints', category: 'milestone', requirement: { type: 'total_completions', value: 1 }, xpReward: 25 },
      { slug: 'routine-architect', name: 'Routine Architect', description: 'Create a custom routine', icon: 'wrench', category: 'milestone', requirement: { type: 'custom_routines_created', value: 1 }, xpReward: 50 },
      { slug: 'early-riser', name: 'Early Riser', description: 'Complete morning routine before 7 AM five times', icon: 'sunrise', category: 'milestone', requirement: { type: 'early_morning_completions', value: 5 }, xpReward: 200 },
      { slug: 'night-owl-tamed', name: 'Night Owl Tamed', description: 'Complete bedtime routine for 7 consecutive nights', icon: 'moon', category: 'milestone', requirement: { type: 'consecutive_bedtime', value: 7 }, xpReward: 200 },
      { slug: 'perfect-week', name: 'Perfect Week', description: '100% completion for 7 straight days', icon: 'check-circle', category: 'challenge', requirement: { type: 'perfect_days', value: 7 }, xpReward: 500 },
      { slug: 'double-down', name: 'Double Down', description: 'Complete 2 different routines in one day', icon: 'layers', category: 'challenge', requirement: { type: 'routines_in_day', value: 2 }, xpReward: 100 },
      { slug: 'speed-runner', name: 'Speed Runner', description: 'Complete a routine faster than your personal average', icon: 'zap', category: 'challenge', requirement: { type: 'faster_than_average', value: 1 }, xpReward: 75 },
      { slug: 'five-am-club', name: '5 AM Club', description: 'Complete a routine before 5 AM', icon: 'alarm-clock', category: 'special', requirement: { type: 'completion_before_hour', value: 5 }, xpReward: 150 },
      { slug: 'comeback-kid', name: 'Comeback Kid', description: 'Resume a streak after it breaks', icon: 'refresh-cw', category: 'special', requirement: { type: 'streak_resumed', value: 1 }, xpReward: 100 },
    ];

    for (const badge of badges) {
      await prisma.badge.upsert({ where: { slug: badge.slug }, update: badge, create: badge });
    }

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

    await prisma.reward.deleteMany();
    for (const reward of rewards) {
      await prisma.reward.create({ data: reward });
    }

    res.json({ success: true, message: `Seeded ${badges.length} badges and ${rewards.length} rewards` });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`RoutineForge server running on http://localhost:${PORT}`);
  startDailyResetJob();
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
