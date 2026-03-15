import { Router } from 'express';
import prisma from '../prisma/client.js';
import { apiResponse } from '../../../shared/constants.js';

const router = Router();

/**
 * POST /api/feedback — Store beta feedback
 * No auth required so guest users can submit too.
 */
router.post('/', async (req, res) => {
  try {
    const { type, message, user, email, userAgent, appVersion } = req.body;

    if (!message || !type) {
      return res.status(400).json(apiResponse(false, null, 'Message and type are required'));
    }

    const entry = await prisma.feedback.create({
      data: {
        type,
        message,
        username: user || 'anonymous',
        email: email || null,
        userAgent: userAgent || null,
        appVersion: appVersion || 'unknown',
      },
    });

    console.log(`[Feedback] ${type} from ${entry.username}: ${message.slice(0, 80)}`);

    res.status(201).json(apiResponse(true, { message: 'Feedback received' }));
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json(apiResponse(false, null, 'Failed to save feedback'));
  }
});

/**
 * GET /api/feedback — List all feedback (for admin review)
 */
router.get('/', async (req, res) => {
  try {
    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(apiResponse(true, { feedback, total: feedback.length }));
  } catch (err) {
    res.status(500).json(apiResponse(false, null, 'Failed to read feedback'));
  }
});

export default router;
