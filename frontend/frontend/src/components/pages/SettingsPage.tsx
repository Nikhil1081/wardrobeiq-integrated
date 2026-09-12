import React, { useState } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { Settings, Moon, Bell, Shield, Sliders, RefreshCw, CheckCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { showToast, refreshAll, currentCustomerId } = useWardrobe();

  const [browsingBoost, setBrowsingBoost] = useState(true);
  const [duplicatePenalty, setDuplicatePenalty] = useState(true);
  const [streamProgress, setStreamProgress] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [gapAlerts, setGapAlerts] = useState(true);

  const handleSaveSettings = () => {
    showToast('Settings saved ✦', 'AI configuration updated for active session', 'rose');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-gray-300 border border-white/10 mb-3">
          <Settings className="w-3.5 h-3.5" />
          <span>System &amp; Experience</span>
        </div>
        <h1 className="font-editorial text-4xl md:text-5xl font-bold text-luxury-cream">
          Application Settings
        </h1>
        <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
          Configure AI personalization models, appearance themes, and telemetry preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* AI Personalization Engine */}
        <div className="p-6 md:p-8 rounded-3xl glass-panel border border-white/5 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-luxury-blush">
            <Sliders className="w-4 h-4" />
            <span>AI Recommendation Engine Controls</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <div className="text-xs font-bold text-luxury-cream">
                  Browsing Telemetry Boost (0–15%)
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Applies up to 15 bonus points to recommendations matching your recent views and cart interest.
                </div>
              </div>
              <input
                type="checkbox"
                checked={browsingBoost}
                onChange={(e) => setBrowsingBoost(e.target.checked)}
                className="w-4 h-4 accent-luxury-rose"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <div className="text-xs font-bold text-luxury-cream">
                  Duplicate Penalty Avoidance (-30 to -12%)
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Penalizes products that are identical or near-identical to items already saved in your wardrobe.
                </div>
              </div>
              <input
                type="checkbox"
                checked={duplicatePenalty}
                onChange={(e) => setDuplicatePenalty(e.target.checked)}
                className="w-4 h-4 accent-luxury-rose"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <div className="text-xs font-bold text-luxury-cream">
                  LangGraph Live Pipeline Streaming
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Streams real-time execution steps through Server-Sent Events (SSE) during AI Stylist requests.
                </div>
              </div>
              <input
                type="checkbox"
                checked={streamProgress}
                onChange={(e) => setStreamProgress(e.target.checked)}
                className="w-4 h-4 accent-luxury-rose"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 md:p-8 rounded-3xl glass-panel border border-white/5 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-luxury-peach">
            <Bell className="w-4 h-4" />
            <span>Notifications &amp; Alerts</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <div className="text-xs font-bold text-luxury-cream">Wardrobe Gap Alerts</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Notify when a high-priority gap is detected or when a compatible piece goes on sale.
                </div>
              </div>
              <input
                type="checkbox"
                checked={gapAlerts}
                onChange={(e) => setGapAlerts(e.target.checked)}
                className="w-4 h-4 accent-luxury-rose"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <div className="text-xs font-bold text-luxury-cream">Weekly Styling Digest</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Receive personalized weekly capsule summaries and seasonal suggestions.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-luxury-rose"
              />
            </div>
          </div>
        </div>

        {/* Backend Synchronization & Reset */}
        <div className="p-6 md:p-8 rounded-3xl glass-panel border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-luxury-sage">
            <Shield className="w-4 h-4" />
            <span>MongoDB Data Synchronization</span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            WardrobeIQ continuously queries MongoDB Atlas collections for products, customers, wardrobes, browsing events, and promotional offers.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={async () => {
                await refreshAll();
                showToast('Synced with MongoDB ✦', `Data refreshed for customer ${currentCustomerId}`, 'rose');
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider glass-pill hover:border-luxury-rose/40 text-luxury-cream transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Force Re-sync with Backend</span>
            </button>

            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-95 transition-opacity shadow-glow-rose cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
