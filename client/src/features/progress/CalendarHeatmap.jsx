import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

const intensityColors = [
  'bg-gray-100 dark:bg-gray-800',       // no data
  'bg-success-100 dark:bg-success-900',  // 1-25%
  'bg-success-300 dark:bg-success-700',  // 26-50%
  'bg-success-400 dark:bg-success-600',  // 51-75%
  'bg-success-500',                       // 76-99%
  'bg-success-600 dark:bg-success-500',  // 100%
];

function getIntensity(pct) {
  if (pct == null || pct === 0) return 0;
  if (pct <= 0.25) return 1;
  if (pct <= 0.5) return 2;
  if (pct <= 0.75) return 3;
  if (pct < 1) return 4;
  return 5;
}

/**
 * Monthly calendar heatmap for routine completions.
 * Shows the current month as a grid with day numbers on the left.
 */
export default function CalendarHeatmap({ data }) {
  const dataMap = useMemo(() => {
    const map = new Map();
    for (const d of data) {
      map.set(d.date, d.completionPct);
    }
    return map;
  }, [data]);

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = days.length;

  // Build a 7-column grid (Sun–Sat), rows = weeks
  const firstDayOfWeek = getDay(monthStart); // 0=Sun
  const weeks = [];
  let currentWeek = Array(firstDayOfWeek).fill(null); // pad start

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  // Pad last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const weekdayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Day labels on the left — show 1, 15, and last day of month
  const labelDays = new Set([1, 15, totalDays]);

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-[28px_repeat(7,1fr)] gap-1 mb-1">
        <div />
        {weekdayHeaders.map((d, i) => (
          <div key={i} className="text-center">
            <span className="text-[10px] font-medium text-gray-400">{d}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, wi) => {
        // Find the first real day in this week to determine label
        const firstDayInWeek = week.find((d) => d !== null);
        const lastDayInWeek = [...week].reverse().find((d) => d !== null);
        const dayNum = firstDayInWeek ? firstDayInWeek.getDate() : null;
        const lastDayNum = lastDayInWeek ? lastDayInWeek.getDate() : null;

        // Show label if this row contains day 1, 15, or last day
        let rowLabel = '';
        if (dayNum !== null) {
          for (const ld of labelDays) {
            if (dayNum <= ld && lastDayNum >= ld) {
              rowLabel = String(ld);
              break;
            }
          }
        }

        return (
          <div key={wi} className="grid grid-cols-[28px_repeat(7,1fr)] gap-1 mb-1">
            <div className="flex items-center justify-end pr-1">
              <span className="text-[10px] font-mono text-gray-400">{rowLabel}</span>
            </div>
            {week.map((day, di) => {
              if (!day) {
                return <div key={`empty-${wi}-${di}`} className="aspect-square" />;
              }

              const key = format(day, 'yyyy-MM-dd');
              const pct = dataMap.get(key);
              const intensity = getIntensity(pct);
              const isToday = format(today, 'yyyy-MM-dd') === key;
              const isFuture = day > today;
              const tooltip = `${format(day, 'MMM d')}: ${pct != null ? Math.round(pct * 100) + '%' : 'No activity'}`;

              return (
                <div
                  key={key}
                  title={tooltip}
                  className={`aspect-square rounded-md ${
                    isFuture
                      ? 'bg-gray-50 dark:bg-gray-800/40'
                      : intensityColors[intensity]
                  } ${
                    isToday ? 'ring-2 ring-primary-500 ring-offset-1 ring-offset-gray-50 dark:ring-offset-gray-800' : ''
                  } transition-colors cursor-default`}
                />
              );
            })}
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-gray-400">Less</span>
        {intensityColors.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span className="text-[10px] text-gray-400">More</span>
      </div>
    </div>
  );
}
