import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Flame, Mail, Smartphone, Chrome } from 'lucide-react';

export default function SignupPrompt() {
  const navigate = useNavigate();
  const { loginAsGuest } = useAuthStore();

  const handleGuest = () => {
    loginAsGuest();
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center px-4 bg-surface-light dark:bg-surface-dark"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Flame className="w-12 h-12 text-primary-500 mx-auto mb-3" />
          <h1 className="font-display text-3xl text-gray-900 dark:text-white mb-2">
            Ready to begin?
          </h1>
          <p className="text-gray-500">
            Create an account to sync your routines across devices, or continue as a guest.
          </p>
        </div>

        <Card className="space-y-3">
          {/* Google */}
          <button
            className="w-full flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800"
            onClick={() => navigate('/register')}
          >
            <Chrome className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Continue with Google</span>
            <span className="ml-auto text-xs text-gray-400">Coming soon</span>
          </button>

          {/* Apple */}
          <button
            className="w-full flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800"
            onClick={() => navigate('/register')}
          >
            <Smartphone className="w-5 h-5 text-gray-900 dark:text-white" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Continue with Apple</span>
            <span className="ml-auto text-xs text-gray-400">Coming soon</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Email */}
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate('/register')}
          >
            <Mail className="w-4 h-4 mr-2" />
            Sign up with Email
          </Button>

          {/* Guest */}
          <button
            onClick={handleGuest}
            className="w-full text-center text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 py-2 transition-colors"
          >
            Continue as Guest
          </button>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          Guest data is stored locally and won&apos;t sync across devices.
        </p>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-primary-600 hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </motion.div>
  );
}
