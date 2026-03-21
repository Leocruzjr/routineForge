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

// Milestone titles awarded at specific levels
export const MILESTONE_TITLES = [
  { level: 1,  title: 'Rookie' },
  { level: 5,  title: 'Habit Starter' },
  { level: 10, title: 'Routine Builder' },
  { level: 15, title: 'Rhythm Keeper' },
  { level: 20, title: 'Iron Will' },
  { level: 25, title: 'Master of Consistency' },
  { level: 30, title: 'Forge Master' },
];

// Returns the current milestone title for a given level
export function getMilestoneTitle(level) {
  for (let i = MILESTONE_TITLES.length - 1; i >= 0; i--) {
    if (level >= MILESTONE_TITLES[i].level) return MILESTONE_TITLES[i].title;
  }
  return MILESTONE_TITLES[0].title;
}

// Returns the next milestone (or null if maxed out)
export function getNextMilestone(level) {
  return MILESTONE_TITLES.find((m) => m.level > level) || null;
}

// Milestone rewards — granted automatically when reaching a milestone level
export const MILESTONE_REWARDS = {
  5:  { streakShields: 1, theme: 'ocean',  label: '+1 Streak Shield & Ocean theme' },
  10: { streakShields: 2, theme: 'forest', label: '+2 Streak Shields & Forest theme' },
  15: { streakShields: 1, theme: 'sunset', label: '+1 Streak Shield & Sunset theme' },
  20: { streakShields: 2, theme: 'royal',  label: '+2 Streak Shields & Royal theme' },
  25: { streakShields: 2, theme: 'ember',  label: '+2 Streak Shields & Ember theme' },
  30: { streakShields: 3, theme: 'forge',  label: '+3 Streak Shields & Forge theme' },
};

// Accent color themes (unlocked via milestones)
export const ACCENT_THEMES = {
  default: {
    name: 'Default',
    level: 1,
    primary: { 50:'#EBF5FF',100:'#D1E9FF',200:'#A3D3FF',300:'#75BDFF',400:'#47A7FF',500:'#007AFF',600:'#0063D1',700:'#004DA3',800:'#003875',900:'#002247' },
    accent:  { 50:'#FFF8EB',100:'#FFEFD1',200:'#FFDFA3',300:'#FFCF75',400:'#FFBF47',500:'#FF9500',600:'#D17A00',700:'#A35F00',800:'#754400',900:'#472A00' },
  },
  ocean: {
    name: 'Ocean',
    level: 5,
    primary: { 50:'#E0F7FA',100:'#B2EBF2',200:'#80DEEA',300:'#4DD0E1',400:'#26C6DA',500:'#00ACC1',600:'#0097A7',700:'#00838F',800:'#006064',900:'#004D40' },
    accent:  { 50:'#E8F5E9',100:'#C8E6C9',200:'#A5D6A7',300:'#81C784',400:'#66BB6A',500:'#43A047',600:'#388E3C',700:'#2E7D32',800:'#1B5E20',900:'#0D3311' },
  },
  forest: {
    name: 'Forest',
    level: 10,
    primary: { 50:'#E8F5E9',100:'#C8E6C9',200:'#A5D6A7',300:'#81C784',400:'#66BB6A',500:'#2E7D32',600:'#27692A',700:'#1B5E20',800:'#145218',900:'#0D3311' },
    accent:  { 50:'#FFF3E0',100:'#FFE0B2',200:'#FFCC80',300:'#FFB74D',400:'#FFA726',500:'#E65100',600:'#BF4300',700:'#993600',800:'#732800',900:'#4D1B00' },
  },
  sunset: {
    name: 'Sunset',
    level: 15,
    primary: { 50:'#FFF3E0',100:'#FFE0B2',200:'#FFCC80',300:'#FFB74D',400:'#FFA726',500:'#F57C00',600:'#E65100',700:'#BF360C',800:'#8C2703',900:'#5D1A02' },
    accent:  { 50:'#FCE4EC',100:'#F8BBD0',200:'#F48FB1',300:'#F06292',400:'#EC407A',500:'#E91E63',600:'#C2185B',700:'#AD1457',800:'#880E4F',900:'#560932' },
  },
  royal: {
    name: 'Royal',
    level: 20,
    primary: { 50:'#EDE7F6',100:'#D1C4E9',200:'#B39DDB',300:'#9575CD',400:'#7E57C2',500:'#5E35B1',600:'#512DA8',700:'#4527A0',800:'#311B92',900:'#1A0F52' },
    accent:  { 50:'#E3F2FD',100:'#BBDEFB',200:'#90CAF9',300:'#64B5F6',400:'#42A5F5',500:'#1E88E5',600:'#1565C0',700:'#0D47A1',800:'#093682',900:'#052553' },
  },
  ember: {
    name: 'Ember',
    level: 25,
    primary: { 50:'#FBE9E7',100:'#FFCCBC',200:'#FFAB91',300:'#FF8A65',400:'#FF7043',500:'#E64A19',600:'#BF360C',700:'#992B0A',800:'#732008',900:'#4D1505' },
    accent:  { 50:'#FFFDE7',100:'#FFF9C4',200:'#FFF59D',300:'#FFF176',400:'#FFEE58',500:'#FDD835',600:'#F9A825',700:'#F57F17',800:'#C46412',900:'#93490D' },
  },
  forge: {
    name: 'Forge',
    level: 30,
    primary: { 50:'#FFF8E1',100:'#FFECB3',200:'#FFE082',300:'#FFD54F',400:'#FFCA28',500:'#FFB300',600:'#D49700',700:'#AA7800',800:'#805A00',900:'#553C00' },
    accent:  { 50:'#EFEBE9',100:'#D7CCC8',200:'#BCAAA4',300:'#A1887F',400:'#8D6E63',500:'#6D4C41',600:'#5D4037',700:'#4E342E',800:'#3E2723',900:'#2C1B17' },
  },
};

// Get all themes a user has unlocked based on their level
export function getUnlockedThemes(level) {
  return Object.entries(ACCENT_THEMES)
    .filter(([, theme]) => level >= theme.level)
    .map(([key, theme]) => ({ key, ...theme }));
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
