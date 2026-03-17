import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGamificationStore } from '@/stores/gamificationStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import { Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { getBadgeIcon } from '@/lib/badgeIcons';

const earnedColors = {
  streak: { bg: 'bg-accent-100 dark:bg-accent-900/30', ring: 'ring-accent-400', card: 'bg-accent-50/50 dark:bg-accent-900/10', icon: 'text-accent-500' },
  milestone: { bg: 'bg-primary-100 dark:bg-primary-900/30', ring: 'ring-primary-400', card: 'bg-primary-50/50 dark:bg-primary-900/10', icon: 'text-primary-500' },
  challenge: { bg: 'bg-success-100 dark:bg-success-900/30', ring: 'ring-success-400', card: 'bg-success-50/50 dark:bg-success-900/10', icon: 'text-success-500' },
  special: { bg: 'bg-secondary-100 dark:bg-secondary-900/30', ring: 'ring-secondary-400', card: 'bg-secondary-50/50 dark:bg-secondary-900/10', icon: 'text-secondary-500' },
};

const categoryLabels = {
  earned: 'Earned Badges',
  streak: 'Streak Badges',
  milestone: 'Milestone Badges',
  challenge: 'Challenge Badges',
  special: 'Special Badges',
};

function BadgeCard({ badge, colors }) {
  const Icon = getBadgeIcon(badge.icon);
  return (
    <Card className={`text-center transition-all ${badge.earned ? `ring-2 ${colors.ring} ${colors.card}` : 'opacity-60'}`}>
      <div className="flex justify-center mb-3">
        {badge.earned ? (
          <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{badge.name}</h3>
      <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
      <div className="mt-2">
        <span className="text-xs font-mono text-primary-500">+{badge.xpReward} XP</span>
      </div>
      {badge.earned && badge.earnedAt && (
        <p className="text-xs text-gray-400 mt-1">
          Earned {format(new Date(badge.earnedAt), 'MM/dd/yy')}
        </p>
      )}
    </Card>
  );
}

function BadgeSection({ title, badges, colors, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const previewCount = 3;
  const showViewAll = badges.length > previewCount;
  const displayed = expanded ? badges : badges.slice(0, previewCount);

  return (
    <div className="mb-8">
      <button
        onClick={() => showViewAll && setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-4"
      >
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {title} ({badges.length})
        </h2>
        {showViewAll && (
          <span className="flex items-center gap-1 text-xs text-primary-500 font-medium">
            {expanded ? 'Show less' : 'View all'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        )}
      </button>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayed.map((badge, i) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <BadgeCard badge={badge} colors={colors} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function BadgesPage() {
  const { badges, fetchBadges, isLoading } = useGamificationStore();

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const earnedBadges = badges.filter((b) => b.earned);
  const earnedCount = earnedBadges.length;

  const grouped = badges.reduce((acc, badge) => {
    const cat = badge.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(badge);
    return acc;
  }, {});

  return (
    <PageWrapper className="max-w-4xl mx-auto px-4 py-8 pb-24">
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
        <>
          {earnedBadges.length > 0 && (
            <BadgeSection
              title={categoryLabels.earned}
              badges={earnedBadges}
              colors={earnedColors.milestone}
              defaultExpanded={false}
            />
          )}

          {Object.entries(grouped).map(([category, categoryBadges]) => {
            const colors = earnedColors[category] || earnedColors.milestone;
            return (
              <BadgeSection
                key={category}
                title={categoryLabels[category] || category}
                badges={categoryBadges}
                colors={colors}
              />
            );
          })}
        </>
      )}
    </PageWrapper>
  );
}
