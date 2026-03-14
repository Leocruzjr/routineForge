import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

/**
 * Simple bar chart showing XP earned per week.
 */
export default function WeeklyXpChart({ data }) {
  const maxXp = useMemo(() => Math.max(...data.map((d) => d.xp), 1), [data]);

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((entry, i) => {
        const heightPct = (entry.xp / maxXp) * 100;
        const weekLabel = format(parseISO(entry.week), 'MMM d');

        return (
          <div key={entry.week} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-xs font-mono text-primary-500 font-semibold">
              {entry.xp > 0 ? entry.xp : ''}
            </span>
            <motion.div
              className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg min-h-[4px]"
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(heightPct, 3)}%` }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: 'easeOut' }}
            />
            <span className="text-[10px] text-gray-400 whitespace-nowrap">
              {weekLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
