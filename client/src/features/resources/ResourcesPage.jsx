import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import { Plus, ExternalLink } from 'lucide-react';

const articles = [
  {
    title: 'How Routines Help Your Mental Health',
    source: 'Psychology Today',
    summary: 'Routines give your brain structure and predictability, which helps reduce stress and anxiety.',
    url: 'https://www.psychologytoday.com/us/blog/the-gen-y-psy/201810/the-power-of-routines-in-your-mental-health',
  },
  {
    title: 'Why Daily Routines Make You Happier',
    source: 'Mayo Clinic Press',
    summary: 'Regular meal times, sleep schedules, and social habits boost overall life satisfaction.',
    url: 'https://mcpress.mayoclinic.org/mental-health/the-mental-health-benefits-of-routine/',
  },
  {
    title: 'Healthy Habits Cut Depression Risk in Half',
    source: 'NPR',
    summary: 'People who stuck with five of seven daily habits had a 57% lower risk of depression.',
    url: 'https://www.npr.org/sections/health-shots/2023/09/19/1200223456/depression-anxiety-prevention-mental-health-healthy-habits',
  },
  {
    title: 'Surprising Benefits of Simple Daily Tasks',
    source: 'Psychology Today',
    summary: 'Even small routines lower stress and free up mental energy for the things that matter.',
    url: 'https://www.psychologytoday.com/us/blog/changepower/202208/8-surprising-psychological-benefits-of-routine-daily-tasks',
  },
  {
    title: 'How Routines Improve Sleep, Mood, and Focus',
    source: 'WebMD',
    summary: 'Predictable daily patterns help regulate your internal clock and stabilize your mood.',
    url: 'https://www.webmd.com/mental-health/psychological-benefits-of-routine',
  },
  {
    title: 'How Your Brain Builds Habits',
    source: 'Healthline',
    summary: 'Repeated behaviors create neural pathways in your brain — habits literally reshape how you think.',
    url: 'https://www.healthline.com/health/the-science-of-habit',
  },
  {
    title: 'How Habits Form and How to Change Them',
    source: 'NPR',
    summary: 'Understanding the cue-routine-reward loop lets you build better habits on purpose.',
    url: 'https://www.npr.org/2012/03/05/147192599/habits-how-they-form-and-how-to-break-them',
  },
  {
    title: '10 Habits That Actually Improve Your Health',
    source: 'Harvard Health',
    summary: 'A straightforward list of daily habits backed by research for long-term health.',
    url: 'https://www.health.harvard.edu/staying-healthy/10-habits-for-good-health',
  },
  {
    title: 'Your Brain Changes Shape When You Build Habits',
    source: 'ScienceDaily',
    summary: 'Neuroscientists found a brain pattern that gets stronger the more a habit solidifies.',
    url: 'https://www.sciencedaily.com/releases/2018/02/180208120923.htm',
  },
];

export default function ResourcesPage() {
  const navigate = useNavigate();

  return (
    <PageWrapper className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Resources</h1>

      {/* CTA to add a routine */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary-500 rounded-2xl p-6 mb-8 text-white"
      >
        <h2 className="text-xl font-bold mb-1">Start with what works</h2>
        <p className="text-sm text-white/80 mb-4">
          Add a routine built on real research — designed to help you build lasting habits.
        </p>
        <button
          onClick={() => navigate('/routines/new')}
          className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 bg-white text-primary-600 hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add a Proven Routine
        </button>
      </motion.div>

      {/* Articles */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Worth reading
      </h2>
      <div className="space-y-3">
        {articles.map((article, i) => (
          <motion.a
            key={i}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="block bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
                  {article.title}
                </p>
                <p className="text-sm text-gray-500 mb-2">{article.summary}</p>
                <span className="text-xs font-medium text-primary-500">{article.source}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-1" />
            </div>
          </motion.a>
        ))}
      </div>
    </PageWrapper>
  );
}
