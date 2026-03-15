// Routine types
export const ROUTINE_TYPES = {
  MORNING: 'MORNING',
  BEDTIME: 'BEDTIME',
  WORKOUT: 'WORKOUT',
  CUSTOM: 'CUSTOM',
};

// Difficulty tiers with XP multipliers
export const DIFFICULTY_TIERS = {
  EASY: { label: 'Easy', multiplier: 1.0, description: '1-3 steps, < 15 min' },
  MODERATE: { label: 'Moderate', multiplier: 1.3, description: '4-6 steps, 15-30 min' },
  COMMITTED: { label: 'Committed', multiplier: 1.6, description: '7-10 steps, 30-60 min' },
  ELITE: { label: 'Elite', multiplier: 2.0, description: '10+ steps, 60+ min' },
};

// XP constants
export const XP = {
  STEP_COMPLETE: 10,
  OPTIONAL_STEP_COMPLETE: 15,
  FULL_ROUTINE_BONUS: 50,
  ON_TIME_BONUS: 25,
  DAY_STARTER_BONUS: 20,
  STREAK_MULTIPLIER_PER_DAY: 0.1,
  STREAK_MULTIPLIER_CAP: 2.0,
  WEEKEND_MULTIPLIER: 1.2,
};

// Level formula: XP_required = 100 * (level ^ 1.5)
export function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Streak thresholds for badges
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100, 365];

// Minimum completion percentage for a streak day
export const STREAK_COMPLETION_THRESHOLD = 0.7;

// Badge categories
export const BADGE_CATEGORIES = {
  STREAK: 'streak',
  MILESTONE: 'milestone',
  CHALLENGE: 'challenge',
  SPECIAL: 'special',
};

// Reward categories
export const REWARD_CATEGORIES = {
  COSMETIC: 'cosmetic',
  POWER_UP: 'power-up',
  UNLOCK: 'unlock',
};

// Plan tiers
export const PLANS = {
  FREE: 'FREE',
  PRO: 'PRO',
};

export const FREE_TIER_LIMITS = {
  maxActiveRoutines: 3,
  statsHistoryDays: 7,
  heatmapDays: 7,
};

export const PRO_FEATURES = {
  unlimitedRoutines: true,
  fullStatsHistory: true,
  fullHeatmap: true,        // 90-day heatmap
  detailedAnalytics: true,
  premiumBadges: true,
  exportData: true,
};

// API response envelope helper
export function apiResponse(success, data = null, error = null) {
  return { success, data, error };
}
