import prisma from '../prisma/client.js';
import { apiResponse } from '../../../shared/constants.js';

// Science-backed routine templates — these live in code, not in the DB per-user
const TEMPLATES = [
  {
    id: 'morning-science-stack',
    name: 'The Science Stack',
    type: 'MORNING',
    description: 'A science-backed morning routine for optimal energy and focus. ~30 min.',
    difficulty: 'COMMITTED',
    scheduledTime: '07:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    steps: [
      { title: 'Wake at consistent time', order: 1, icon: 'alarm-clock', scienceNote: 'Irregular wake times disrupt circadian rhythms and reduce sleep quality. Consistency regulates your internal clock.' },
      { title: 'No snooze — feet on floor', durationMinutes: 1, order: 2, icon: 'footprints', scienceNote: 'Snoozing fragments sleep and worsens sleep inertia, causing brain fog.' },
      { title: 'Drink water (16-20 oz)', durationMinutes: 2, order: 3, icon: 'glass-water', scienceNote: 'You lose ~1 liter of water overnight. Even mild dehydration impairs attention and memory.' },
      { title: 'Get sunlight (5-10 min outside)', durationMinutes: 10, order: 4, icon: 'sun', scienceNote: 'Morning light triggers the cortisol awakening response and resets your circadian rhythm.' },
      { title: 'Move your body', description: 'Light exercise or stretching', durationMinutes: 10, order: 5, icon: 'dumbbell', scienceNote: 'Movement clears residual adenosine, releases dopamine, and raises core body temperature.' },
      { title: 'Mindful moment', description: '1-5 min meditation or journaling', durationMinutes: 5, order: 6, icon: 'brain', scienceNote: 'Activates the parasympathetic nervous system, reducing baseline cortisol.' },
      { title: 'Eat a real breakfast', order: 7, icon: 'utensils', isOptional: true, scienceNote: 'Protein and fiber sustain energy better than liquid calories.' },
    ],
  },
  {
    id: 'bedtime-wind-down',
    name: 'The Wind-Down Protocol',
    type: 'BEDTIME',
    description: 'A science-backed bedtime routine for better sleep quality. ~45 min.',
    difficulty: 'COMMITTED',
    scheduledTime: '22:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    steps: [
      { title: 'Set a "screens off" alarm', order: 1, icon: 'smartphone-off', scienceNote: 'Blue light from screens suppresses melatonin production.' },
      { title: 'Prep for tomorrow', description: 'To-do list, outfit, bag', durationMinutes: 10, order: 2, icon: 'list-checks', scienceNote: 'Writing tomorrow\'s to-do list reduces time to fall asleep.' },
      { title: 'Dim the lights', order: 3, icon: 'lamp', scienceNote: 'Reduced ambient light signals your brain to begin melatonin production.' },
      { title: 'Warm shower or bath', durationMinutes: 10, order: 4, icon: 'shower-head', scienceNote: 'Core body temperature drop afterward triggers sleep initiation.' },
      { title: 'Light stretching or breathing', durationMinutes: 5, order: 5, icon: 'wind', scienceNote: 'Activates rest-and-digest mode. Even 3-5 minutes reduces heart rate.' },
      { title: 'Read or listen to calming content', durationMinutes: 15, order: 6, icon: 'book-open', scienceNote: 'Replaces stimulating screen content and eases the transition to sleep.' },
      { title: 'Lights out at consistent time', order: 7, icon: 'moon', scienceNote: 'Consistent bedtimes reinforce your circadian rhythm.' },
    ],
  },
  {
    id: 'morning-quick-start',
    name: 'Quick Start Morning',
    type: 'MORNING',
    description: 'The minimum viable morning — just 3 steps, ~10 min. Start small.',
    difficulty: 'EASY',
    scheduledTime: '07:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    steps: [
      { title: 'Drink water (16-20 oz)', durationMinutes: 2, order: 1, icon: 'glass-water', scienceNote: 'Rehydrating first thing restores cognitive function.' },
      { title: 'Get sunlight (5 min)', durationMinutes: 5, order: 2, icon: 'sun', scienceNote: 'Morning light resets your circadian clock and boosts alertness.' },
      { title: 'Write 3 priorities', durationMinutes: 3, order: 3, icon: 'list', scienceNote: 'Identifying top tasks reduces decision fatigue.' },
    ],
  },
  {
    id: 'weekend-reset',
    name: 'Weekend Reset',
    type: 'MORNING',
    description: 'A gentler weekend routine — flexible timing, core anchors only. ~20 min.',
    difficulty: 'MODERATE',
    scheduledTime: '09:00',
    daysOfWeek: [0, 6],
    steps: [
      { title: 'Drink water', durationMinutes: 2, order: 1, icon: 'glass-water', scienceNote: 'Hydration is just as important on weekends.' },
      { title: 'Get outside for sunlight', durationMinutes: 10, order: 2, icon: 'sun', scienceNote: 'Keeping light exposure consistent prevents Monday sleep disruption.' },
      { title: 'Move your body gently', description: 'Walk, yoga, or light stretching', durationMinutes: 10, order: 3, icon: 'heart', scienceNote: 'Low-intensity movement on rest days supports recovery and mood.' },
      { title: 'Plan one enjoyable activity', durationMinutes: 2, order: 4, icon: 'smile', scienceNote: 'Intentional leisure prevents the "wasted weekend" feeling and boosts well-being.' },
    ],
  },
];

/**
 * GET /api/templates — Get all routine templates
 */
export async function getTemplates(req, res) {
  res.json(apiResponse(true, { templates: TEMPLATES }));
}

/**
 * POST /api/templates/:id/adopt — Copy a template into the user's routines
 */
export async function adoptTemplate(req, res, next) {
  try {
    const template = TEMPLATES.find((t) => t.id === req.params.id);
    if (!template) {
      return res.status(404).json(apiResponse(false, null, 'Template not found'));
    }

    const { steps, id, ...routineData } = template;

    const routine = await prisma.routine.create({
      data: {
        ...routineData,
        userId: req.user.userId,
        isDefault: true,
        steps: {
          create: steps.map((step) => ({
            title: step.title,
            description: step.description || null,
            durationMinutes: step.durationMinutes || null,
            order: step.order,
            icon: step.icon || null,
            isOptional: step.isOptional || false,
            scienceNote: step.scienceNote || null,
          })),
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    res.status(201).json(apiResponse(true, { routine }));
  } catch (err) {
    next(err);
  }
}
