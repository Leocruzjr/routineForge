import { motion } from 'framer-motion';
import { Clock, Flame, Play, Edit2, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DIFFICULTY_TIERS } from '../../../../shared/constants.js';

const typeColors = {
  MORNING: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20',
  BEDTIME: 'text-secondary-500 bg-secondary-50 dark:bg-secondary-900/20',
  WORKOUT: 'text-accent-500 bg-accent-50 dark:bg-accent-900/20',
  CUSTOM: 'text-success-500 bg-success-50 dark:bg-success-900/20',
};

export default function RoutineCard({ routine, completion, onStart, onEdit, onDelete }) {
  const isCompleted = completion?.completedAt != null;
  const isInProgress = completion && !completion.completedAt;
  const tier = DIFFICULTY_TIERS[routine.difficulty];

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`relative overflow-hidden ${isCompleted ? 'ring-2 ring-success-400' : ''}`}>
        {isCompleted && (
          <div className="absolute top-0 right-0 bg-success-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
            Done
          </div>
        )}

        <div className="flex items-start justify-between mb-3">
          <div>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${typeColors[routine.type]}`}>
              {routine.type}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {routine.name}
            </h3>
          </div>
        </div>

        {routine.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{routine.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            {tier?.label}
          </span>
          {routine.scheduledTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {routine.scheduledTime}
            </span>
          )}
          <span>{routine.steps?.length || 0} steps</span>
        </div>

        {isInProgress && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>In progress</span>
              <span>{completion.stepsCompleted}/{completion.stepsTotal}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${(completion.completionPct || 0) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <Button size="sm" onClick={() => onStart(routine)}>
              <Play className="w-4 h-4 mr-1" />
              {isInProgress ? 'Continue' : 'Start'}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onEdit(routine)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(routine)}>
            <Trash2 className="w-4 h-4 text-red-400" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
