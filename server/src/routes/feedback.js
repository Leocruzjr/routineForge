import { Router } from 'express';
import { apiResponse } from '../../../shared/constants.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEEDBACK_FILE = path.join(__dirname, '../../feedback.json');

const router = Router();

/**
 * POST /api/feedback — Store beta feedback
 * No auth required so guest users can submit too.
 */
router.post('/', (req, res) => {
  try {
    const { type, message, user, email, userAgent, timestamp, appVersion } = req.body;

    if (!message || !type) {
      return res.status(400).json(apiResponse(false, null, 'Message and type are required'));
    }

    const entry = {
      id: crypto.randomUUID(),
      type,
      message,
      user: user || 'anonymous',
      email: email || null,
      userAgent: userAgent || null,
      timestamp: timestamp || new Date().toISOString(),
      appVersion: appVersion || 'unknown',
    };

    // Append to feedback JSON file
    let existing = [];
    try {
      existing = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
    } catch {
      // File doesn't exist yet
    }

    existing.push(entry);
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(existing, null, 2));

    console.log(`[Feedback] ${type} from ${entry.user}: ${message.slice(0, 80)}`);

    res.status(201).json(apiResponse(true, { message: 'Feedback received' }));
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json(apiResponse(false, null, 'Failed to save feedback'));
  }
});

/**
 * GET /api/feedback — List all feedback (for admin review)
 */
router.get('/', (req, res) => {
  try {
    let existing = [];
    try {
      existing = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
    } catch {
      // No feedback yet
    }

    res.json(apiResponse(true, { feedback: existing, total: existing.length }));
  } catch (err) {
    res.status(500).json(apiResponse(false, null, 'Failed to read feedback'));
  }
});

export default router;
