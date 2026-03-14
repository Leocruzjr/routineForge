import { apiResponse } from '../../../shared/constants.js';

/**
 * Global Express error handler.
 */
export function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message;

  res.status(status).json(apiResponse(false, null, message));
}
