import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays } from 'date-fns';

/**
 * Bar chart showing XP earned each day of the current week (Mon–Sun).
 * Accepts heatmap data with { date, xpEarned } entries.
 */
export default function WeeklyXpChart({ data }) {
  const { days, totalXp, maxXp } = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const dayEntries = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const key = format(date, 'yyyy-MM-dd');
      const entry = data?.find((d) => d.date === key);
      return {
        label: format(date, 'EEE'),
        dateLabel: format(date, 'M/d'),
        xp: entry?.xpEarned || 0,
      };
    });
    const total = dayEntries.reduce((sum, d) => sum + d.xp, 0);
    const max = Math.max(...dayEntries.map((d) => d.xp), 1);
    return { days: dayEntries, totalXp: total, maxXp: max };
  }, [data]);

  return (
    <div>
      <div className="flex items-end gap-2 h-40 mb-2">
        {days.map((day, i) => {
          const heightPct = (day.xp / maxXp) * 100;
          return (
            <div key={day.dateLabel} className="flex flex-col items-center flex-1 gap-1">
              <span className="text-xs font-mono text-primary-500 font-semibold">
                {day.xp > 0 ? day.xp : ''}
              </span>
              <motion.div
                className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg min-h-[4px]"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPct, 3)}%` }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
              />
              <div className="text-center">
                <span className="text-[10px] font-medium text-gray-500">{day.label}</span>
                <span className="block text-[9px] text-gray-400">{day.dateLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-700">
        <span className="text-sm font-mono font-bold text-primary-500">{totalXp} XP</span>
        <span className="text-xs text-gray-400 ml-2">this week</span>
      </div>
    </div>
  );
}
