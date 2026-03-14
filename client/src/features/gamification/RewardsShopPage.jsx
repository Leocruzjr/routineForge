import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGamificationStore } from '@/stores/gamificationStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Zap, Check, ShoppingBag } from 'lucide-react';

const categoryLabels = {
  cosmetic: 'Cosmetic',
  'power-up': 'Power-Ups',
  unlock: 'Unlocks',
};

export default function RewardsShopPage() {
  const { rewards, availableXp, fetchRewards, redeemReward, isLoading } = useGamificationStore();
  const [redeeming, setRedeeming] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleRedeem = async (rewardId) => {
    setRedeeming(rewardId);
    try {
      await redeemReward(rewardId);
    } catch {
      // error
    } finally {
      setRedeeming(null);
    }
  };

  const filtered = filter === 'all'
    ? rewards
    : filter === 'owned'
      ? rewards.filter((r) => r.owned)
      : rewards.filter((r) => r.category === filter);

  return (
    <PageWrapper className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-gray-900 dark:text-white">Rewards Shop</h1>
          <p className="text-gray-500 mt-1">Spend your hard-earned XP</p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-xl">
          <Zap className="w-5 h-5 text-primary-500" />
          <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
            {availableXp.toLocaleString()} XP
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'owned', label: 'Owned' },
          ...Object.entries(categoryLabels).map(([key, label]) => ({ key, label })),
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {filter === 'owned' ? 'No rewards owned yet. Start shopping!' : 'No rewards in this category.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((reward, i) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`flex flex-col h-full ${reward.owned ? 'ring-2 ring-success-400' : ''}`}>
                {reward.owned && (
                  <div className="flex items-center gap-1 text-xs text-success-600 font-semibold mb-2">
                    <Check className="w-3 h-3" /> Owned
                  </div>
                )}
                <span className="inline-block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  {categoryLabels[reward.category] || reward.category}
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{reward.name}</h3>
                <p className="text-sm text-gray-500 flex-1 mb-4">{reward.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-primary-500 text-sm">
                    {reward.xpCost.toLocaleString()} XP
                  </span>
                  {!reward.owned && (
                    <Button
                      size="sm"
                      disabled={!reward.canAfford}
                      loading={redeeming === reward.id}
                      onClick={() => handleRedeem(reward.id)}
                    >
                      {reward.canAfford ? 'Redeem' : 'Need more XP'}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
