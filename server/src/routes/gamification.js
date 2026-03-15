import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getProfile,
  getBadges,
  getRewards,
  redeemReward,
  getStats,
  upgradePlan,
} from '../controllers/gamificationController.js';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.get('/badges', getBadges);
router.get('/rewards', getRewards);
router.post('/rewards/:id/redeem', redeemReward);
router.get('/stats', getStats);
router.post('/plan/upgrade', upgradePlan);

export default router;
