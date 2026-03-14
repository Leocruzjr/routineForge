import { useMemo } from 'react';
import { format, eachDayOfInterval, subDays, startOfWeek } from 'date-fns';

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
 * GitHub-style contribution heatmap for routine completions.
 * Shows last 90 days.
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
  const startDate = startOfWeek(subDays(today, 89));
  const days = eachDayOfInterval({ start: startDate, end: today });

  // Group into weeks (columns)
  const weeks = [];
  let currentWeek = [];
  for (const day of days) {
    if (day.getDay() === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="w-8 h-3 flex items-center">
              <span className="text-[10px] text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {/* Pad the first week if it doesn't start on Sunday */}
            {wi === 0 && week[0].getDay() > 0 &&
              Array.from({ length: week[0].getDay() }).map((_, i) => (
                <div key={`pad-${i}`} className="w-3 h-3" />
              ))
            }
            {week.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const pct = dataMap.get(key);
              const intensity = getIntensity(pct);
              const label = `${format(day, 'MMM d')}: ${pct != null ? Math.round(pct * 100) + '%' : 'No data'}`;

              return (
                <div
                  key={key}
                  title={label}
                  className={`w-3 h-3 rounded-sm ${intensityColors[intensity]} transition-colors cursor-default`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 justify-end">
        <span className="text-[10px] text-gray-400 mr-1">Less</span>
        {intensityColors.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span className="text-[10px] text-gray-400 ml-1">More</span>
      </div>
    </div>
  );
}
