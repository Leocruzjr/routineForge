import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import UpgradeModal from '@/components/ui/UpgradeModal';
import { useState } from 'react';
import { User, Mail, Globe, Shield, Sun, Moon, Crown, Check, Lock, Palette } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { FREE_TIER_LIMITS, ACCENT_THEMES, getUnlockedThemes } from '../../../../shared/constants.js';

export default function SettingsPage() {
  const { user, isGuest, logout, isPro, upgradePlan } = useAuthStore();
  const { theme, toggleTheme, accentTheme, setAccentTheme } = useThemeStore();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const userIsPro = isPro();

  return (
    <PageWrapper className="max-w-2xl md:max-w-3xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      {/* Profile */}
      <Card className="mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isGuest ? 'Guest' : user.username}
              </p>
              <p className="text-xs text-gray-500">Username</p>
            </div>
          </div>
          {!isGuest && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
                  <p className="text-xs text-gray-500">Email</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.timezone}</p>
                  <p className="text-xs text-gray-500">Timezone</p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Appearance */}
      <Card className="mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
            <p className="text-xs text-gray-500">
              {theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-secondary-600' : 'bg-gray-300'
            }`}
            aria-label="Toggle dark mode"
          >
            <div
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
              }`}
            >
              {theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-secondary-600" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-primary-500" />
              )}
            </div>
          </button>
        </div>
      </Card>

      {/* Accent Theme */}
      <Card className="mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-500" />
          Color Theme
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(ACCENT_THEMES).map(([key, t]) => {
            const unlocked = user.level >= t.level;
            const isActive = accentTheme === key;
            return (
              <button
                key={key}
                onClick={() => unlocked && setAccentTheme(key)}
                disabled={!unlocked}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-700 ring-2 ring-primary-500'
                    : unlocked
                      ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      : 'bg-gray-50 dark:bg-gray-800 opacity-50'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-600 shadow-sm"
                  style={{ backgroundColor: t.primary[500] }}
                />
                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">{t.name}</span>
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-0.5 bg-gray-900/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" /> Lv.{t.level}
                    </div>
                  </div>
                )}
                {isActive && unlocked && (
                  <div className="absolute top-1.5 right-1.5">
                    <Check className="w-3.5 h-3.5 text-primary-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-3">Unlock new themes by reaching milestone levels.</p>
      </Card>

      {/* Subscription */}
      <Card className="mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Crown className={`w-5 h-5 ${userIsPro ? 'text-primary-500' : 'text-gray-400'}`} />
          Subscription
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                userIsPro
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {userIsPro ? 'Pro' : 'Free'}
              </span>
              {userIsPro && user.planExpiresAt && (
                <span className="text-xs text-gray-500">
                  expires {new Date(user.planExpiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {!userIsPro && (
              <p className="text-xs text-gray-500 mt-1">
                {FREE_TIER_LIMITS.maxActiveRoutines} routines, {FREE_TIER_LIMITS.statsHistoryDays}-day stats
              </p>
            )}
            {userIsPro && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3 text-success-500" /> Unlimited routines, full stats history
              </p>
            )}
          </div>
          {!userIsPro && !isGuest && (
            <Button size="sm" onClick={() => setShowUpgrade(true)}>
              <Crown className="w-3.5 h-3.5 mr-1" /> Upgrade
            </Button>
          )}
        </div>
      </Card>

      {/* Stats */}
      <Card className="mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Stats</h2>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-mono font-bold text-primary-500">{user.totalXp.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total XP</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-secondary-500">Lv.{user.level}</p>
            <p className="text-xs text-gray-500">Level</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-accent-500">{user.currentStreak}</p>
            <p className="text-xs text-gray-500">Current Streak</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-success-500">{user.streakFreezes}</p>
            <p className="text-xs text-gray-500">Streak Freezes</p>
          </div>
        </div>
      </Card>

      {/* Account */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-400" />
          Account
        </h2>
        <Button variant="outline" onClick={() => setShowLogout(true)} className="w-full">
          Sign Out
        </Button>
      </Card>

      <ConfirmModal
        isOpen={showLogout}
        title="Sign Out"
        message="Sign out?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        onConfirm={() => { setShowLogout(false); logout(); }}
        onCancel={() => setShowLogout(false)}
      />

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={async () => {
          try {
            await upgradePlan();
            setShowUpgrade(false);
          } catch {}
        }}
      />
    </PageWrapper>
  );
}
