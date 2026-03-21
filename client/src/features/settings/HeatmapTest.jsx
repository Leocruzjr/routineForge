import { format, eachDayOfInterval, startOfYear } from 'date-fns';
import CalendarHeatmap from '@/features/progress/CalendarHeatmap';
import PageWrapper from '@/components/layout/PageWrapper';

function generateMockData() {
  const today = new Date();
  const jan1 = startOfYear(today);
  const days = eachDayOfInterval({ start: jan1, end: today });

  return days.map((day, i) => {
    const progress = i / days.length;
    const rand = Math.random();
    let pct = 0;
    if (rand < progress * 0.7) {
      const base = 0.3 + progress * 0.7;
      pct = Math.min(base + (Math.random() - 0.3) * 0.4, 1);
      pct = Math.max(pct, 0.1);
    }
    return {
      date: format(day, 'yyyy-MM-dd'),
      completionPct: Math.round(pct * 100) / 100,
      xpEarned: Math.floor(pct * 200),
    };
  }).filter((d) => d.completionPct > 0);
}

export default function HeatmapTest() {
  const mockData = generateMockData();

  return (
    <PageWrapper className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Heatmap Test</h1>
      <p className="text-sm text-gray-500 mb-6">
        Year view starting Jan 1 — simulated activity that builds over time.
      </p>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
        <CalendarHeatmap data={mockData} />
      </div>
    </PageWrapper>
  );
}
