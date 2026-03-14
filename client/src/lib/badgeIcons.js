import {
  Flame,
  Brain,
  Crown,
  Trophy,
  Shield,
  Star,
  Footprints,
  Wrench,
  Sunrise,
  Moon,
  CheckCircle,
  Layers,
  Zap,
  AlarmClock,
  RefreshCw,
} from 'lucide-react';

/**
 * Maps badge icon name strings (stored in DB) to Lucide React components.
 */
const badgeIconMap = {
  flame: Flame,
  brain: Brain,
  crown: Crown,
  trophy: Trophy,
  shield: Shield,
  star: Star,
  footprints: Footprints,
  wrench: Wrench,
  sunrise: Sunrise,
  moon: Moon,
  'check-circle': CheckCircle,
  layers: Layers,
  zap: Zap,
  'alarm-clock': AlarmClock,
  'refresh-cw': RefreshCw,
};

/**
 * Get the Lucide icon component for a badge icon string.
 * Falls back to Trophy if the icon name isn't recognized.
 * @param {string} iconName
 * @returns {import('lucide-react').LucideIcon}
 */
export function getBadgeIcon(iconName) {
  return badgeIconMap[iconName] || Trophy;
}
