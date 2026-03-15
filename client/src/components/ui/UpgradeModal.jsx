import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Check, Infinity, BarChart3, Shield, Download } from 'lucide-react';
import Button from './Button';

const PRO_PERKS = [
  { icon: Infinity, text: 'Unlimited active routines' },
  { icon: BarChart3, text: 'Full 90-day stats & heatmap' },
  { icon: Shield, text: 'Premium badges & rewards' },
  { icon: Download, text: 'Export your progress data' },
];

export default function UpgradeModal({ isOpen, onClose, onUpgrade, reason }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-500 to-secondary-600 p-6 text-center text-white relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <Crown className="w-12 h-12 mx-auto mb-3 drop-shadow-lg" />
            <h2 className="text-2xl font-display font-bold">Upgrade to Pro</h2>
            <p className="text-sm text-white/80 mt-1">Unlock the full RoutineForge experience</p>
          </div>

          <div className="p-6">
            {/* Reason */}
            {reason && (
              <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm p-3 rounded-xl mb-5">
                {reason}
              </div>
            )}

            {/* Perks */}
            <div className="space-y-3 mb-6">
              {PRO_PERKS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary-500" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="text-center mb-5">
              <span className="text-4xl font-bold font-mono text-gray-900 dark:text-white">$4.99</span>
              <span className="text-gray-500 text-sm">/month</span>
            </div>

            {/* CTA */}
            <Button className="w-full mb-3" onClick={onUpgrade}>
              <Crown className="w-4 h-4 mr-2" />
              Start Pro Trial
            </Button>
            <button
              onClick={onClose}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
