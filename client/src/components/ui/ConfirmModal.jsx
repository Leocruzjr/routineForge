import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, variant = 'danger' }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
            <Button
              className={`flex-1 ${variant === 'danger' ? '!bg-red-500 hover:!bg-red-600' : ''}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
