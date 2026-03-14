import { motion } from 'framer-motion';

export default function TourSlide({ icon: Icon, iconColor, title, subtitle, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col items-center text-center px-6"
    >
      <div className={`w-24 h-24 rounded-3xl bg-${iconColor}-100 dark:bg-${iconColor}-900/30 flex items-center justify-center mb-8`}>
        <Icon className={`w-12 h-12 text-${iconColor}-500`} />
      </div>

      <h2 className="font-display text-3xl text-gray-900 dark:text-white mb-3">
        {title}
      </h2>

      {subtitle && (
        <p className="text-lg text-primary-600 dark:text-primary-400 font-medium mb-3">
          {subtitle}
        </p>
      )}

      <p className="text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
