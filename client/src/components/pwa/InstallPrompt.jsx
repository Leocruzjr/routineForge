import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import Button from '@/components/ui/Button';

const DISMISS_KEY = 'rf_install_dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === 'true');
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  // Don't show if: no prompt available, already installed, or user dismissed
  if (!deferredPrompt || installed || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[90] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-primary-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">Install RoutineForge</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">
              Add to your home screen for quick access and offline support.
            </p>
            <Button size="sm" onClick={handleInstall} className="w-full">
              Install App
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
