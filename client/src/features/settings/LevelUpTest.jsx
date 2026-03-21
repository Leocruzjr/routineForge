import { useState } from 'react';
import LevelUpModal from '@/components/ui/LevelUpModal';
import { xpForLevel, getMilestoneTitle, MILESTONE_TITLES } from '../../../../shared/constants.js';
import Button from '@/components/ui/Button';
import PageWrapper from '@/components/layout/PageWrapper';

const TEST_LEVELS = [2, 5, 10, 15, 20, 25, 30];

export default function LevelUpTest() {
  const [levelData, setLevelData] = useState(null);

  const triggerLevelUp = (level) => {
    setLevelData(null);
    // Small delay so modal resets before re-opening
    setTimeout(() => {
      setLevelData({
        newLevel: level,
        newTotalXp: xpForLevel(level) + 20,
      });
    }, 100);
  };

  return (
    <PageWrapper className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Level Up Test</h1>
      <p className="text-sm text-gray-500 mb-6">Tap a level to preview the level-up animation.</p>

      <div className="space-y-2">
        {TEST_LEVELS.map((level) => {
          const isMilestone = MILESTONE_TITLES.some((m) => m.level === level);
          return (
            <button
              key={level}
              onClick={() => triggerLevelUp(level)}
              className="w-full flex items-center justify-between bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform"
            >
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  Level {level}
                </p>
                <p className="text-xs text-gray-400">
                  {getMilestoneTitle(level)}
                  {isMilestone && <span className="text-primary-500 ml-1">· New title!</span>}
                </p>
              </div>
              <span className="text-xs font-mono text-gray-400">{xpForLevel(level)} XP</span>
            </button>
          );
        })}
      </div>

      <LevelUpModal
        isOpen={!!levelData}
        levelData={levelData}
        onClose={() => setLevelData(null)}
      />
    </PageWrapper>
  );
}
