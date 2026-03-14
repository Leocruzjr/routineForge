import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoutineStore } from '@/stores/routineStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import RoutineCard from './RoutineCard';
import TemplatePickerModal from './TemplatePickerModal';
import { Plus } from 'lucide-react';

export default function RoutineListPage() {
  const navigate = useNavigate();
  const { routines, todayCompletions, fetchRoutines, fetchTodayCompletions, deleteRoutine, isLoading } = useRoutineStore();
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetchRoutines();
    fetchTodayCompletions();
  }, [fetchRoutines, fetchTodayCompletions]);

  const handleStart = (routine) => {
    navigate(`/routines/${routine.id}/run`);
  };

  const handleEdit = (routine) => {
    navigate(`/routines/${routine.id}/edit`);
  };

  const handleDelete = async (routine) => {
    if (window.confirm(`Delete "${routine.name}"? This cannot be undone.`)) {
      await deleteRoutine(routine.id);
    }
  };

  const getCompletion = (routineId) =>
    todayCompletions.find((c) => c.routineId === routineId);

  const activeRoutines = routines.filter((r) => r.isActive);
  const inactiveRoutines = routines.filter((r) => !r.isActive);

  return (
    <PageWrapper className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-gray-900 dark:text-white">My Routines</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
            Browse Templates
          </Button>
          <Button size="sm" onClick={() => navigate('/routines/new')}>
            <Plus className="w-4 h-4 mr-1" /> Create
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {activeRoutines.length === 0 && inactiveRoutines.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-4">No routines yet. Let&apos;s build one!</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowTemplates(true)}>Start from Template</Button>
                <Button variant="outline" onClick={() => navigate('/routines/new')}>Build Custom</Button>
              </div>
            </div>
          )}

          {activeRoutines.length > 0 && (
            <div className="space-y-4 mb-8">
              {activeRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  completion={getCompletion(routine.id)}
                  onStart={handleStart}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {inactiveRoutines.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Inactive
              </h2>
              <div className="space-y-4 opacity-60">
                {inactiveRoutines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    completion={getCompletion(routine.id)}
                    onStart={handleStart}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showTemplates && (
        <TemplatePickerModal onClose={() => setShowTemplates(false)} />
      )}
    </PageWrapper>
  );
}
