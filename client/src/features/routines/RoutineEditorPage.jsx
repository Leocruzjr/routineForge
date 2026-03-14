import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRoutineStore } from '@/stores/routineStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus, GripVertical, Trash2, ArrowLeft, Info } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ROUTINE_TYPES, DIFFICULTY_TIERS } from '../../../../shared/constants.js';

function SortableStep({ step, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id || step._tempId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
    >
      <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
      </button>
      <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{step.title}</p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {step.durationMinutes && <span>{step.durationMinutes} min</span>}
          {step.isOptional && <span className="text-primary-500">Optional</span>}
        </div>
      </div>
      <button type="button" onClick={onRemove} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
        <Trash2 className="w-4 h-4 text-red-400" />
      </button>
    </div>
  );
}

const routineSchema = yup.object({
  name: yup.string().min(1).max(100).required('Name is required'),
  type: yup.string().oneOf(Object.keys(ROUTINE_TYPES)).required(),
  description: yup.string().max(500).nullable(),
  difficulty: yup.string().oneOf(Object.keys(DIFFICULTY_TIERS)).required(),
  scheduledTime: yup.string().nullable(),
});

export default function RoutineEditorPage() {
  const { id } = useParams();
  const isEditing = id !== 'new' && id != null;
  const navigate = useNavigate();
  const { routines, createRoutine, updateRoutine, addStep, updateStep, deleteStep, reorderSteps } = useRoutineStore();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const existing = isEditing ? routines.find((r) => r.id === id) : null;

  const [steps, setSteps] = useState([]);
  const [newStep, setNewStep] = useState({ title: '', description: '', durationMinutes: '', isOptional: false });
  const [saving, setSaving] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState([0, 1, 2, 3, 4, 5, 6]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(routineSchema),
    defaultValues: {
      name: '',
      type: 'MORNING',
      description: '',
      difficulty: 'EASY',
      scheduledTime: '07:00',
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        type: existing.type,
        description: existing.description || '',
        difficulty: existing.difficulty,
        scheduledTime: existing.scheduledTime || '',
      });
      setSteps(existing.steps || []);
      setDaysOfWeek(existing.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
    }
  }, [existing, reset]);

  const toggleDay = (day) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleAddStep = () => {
    if (!newStep.title.trim()) return;
    const step = {
      ...newStep,
      durationMinutes: newStep.durationMinutes ? parseInt(newStep.durationMinutes) : null,
      order: steps.length + 1,
      _tempId: Date.now(),
    };
    setSteps([...steps, step]);
    setNewStep({ title: '', description: '', durationMinutes: '', isOptional: false });
  };

  const handleRemoveStep = async (index) => {
    const step = steps[index];
    if (isEditing && step.id) {
      await deleteStep(id, step.id);
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => (s.id || s._tempId) === active.id);
    const newIndex = steps.findIndex((s) => (s.id || s._tempId) === over.id);
    const reordered = arrayMove(steps, oldIndex, newIndex);
    setSteps(reordered);

    // Persist reorder for existing routines with saved steps
    if (isEditing && reordered.every((s) => s.id)) {
      reorderSteps(id, reordered.map((s) => s.id));
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (isEditing) {
        await updateRoutine(id, { ...data, daysOfWeek });
        // Add any new steps (ones without an id)
        for (const step of steps) {
          if (!step.id) {
            await addStep(id, {
              title: step.title,
              description: step.description || null,
              durationMinutes: step.durationMinutes || null,
              isOptional: step.isOptional,
            });
          }
        }
      } else {
        await createRoutine({
          ...data,
          daysOfWeek,
          steps: steps.map(({ _tempId, ...s }) => ({
            title: s.title,
            description: s.description || null,
            durationMinutes: s.durationMinutes || null,
            isOptional: s.isOptional,
          })),
        });
      }
      navigate('/routines');
    } catch {
      // error handling
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/routines')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to routines
      </button>

      <h1 className="font-display text-3xl text-gray-900 dark:text-white mb-6">
        {isEditing ? 'Edit Routine' : 'Create Routine'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Routine details */}
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Details</h2>
          <div className="space-y-4">
            <Input label="Name" placeholder="My Morning Routine" error={errors.name?.message} {...register('name')} />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                {...register('type')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(ROUTINE_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val}</option>
                ))}
              </select>
            </div>

            <Input label="Description (optional)" placeholder="A brief description..." {...register('description')} />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
              <select
                {...register('difficulty')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(DIFFICULTY_TIERS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label} — {val.description}</option>
                ))}
              </select>
            </div>

            <Input label="Scheduled Time" type="time" {...register('scheduledTime')} />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Days of Week</label>
              <div className="flex gap-2">
                {dayLabels.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                      daysOfWeek.includes(i)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Steps */}
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Steps ({steps.length})
          </h2>

          {steps.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={steps.map((s) => s.id || s._tempId)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 mb-4">
                  {steps.map((step, index) => (
                    <SortableStep
                      key={step.id || step._tempId}
                      step={step}
                      index={index}
                      onRemove={() => handleRemoveStep(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Add step form */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add a step</p>
            <div className="space-y-3">
              <Input
                placeholder="Step title (e.g., Drink water)"
                value={newStep.title}
                onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
              />
              <div className="flex gap-3">
                <Input
                  placeholder="Duration (min)"
                  type="number"
                  className="w-32"
                  value={newStep.durationMinutes}
                  onChange={(e) => setNewStep({ ...newStep, durationMinutes: e.target.value })}
                />
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={newStep.isOptional}
                    onChange={(e) => setNewStep({ ...newStep, isOptional: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Optional
                </label>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddStep}>
                <Plus className="w-4 h-4 mr-1" /> Add Step
              </Button>
            </div>
          </div>

          {steps.length === 0 && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <Info className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-primary-700 dark:text-primary-400">
                Start with just 1 step if you want. The biggest predictor of habit formation is starting small.
              </p>
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={saving} className="flex-1">
            {isEditing ? 'Save Changes' : 'Create Routine'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/routines')}>
            Cancel
          </Button>
        </div>
      </form>
    </PageWrapper>
  );
}
