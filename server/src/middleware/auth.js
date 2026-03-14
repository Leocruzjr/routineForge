import { verifyAccessToken } from '../utils/jwt.js';
import { apiResponse } from '../../../shared/constants.js';

/**
 * Express middleware that verifies the access token from httpOnly cookie.
 * Attaches userId and email to req.user on success.
 */
export function authenticate(req, res, next) {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json(apiResponse(false, null, 'Authentication required'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    return res.status(401).json(apiResponse(false, null, 'Invalid or expired token'));
  }
}
