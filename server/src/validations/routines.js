import Joi from 'joi';

export const createRoutineSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('MORNING', 'BEDTIME', 'WORKOUT', 'CUSTOM').required(),
  description: Joi.string().max(500).allow('', null),
  difficulty: Joi.string().valid('EASY', 'MODERATE', 'COMMITTED', 'ELITE').default('EASY'),
  scheduledTime: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null),
  daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  steps: Joi.array().items(
    Joi.object({
      title: Joi.string().min(1).max(200).required(),
      description: Joi.string().max(500).allow('', null),
      durationMinutes: Joi.number().integer().min(1).allow(null),
      icon: Joi.string().allow(null),
      isOptional: Joi.boolean().default(false),
      scienceNote: Joi.string().allow('', null),
    })
  ).default([]),
});

export const updateRoutineSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  type: Joi.string().valid('MORNING', 'BEDTIME', 'WORKOUT', 'CUSTOM'),
  description: Joi.string().max(500).allow('', null),
  difficulty: Joi.string().valid('EASY', 'MODERATE', 'COMMITTED', 'ELITE'),
  isActive: Joi.boolean(),
  scheduledTime: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null),
  daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)),
}).min(1);

export const addStepSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(500).allow('', null),
  durationMinutes: Joi.number().integer().min(1).allow(null),
  icon: Joi.string().allow(null),
  isOptional: Joi.boolean().default(false),
  scienceNote: Joi.string().allow('', null),
});

export const updateStepSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().max(500).allow('', null),
  durationMinutes: Joi.number().integer().min(1).allow(null),
  icon: Joi.string().allow(null),
  isOptional: Joi.boolean(),
  scienceNote: Joi.string().allow('', null),
}).min(1);

export const reorderStepsSchema = Joi.object({
  orderedStepIds: Joi.array().items(Joi.string()).min(1).required(),
});
