import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate an access token for a user
 * @param {{ id: string, email: string }} user
 * @returns {string}
 */
export function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
}

/**
 * Generate a refresh token for a user
 * @param {{ id: string }} user
 * @returns {string}
 */
export function generateRefreshToken(user) {
  return jwt.sign({ userId: user.id }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
}

/**
 * Verify an access token
 * @param {string} token
 * @returns {{ userId: string, email: string }}
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

/**
 * Verify a refresh token
 * @param {string} token
 * @returns {{ userId: string }}
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
