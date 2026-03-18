import { motion } from 'framer-motion';

export default function PageWrapper({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`min-h-screen bg-[#F2F2F7] dark:bg-black ${className}`}
    >
      {children}
    </motion.div>
  );
}
