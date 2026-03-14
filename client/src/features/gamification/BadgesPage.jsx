import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGamificationStore } from '@/stores/gamificationStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import { Award, Lock } from 'lucide-react';
import { format } from 'date-fns';

const categoryLabels = {
  streak: 'Streak Badges',
  milestone: 'Milestone Badges',
  challenge: 'Challenge Badges',
  special: 'Special Badges',
};

export default function BadgesPage() {
  const { badges, fetchBadges, isLoading } = useGamificationStore();

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Group by category
  const grouped = badges.reduce((acc, badge) => {
    const cat = badge.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(badge);
    return acc;
  }, {});

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <PageWrapper className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-gray-900 dark:text-white">Badges</h1>
        <p className="text-gray-500 mt-1">
          {earnedCount} of {badges.length} earned
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        Object.entries(grouped).map(([category, categoryBadges]) => (
          <div key={category} className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {categoryLabels[category] || category}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categoryBadges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={`text-center transition-all ${
                      badge.earned
                        ? 'ring-2 ring-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                        : 'opacity-60'
                    }`}
                  >
                    <div className="flex justify-center mb-3">
                      {badge.earned ? (
                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <Award className="w-6 h-6 text-primary-500" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {badge.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                    <div className="mt-2">
                      <span className="text-xs font-mono text-primary-500">+{badge.xpReward} XP</span>
                    </div>
                    {badge.earned && badge.earnedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Earned {format(new Date(badge.earnedAt), 'MMM d, yyyy')}
                      </p>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}
    </PageWrapper>
  );
}
