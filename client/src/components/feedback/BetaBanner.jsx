import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, Bug, Lightbulb, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

const FEEDBACK_KEY = 'rf_feedback_history';
const FEEDBACK_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-primary-500' },
  { value: 'general', label: 'General Feedback', icon: Star, color: 'text-secondary-500' },
];

export default function BetaBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const { user, isGuest } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);

    const feedback = {
      id: crypto.randomUUID(),
      type,
      message: message.trim(),
      user: isGuest ? 'guest' : user?.username || 'unknown',
      email: isGuest ? null : user?.email,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0-beta',
    };

    // Store locally (and could POST to server/webhook later)
    try {
      const history = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
      history.push(feedback);
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(history));
    } catch {
      // localStorage full, ignore
    }

    // Try to send to server if available
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
        credentials: 'include',
      });
    } catch {
      // Server might not have this endpoint yet — that's fine, feedback is stored locally
    }

    setSending(false);
    setSubmitted(true);
    setMessage('');
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <>
      {/* Beta badge + feedback button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-[80] flex items-center gap-1.5 bg-secondary-600 hover:bg-secondary-700 text-white px-3 py-2 rounded-full shadow-lg transition-colors text-sm font-medium"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span className="hidden sm:inline">Beta Feedback</span>
      </button>

      {/* Feedback modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Beta Feedback</h2>
                  <p className="text-xs text-gray-500">Help us improve RoutineForge</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitted ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">🙏</div>
                  <p className="font-semibold text-gray-900 dark:text-white">Thanks for your feedback!</p>
                  <p className="text-sm text-gray-500 mt-1">We'll review it shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {/* Type selector */}
                  <div className="flex gap-2">
                    {FEEDBACK_TYPES.map(({ value, label, icon: Icon, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setType(value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-colors ${
                          type === value
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white ring-2 ring-secondary-500'
                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${type === value ? color : ''}`} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Message */}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      type === 'bug'
                        ? 'Describe what happened and what you expected...'
                        : type === 'feature'
                          ? 'What feature would make RoutineForge better for you?'
                          : 'Share your thoughts on the app...'
                    }
                    className="w-full h-32 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary-500 placeholder:text-gray-400"
                    required
                  />

                  {/* Device info hint */}
                  <p className="text-xs text-gray-400">
                    Device info and app version will be included automatically.
                  </p>

                  <Button type="submit" loading={sending} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send Feedback
                  </Button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
