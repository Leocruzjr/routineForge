import { Check, Sun, Droplets, Dumbbell } from 'lucide-react';

function ExampleRoutine() {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-sm">🌅</span>
        <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Morning Routine</p>
        <span className="text-[10px] text-gray-400 ml-auto">3 steps · 15 min</span>
      </div>
      <div className="space-y-1.5">
        {[
          { icon: Sun, label: 'Drink a glass of water', done: true },
          { icon: Droplets, label: '5-minute stretch', done: true },
          { icon: Dumbbell, label: 'Journal 3 gratitudes', done: false },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            {s.done ? (
              <div className="w-4 h-4 rounded bg-primary-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded border-[1.5px] border-gray-300 dark:border-gray-600 flex-shrink-0" />
            )}
            <span className={`text-[12px] ${s.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const dashboardTourSteps = [
  {
    target: 'dash-greeting',
    title: 'Your Dashboard',
    description: 'This is your home base. Everything you need for today is right here.',
  },
  {
    target: 'dash-streak-level',
    title: 'Streak & Level',
    description: 'Your current streak and XP progress. Complete routines daily to keep it alive and level up.',
  },
  {
    target: 'dash-routines',
    title: 'Today\'s Routines',
    description: 'Tap a routine to expand it, check off steps, and hit Complete. Quick and easy.',
  },
  {
    target: 'dash-weekly',
    title: 'Weekly Summary',
    description: 'Your activity this week — which days you showed up and how much XP you earned.',
  },
];

export const routinesTourSteps = [
  {
    target: 'routines-header',
    title: 'Your Routines',
    description: 'All your routines live here. Active ones are at the top, inactive ones below.',
  },
  {
    target: 'routines-actions',
    title: 'Create & Templates',
    description: 'Tap Create to build your own, or browse Templates for science-backed presets.',
  },
  {
    target: 'routines-list',
    title: 'Your Routine Checklist',
    description: 'Each routine has steps you check off. Here\'s what one looks like:',
    content: <ExampleRoutine />,
  },
];

export const progressTourSteps = [
  {
    target: 'progress-stats',
    title: 'Key Stats',
    description: 'Your streak, total completions, and level — the three numbers that matter most.',
  },
  {
    target: 'progress-weekly',
    title: 'Weekly Activity',
    description: 'See which days you were active and how much XP you earned each day this week.',
  },
  {
    target: 'progress-streak',
    title: 'Streak Tracker',
    description: 'Compare your current streak to your all-time best. Keep pushing.',
  },
];

export const resourcesTourSteps = [
  {
    target: 'resources-cta',
    title: 'Start With What Works',
    description: 'Jump straight to creating a routine built on real research.',
  },
  {
    target: 'resources-articles',
    title: 'Worth Reading',
    description: 'Curated articles on the science of habits and routines. Tap any to read the full piece.',
  },
];
