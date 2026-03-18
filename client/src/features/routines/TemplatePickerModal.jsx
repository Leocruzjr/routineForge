import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutineStore } from '@/stores/routineStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { X, Clock, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { DIFFICULTY_TIERS } from '../../../../shared/constants.js';

export default function TemplatePickerModal({ onClose }) {
  const { templates, fetchTemplates, adoptTemplate } = useRoutineStore();
  const [adopting, setAdopting] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleAdopt = async (templateId) => {
    setAdopting(templateId);
    try {
      await adoptTemplate(templateId);
      onClose();
    } catch {
      setAdopting(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Science-Backed Templates
              </h2>
              <p className="text-sm text-gray-500 mt-1">Pick a routine backed by research. Customize it later.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {templates.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>Loading templates...</p>
              </div>
            )}
            {templates.map((template) => {
              const tier = DIFFICULTY_TIERS[template.difficulty];
              const isExpanded = expandedId === template.id;

              return (
                <Card key={template.id} className="border-2 border-transparent hover:border-primary-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {tier?.label}
                        </span>
                        {template.scheduledTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {template.scheduledTime}
                          </span>
                        )}
                        <span>{template.steps.length} steps</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      loading={adopting === template.id}
                      onClick={() => handleAdopt(template.id)}
                    >
                      Add to My Routines
                    </Button>
                  </div>

                  <button
                    className="flex items-center gap-1 text-xs text-primary-500 mt-3 hover:underline"
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? 'Hide steps' : 'Preview steps'}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <ol className="mt-3 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                          {template.steps.map((step) => (
                            <li key={step.order} className="flex items-start gap-3 text-sm">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-xs font-bold flex items-center justify-center">
                                {step.order}
                              </span>
                              <div>
                                <span className="text-gray-900 dark:text-white font-medium">{step.title}</span>
                                {step.durationMinutes && (
                                  <span className="text-gray-400 ml-2">{step.durationMinutes} min</span>
                                )}
                                {step.scienceNote && (
                                  <p className="text-xs text-gray-400 mt-0.5">{step.scienceNote}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
