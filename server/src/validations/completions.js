import Joi from 'joi';

export const startCompletionSchema = Joi.object({
  routineId: Joi.string().required(),
});

export const completeStepSchema = Joi.object({
  stepId: Joi.string().required(),
  completed: Joi.boolean().default(false),
  skipped: Joi.boolean().default(false),
  timeSpentMs: Joi.number().integer().min(0).allow(null),
});
