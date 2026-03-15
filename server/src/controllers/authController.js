import bcrypt from 'bcrypt';
import prisma from '../prisma/client.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { apiResponse } from '../../../shared/constants.js';

const SALT_ROUNDS = 10;

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

/**
 * Set access + refresh tokens as httpOnly cookies
 */
function setAuthCookies(res, user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie('accessToken', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Strip sensitive fields from user object before sending to client
 */
function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { email, username, password, timezone } = req.body;

    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      return res.status(409).json(apiResponse(false, null, `A user with that ${field} already exists`));
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { email, username, passwordHash, timezone },
    });

    setAuthCookies(res, user);
    res.status(201).json(apiResponse(true, { user: sanitizeUser(user) }));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json(apiResponse(false, null, 'Invalid email or password'));
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json(apiResponse(false, null, 'Invalid email or password'));
    }

    setAuthCookies(res, user);
    res.json(apiResponse(true, { user: sanitizeUser(user) }));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  res.json(apiResponse(true, { message: 'Logged out' }));
}

/**
 * POST /api/auth/refresh
 */
export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json(apiResponse(false, null, 'No refresh token'));
    }

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      return res.status(401).json(apiResponse(false, null, 'User not found'));
    }

    setAuthCookies(res, user);
    res.json(apiResponse(true, { user: sanitizeUser(user) }));
  } catch {
    return res.status(401).json(apiResponse(false, null, 'Invalid refresh token'));
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json(apiResponse(false, null, 'User not found'));
    }

    res.json(apiResponse(true, { user: sanitizeUser(user) }));
  } catch (err) {
    next(err);
  }
}
