import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfWeek, startOfYear, getDay } from 'date-fns';

const intensityColors = [
  'bg-gray-200 dark:bg-gray-700',       // no data
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

const CELL = 10;
const GAP = 2;

export default function CalendarHeatmap({ data }) {
  const dataMap = useMemo(() => {
    const map = new Map();
    for (const d of data) {
      map.set(d.date, d.completionPct);
    }
    return map;
  }, [data]);

  const today = new Date();
  const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 1);
  const start = startOfWeek(yearAgo, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end: today });

  // Group into week columns
  const weeks = [];
  let week = [];
  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) weeks.push(week);

  // Month labels — place on the first week where the 1st of that month appears
  const monthLabels = [];
  const seenMonths = new Set();
  weeks.forEach((w, i) => {
    for (const d of w) {
      if (!d) continue;
      const m = d.getMonth();
      if (d.getDate() <= 7 && !seenMonths.has(m) && d >= yearAgo) {
        seenMonths.add(m);
        monthLabels.push({ index: i, label: format(d, 'MMM') });
        break;
      }
    }
  });

  const rowLabels = ['', 'M', '', 'W', '', 'F', ''];
  const labelW = 14;
  const totalW = labelW + weeks.length * (CELL + GAP) - GAP;
  const totalH = 7 * (CELL + GAP) - GAP + 14;

  return (
    <div>
      <svg viewBox={`0 0 ${totalW} ${totalH}`} className="block w-full h-auto">
        {/* Month labels */}
        {monthLabels.map(({ index, label }) => (
          <text
            key={label + index}
            x={labelW + index * (CELL + GAP)}
            y={9}
            className="fill-gray-400"
            fontSize={9}
            fontFamily="ui-monospace, monospace"
          >
            {label}
          </text>
        ))}

        {/* Row labels */}
        {rowLabels.map((label, i) => (
          label && (
            <text
              key={i}
              x={0}
              y={14 + i * (CELL + GAP) + CELL - 1}
              className="fill-gray-400"
              fontSize={8}
              fontFamily="ui-monospace, monospace"
            >
              {label}
            </text>
          )
        ))}

        {/* Squares */}
        {weeks.map((w, wi) =>
          w.map((day, di) => {
            if (!day || day < yearAgo || day > today) return null;

            const key = format(day, 'yyyy-MM-dd');
            const pct = dataMap.get(key);
            const intensity = getIntensity(pct);
            const x = labelW + wi * (CELL + GAP);
            const y = 14 + di * (CELL + GAP);

            return (
              <rect
                key={key}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={2}
                ry={2}
                style={{ fill: getColorValue(intensity) }}
              >
                <title>{`${format(day, 'MMM d')}: ${pct != null ? Math.round(pct * 100) + '%' : 'No activity'}`}</title>
              </rect>
            );
          })
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[9px] text-gray-400">Less</span>
        {intensityColors.map((_, i) => (
          <svg key={i} width={10} height={10}>
            <rect width={10} height={10} rx={2} ry={2} style={{ fill: getColorValue(i) }} />
          </svg>
        ))}
        <span className="text-[9px] text-gray-400">More</span>
      </div>
    </div>
  );
}

function isDark() {
  return document.documentElement.classList.contains('dark');
}

function getColorValue(intensity) {
  const light = [
    '#E5E7EB', // gray-200
    '#D1F7E0', // success-100
    '#75E7A2', // success-300
    '#4FDE86', // success-400
    '#34C759', // success-500
    '#28A745', // success-600
  ];
  if (isDark()) {
    return [
      '#374151', // gray-700
      '#0A4717', // success-900
      '#1E8735', // success-700
      '#28A745', // success-600
      '#34C759', // success-500
      '#34C759', // success-500
    ][intensity] || light[0];
  }
  return light[intensity] || light[0];
}
