import React, { useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Crown,
  ExternalLink,
  Flame,
  Globe,
  HardDrive,
  Laptop,
  LogOut,
  Moon,
  Phone,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Trophy,
  User,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import type { GamerUser } from '../lib/authStore';
import type { HardwareTelemetry } from '../hooks/useDeviceTelemetry';
import type { PlatformTarget, SensitivityConfig } from '../lib/optimizer';
import { triggerHaptic } from '../lib/haptics';
import { ConfigVaultView } from './ConfigVaultView';
import { SecurityGuardView } from './SecurityGuardView';
import { SlidingSegmentedControl } from './SlidingSegmentedControl';

interface ProfileViewProps {
  currentUser: GamerUser | null;
  telemetry: HardwareTelemetry;
  platform: PlatformTarget;
  onOpenAuthModal: () => void;
  onOpenAdminConsole: () => void;
  configs?: SensitivityConfig[];
  activeConfig?: SensitivityConfig;
  presets?: SensitivityConfig[];
  targetFps?: number;
  onLoadConfig?: (config: SensitivityConfig) => void;
  onDeleteCustom?: (id: string) => void;
  onImportVerifiedConfig?: (config: SensitivityConfig) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  telemetry,
  platform,
  onOpenAuthModal,
  onOpenAdminConsole,
  configs = [],
  activeConfig,
  presets = [],
  targetFps = 60,
  onLoadConfig,
  onDeleteCustom,
  onImportVerifiedConfig,
}) => {
  const [subSection, setSubSection] = useState<'profile' | 'vault' | 'security'>('profile');
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const username = currentUser?.username || 'PASIYA';
  const uid = currentUser?.freeFireUid || '689234150';

  const toggleSound = () => {
    triggerHaptic('action');
    setSoundEffectsEnabled((prev) => !prev);
  };

  const toggleHapticFeedback = () => {
    triggerHaptic('action');
    setHapticEnabled((prev) => !prev);
  };

  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      {/* Sub-tab Navigation */}
      <SlidingSegmentedControl<'profile' | 'vault' | 'security'>
        ariaLabel="Profile sections"
        variant="crimson"
        layout="scrollable"
        className="max-w-full"
        buttonClassName="min-h-[38px] font-bold"
        value={subSection}
        onChange={(val) => {
          triggerHaptic('tap');
          setSubSection(val);
        }}
        options={[
          {
            id: 'profile',
            label: (
              <>
                <User className="w-3.5 h-3.5" aria-hidden="true" />
                VIP Profile &amp; License
              </>
            ),
          },
          {
            id: 'vault',
            label: (
              <>
                <Archive className="w-3.5 h-3.5" aria-hidden="true" />
                Saved Vault ({configs.length})
              </>
            ),
          },
          {
            id: 'security',
            label: (
              <>
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                Security Guard
              </>
            ),
          },
        ]}
      />

      {subSection === 'vault' && onLoadConfig && activeConfig && onDeleteCustom && onImportVerifiedConfig && (
        <ConfigVaultView
          configs={configs}
          activeConfig={activeConfig}
          presets={presets}
          platform={platform}
          targetFps={targetFps}
          onLoadConfig={onLoadConfig}
          onDeleteCustom={onDeleteCustom}
          onImportVerifiedConfig={onImportVerifiedConfig}
        />
      )}

      {subSection === 'security' && (
        <SecurityGuardView presets={presets} platform={platform} />
      )}

      {subSection === 'profile' && (
        <>
          {/* Header Profile Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0B0B0F]/90 border border-white/10 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#EF4444] via-[#F59E0B] to-[#EF4444] p-0.5 shadow-[0_0_20px_rgba(239,68,68,0.35)]">
                <div className="w-full h-full rounded-[14px] bg-[#07070B] flex items-center justify-center overflow-hidden">
                  <img src="./logo.png" alt="PASIYA" className="w-full h-full object-cover" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#22C55E] border-2 border-black flex items-center justify-center" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black font-display tracking-tight text-white uppercase">
                    {username}
                  </h2>
                  <svg className="w-4 h-4 text-[#38BDF8]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAB308]/20 border border-[#EAB308]/40 text-[#FDE047] text-[10px] font-extrabold uppercase font-mono">
                    <Crown className="w-2.5 h-2.5" />
                    VIP Member
                  </span>
                  <span className="text-[11px] text-[#9A9AA6] font-mono">
                    UID: {uid}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#86EFAC] text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                4 Online
              </span>
            </div>
          </div>

          {/* Platinum VIP License Card (DOBBEX HEX LUXURY DESIGN) */}
          <div className="relative rounded-3xl p-6 bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FBBF24] text-black shadow-[0_15px_35px_rgba(245,158,11,0.3)] overflow-hidden">
            {/* Background Decorative Crest Pattern */}
            <div className="pointer-events-none absolute -right-6 -bottom-6 w-36 h-36 opacity-25">
              <Shield className="w-full h-full text-black" />
            </div>

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black/80">
                  <Crown className="w-4 h-4 fill-current" />
                  <span>Platinum VIP License</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-black mt-1">
                  Unlimited Access to All Sensi Engines
                </h3>
                <p className="text-xs font-bold text-black/75 mt-1 font-mono">
                  Valid until 11/28/2026 11:58:48 PM
                </p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-black/15 backdrop-blur-md border border-black/20 flex flex-col items-center justify-center shrink-0">
                <Shield className="w-7 h-7 text-black" />
                <span className="text-[8px] font-black tracking-widest text-black">PLATINUM</span>
              </div>
            </div>

            {/* License Metrics Row */}
            <div className="relative z-10 mt-6 grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-black/20 backdrop-blur-sm border border-black/10">
                <div className="text-xs font-extrabold text-black font-mono">11 Days</div>
                <div className="text-[10px] font-bold text-black/70">Remaining</div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/20 backdrop-blur-sm border border-black/10">
                <div className="text-xs font-extrabold text-black font-mono">Tier 4/8</div>
                <div className="text-[10px] font-bold text-black/70">Platinum Rank</div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/20 backdrop-blur-sm border border-black/10">
                <div className="text-xs font-extrabold text-black font-mono">100% Active</div>
                <div className="text-[10px] font-bold text-black/70">All Features</div>
              </div>
            </div>
          </div>

          {/* Prestige Road Honor Section */}
          <div className="p-4 rounded-2xl bg-[#0B0B0F] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAB308]/20 flex items-center justify-center text-[#EAB308]">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Prestige Road</span>
                  <span className="text-[10px] font-mono text-[#EAB308] font-bold bg-[#EAB308]/15 px-1.5 py-0.2 rounded">
                    All 8 Ranks &rarr;
                  </span>
                </div>
                <p className="text-[11px] text-[#9A9AA6] mt-0.5">
                  All features are unlocked for everyone. Rank is an honor badge based on active days.
                </p>
              </div>
            </div>
          </div>

          {/* Device Hardware Spec Card */}
          <div className="p-5 rounded-2xl bg-[#0B0B0F] border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-[#38BDF8]" />
                <div>
                  <div className="text-sm font-bold text-white">
                    {platform === 'ios' ? 'Apple iPhone Hardware' : 'Android Hardware Engine'}
                  </div>
                  <div className="text-xs text-[#9A9AA6] font-mono">
                    {platform === 'ios' ? 'iPhone 16 · 60Hz ARM64' : `${telemetry.cores} Cores · ${telemetry.measuredHz}Hz Active`}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#22C55E] bg-[#22C55E]/15 px-2 py-0.5 rounded border border-[#22C55E]/30 font-bold">
                MATCHED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-[#9A9AA6] block">Panel Refresh Rate</span>
                <strong className="text-white font-mono text-sm">{telemetry.measuredHz} Hz Display</strong>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-[#9A9AA6] block">Touch Digitizer Polling</span>
                <strong className="text-[#38BDF8] font-mono text-sm">240 Hz Ultra</strong>
              </div>
            </div>
          </div>

          {/* System Toggles & Settings */}
          <div className="p-5 rounded-2xl bg-[#0B0B0F] border border-white/10 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#9A9AA6] font-bold">
              App Preferences &amp; Haptics
            </h4>

            {/* Sound Effects Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white">
                  {soundEffectsEnabled ? <Volume2 className="w-4 h-4 text-[#22C55E]" /> : <VolumeX className="w-4 h-4 text-[#9A9AA6]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">UI Sound Effects</div>
                  <div className="text-[10px] text-[#9A9AA6]">Tactile audio cues on slider &amp; button actions</div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  soundEffectsEnabled ? 'bg-[#22C55E]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    soundEffectsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Haptic Feedback Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white">
                  <Zap className={`w-4 h-4 ${hapticEnabled ? 'text-[#EAB308]' : 'text-[#9A9AA6]'}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Haptic Vibration Engine</div>
                  <div className="text-[10px] text-[#9A9AA6]">Physical micro-vibrations when sliding</div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleHapticFeedback}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  hapticEnabled ? 'bg-[#22C55E]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    hapticEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Account Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('action');
                onOpenAuthModal();
              }}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Switch Account / UID</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('action');
                onOpenAdminConsole();
              }}
              className="py-3 px-4 rounded-xl bg-[#EF4444]/20 hover:bg-[#EF4444]/30 border border-[#EF4444]/40 text-[#FCA5A5] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Admin Security Terminal"
            >
              <Shield className="w-4 h-4 text-[#EF4444]" />
              <span>Admin</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
