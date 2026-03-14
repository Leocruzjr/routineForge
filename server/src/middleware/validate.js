import { apiResponse } from '../../../shared/constants.js';

/**
 * Creates an Express middleware that validates req.body against a Joi schema.
 * @param {import('joi').Schema} schema
 */
export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      return res.status(400).json(apiResponse(false, null, messages));
    }

    req.body = value;
    next();
  };
}
