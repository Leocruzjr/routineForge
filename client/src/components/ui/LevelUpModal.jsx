import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { Trophy, Zap, Shield, Palette } from 'lucide-react';
import { xpForLevel, getMilestoneTitle, MILESTONE_TITLES, MILESTONE_REWARDS, ACCENT_THEMES } from '../../../../shared/constants.js';

export default function LevelUpModal({ isOpen, levelData, onClose }) {
  const [barFilled, setBarFilled] = useState(false);
  const [showLevel, setShowLevel] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setBarFilled(false);
      setShowLevel(false);
      return;
    }
    // Stagger the animations
    const t1 = setTimeout(() => setBarFilled(true), 400);
    const t2 = setTimeout(() => setShowLevel(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isOpen]);

  if (!isOpen || !levelData) return null;

  const { newLevel, newTotalXp } = levelData;
  const prevLevel = newLevel - 1;
  const currentLevelXp = xpForLevel(newLevel);
  const nextLevelXp = xpForLevel(newLevel + 1);
  const progressXp = newTotalXp - currentLevelXp;
  const neededXp = nextLevelXp - currentLevelXp;
  const newProgressPct = neededXp > 0 ? Math.min((progressXp / neededXp) * 100, 100) : 0;
  const milestoneTitle = getMilestoneTitle(newLevel);
  const isNewMilestone = MILESTONE_TITLES.some((m) => m.level === newLevel);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, delay: 0.1 }}
          className="relative bg-white dark:bg-[#1C1C1E] rounded-2xl max-w-sm w-full p-8 shadow-2xl text-center overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent pointer-events-none" />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 12 }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-primary-500" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-2xl text-gray-900 dark:text-white mb-2"
          >
            Level Up!
          </motion.h2>

          {/* Animated level transition */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: showLevel ? 0.4 : 1 }}
                className="text-lg font-mono font-bold text-gray-400"
              >
                Lv.{prevLevel}
              </motion.span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: showLevel ? 1 : 0 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                <Zap className="w-5 h-5 text-primary-500" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={showLevel ? { opacity: 1, scale: 1 } : {}}
                transition={{ type: 'spring', damping: 10 }}
                className="text-3xl font-mono font-bold text-primary-500"
              >
                Lv.{newLevel}
              </motion.span>
            </div>

            {/* Milestone title */}
            {isNewMilestone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={showLevel ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                className="mb-4"
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {milestoneTitle}
                </span>
              </motion.div>
            )}

            {/* Animated XP bar — fills to 100% then resets to new progress */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-primary-400 to-primary-600 h-3 rounded-full"
                initial={{ width: '85%' }}
                animate={{
                  width: barFilled
                    ? showLevel ? `${newProgressPct}%` : '100%'
                    : '85%',
                }}
                transition={{
                  duration: barFilled && !showLevel ? 0.6 : 0.4,
                  ease: 'easeOut',
                }}
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: showLevel ? 1 : 0 }}
              className="text-xs font-mono text-gray-500 mt-1.5"
            >
              {progressXp} / {neededXp} XP to Level {newLevel + 1}
            </motion.p>
          </div>

          {/* Milestone rewards */}
          {isNewMilestone && MILESTONE_REWARDS[newLevel] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={showLevel ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="mb-6 space-y-2"
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rewards unlocked</p>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-accent-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    +{MILESTONE_REWARDS[newLevel].streakShields} Streak Shield{MILESTONE_REWARDS[newLevel].streakShields > 1 ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-gray-400">Protects your streak for a missed day</p>
                </div>
              </div>
              {MILESTONE_REWARDS[newLevel].theme && (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ACCENT_THEMES[MILESTONE_REWARDS[newLevel].theme]?.primary[500] + '20' }}>
                    <Palette className="w-4 h-4" style={{ color: ACCENT_THEMES[MILESTONE_REWARDS[newLevel].theme]?.primary[500] }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {ACCENT_THEMES[MILESTONE_REWARDS[newLevel].theme]?.name} Theme
                    </p>
                    <p className="text-[11px] text-gray-400">New color scheme in Settings</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: showLevel ? 1 : 0, y: showLevel ? 0 : 10 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <Button className="w-full" onClick={onClose}>
              Continue
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
