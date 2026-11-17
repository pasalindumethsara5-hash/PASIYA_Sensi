import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Archive,
  Crown,
  Crosshair,
  Gauge,
  Sparkles,
  Target,
  User,
  Wifi,
  Globe,
  Share2,
} from 'lucide-react';
import { AimAssistView } from './components/AimAssistView';
import { AnimatedBackdrop } from './components/AnimatedBackdrop';
import { BrandLogo } from './components/BrandLogo';
import { CommandHubView } from './components/CommandHubView';
import { DeveloperContactCard } from './components/DeveloperContactCard';
import { AutoLaunchBanner } from './components/GameLauncherCard';
import { OptimizeHubView } from './components/OptimizeHubView';
import { PersistentCrosshairOverlay } from './components/PersistentCrosshairOverlay';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { SensitivityView } from './components/SensitivityView';
import { SplashIntro } from './components/SplashIntro';
import { ToolsHubView } from './components/ToolsHubView';
import { VaultGuardView } from './components/VaultGuardView';
import { AuthModal } from './components/AuthModal';
import { AdminConsoleModal } from './components/AdminConsoleModal';
import { AppUpdateModal } from './components/AppUpdateModal';
import {
  type AppVersionInfo,
  CURRENT_APP_VERSION,
  fetchRemoteVersion,
  isUpdateAvailable,
} from './lib/appUpdater';
import {
  type GamerUser,
  getCurrentUser,
} from './lib/authStore';
import { useDeviceTelemetry } from './hooks/useDeviceTelemetry';
import {
  type ReticleOverlayConfig,
  type ScopeModeId,
  getScopePreset,
} from './lib/aimAssist';
import { copyTextSafely, safeSetStorage } from './lib/clipboard';
import { type GameEdition, buildGameLaunchSpec } from './lib/gameLauncher';
import {
  BUILTIN_CONFIGS,
  OPTIMIZATION_PROFILES,
  type OptimizationProfileMode,
  type PlatformTarget,
  type SensitivityConfig,
  formatFreeFireConfig,
} from './lib/optimizer';
import { installGlobalButtonHaptics, triggerHaptic } from './lib/haptics';
import {
  startNativeOverlay,
  stopNativeOverlay,
  updateNativeOverlay,
} from './lib/nativeCrosshair';

type TabId = 'sensitivity' | 'aim' | 'hub' | 'optimize' | 'tools' | 'vault';

const STORAGE_KEYS = {
  slots: 'pasiya_slots_v2',
  activeSlot: 'pasiya_active_slot_v2',
  customConfigs: 'pasiya_custom_configs_v1',
  targetFps: 'pasiya_target_fps_v1',
  platform: 'pasiya_platform_v1',
  lowEndMode: 'pasiya_lowend_mode_v1',
  smoothGfx: 'pasiya_smooth_gfx_v1',
  checklist: 'pasiya_checklist_v1',
  resolutionScale: 'pasiya_res_scale_v1',
  profileMode: 'pasiya_profile_mode_v1',
  overlayEnabled: 'pasiya_aim_overlay_enabled_v1',
  scopeMode: 'pasiya_aim_scope_mode_v1',
  reticle: 'pasiya_aim_reticle_v1',
  gameEdition: 'pasiya_game_edition_v1',
  autoLaunch: 'pasiya_auto_launch_v1',
} as const;

function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const DEFAULT_SLOTS: SensitivityConfig[] = [
  BUILTIN_CONFIGS[0],
  BUILTIN_CONFIGS[1],
  BUILTIN_CONFIGS[2],
  BUILTIN_CONFIGS[4],
];

export default function App() {
  const { telemetry, probeDisplayHz } = useDeviceTelemetry();

  const [activeTab, setActiveTab] = useState<TabId>('sensitivity');
  const [officialPresets, setOfficialPresets] =
    useState<SensitivityConfig[]>(BUILTIN_CONFIGS);
  const [customConfigs, setCustomConfigs] = useState<SensitivityConfig[]>(() =>
    readJsonStorage<SensitivityConfig[]>(STORAGE_KEYS.customConfigs, [])
  );
  const [slots, setSlots] = useState<SensitivityConfig[]>(() => {
    const saved = readJsonStorage<SensitivityConfig[]>(
      STORAGE_KEYS.slots,
      DEFAULT_SLOTS
    );
    return saved.length === 4 ? saved : DEFAULT_SLOTS;
  });
  const [activeSlot, setActiveSlot] = useState<number>(() =>
    Math.min(
      3,
      Math.max(0, readJsonStorage<number>(STORAGE_KEYS.activeSlot, 0))
    )
  );
  const activeConfig = slots[activeSlot] ?? BUILTIN_CONFIGS[0];

  const [platform, setPlatform] = useState<PlatformTarget>(() =>
    readJsonStorage<PlatformTarget>(
      STORAGE_KEYS.platform,
      telemetry.detectedPlatform
    )
  );
  const [targetFps, setTargetFps] = useState<60 | 90 | 120 | 144>(() =>
    readJsonStorage<60 | 90 | 120 | 144>(STORAGE_KEYS.targetFps, 60)
  );
  const [lowEndBoostActive, setLowEndBoostActive] = useState<boolean>(() =>
    readJsonStorage<boolean>(STORAGE_KEYS.lowEndMode, false)
  );
  const [smoothGraphics, setSmoothGraphics] = useState<boolean>(() =>
    readJsonStorage<boolean>(STORAGE_KEYS.smoothGfx, true)
  );
  const [resolutionScale, setResolutionScale] = useState<number>(() =>
    readJsonStorage<number>(STORAGE_KEYS.resolutionScale, 90)
  );
  const [profileMode, setProfileMode] = useState<OptimizationProfileMode>(() =>
    readJsonStorage<OptimizationProfileMode>(
      STORAGE_KEYS.profileMode,
      'all-round'
    )
  );
  const [checkedIds, setCheckedIds] = useState<string[]>(() =>
    readJsonStorage<string[]>(STORAGE_KEYS.checklist, ['ff-smooth-gfx'])
  );
  const [overlayEnabled, setOverlayEnabled] = useState<boolean>(() =>
    readJsonStorage<boolean>(STORAGE_KEYS.overlayEnabled, false)
  );
  const [scopeMode, setScopeMode] = useState<ScopeModeId>(() =>
    readJsonStorage<ScopeModeId>(STORAGE_KEYS.scopeMode, 'red-dot')
  );
  const [reticle, setReticle] = useState<ReticleOverlayConfig>(() =>
    readJsonStorage<ReticleOverlayConfig>(STORAGE_KEYS.reticle, {
      shape: 'red-dot-holo',
      color: '#EF4444',
      scale: 1.05,
      gapPx: 6,
      opacityPct: 95,
      showCenterDot: true,
    })
  );
  const [copiedTop, setCopiedTop] = useState(false);
  const [gameEdition, setGameEdition] = useState<GameEdition>(() =>
    readJsonStorage<GameEdition>(STORAGE_KEYS.gameEdition, 'freefire')
  );
  const [autoLaunchOnApply, setAutoLaunchOnApply] = useState<boolean>(() =>
    readJsonStorage<boolean>(STORAGE_KEYS.autoLaunch, false)
  );
  const [launchVisible, setLaunchVisible] = useState(false);
  const [launchCountdown, setLaunchCountdown] = useState(3);
  const [launchStatus, setLaunchStatus] = useState<'counting' | 'launched'>(
    'counting'
  );
  const launchTimerRef = useRef<number | null>(null);

  const [currentUser, setCurrentUser] = useState<GamerUser | null>(() =>
    getCurrentUser()
  );
  // Mandatory Login Gate: Force Auth modal open if user is not registered / logged in
  const [showAuthModal, setShowAuthModal] = useState<boolean>(
    () => getCurrentUser() === null
  );
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<AppVersionInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Sync auth modal visibility when user state changes
  useEffect(() => {
    if (currentUser === null) {
      setShowAuthModal(true);
    }
  }, [currentUser]);

  // Logo secret 5-click easter egg for Owner Admin Console
  const logoClickCountRef = useRef(0);
  const logoClickTimerRef = useRef<number | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSelectTab('sensitivity');
    logoClickCountRef.current += 1;
    if (logoClickTimerRef.current) {
      window.clearTimeout(logoClickTimerRef.current);
    }
    logoClickTimerRef.current = window.setTimeout(() => {
      logoClickCountRef.current = 0;
    }, 2500);

    if (logoClickCountRef.current >= 5) {
      logoClickCountRef.current = 0;
      triggerHaptic('success');
      setShowAdminModal(true);
    }
  };

  // Check for OTA App Updates on startup
  useEffect(() => {
    void fetchRemoteVersion().then((remote) => {
      if (remote && isUpdateAvailable(remote)) {
        setAvailableUpdate(remote);
        setShowUpdateModal(true);
      }
    });
  }, []);

  // Install global tactile button feedback across all interactive controls
  useEffect(() => installGlobalButtonHaptics(), []);

  useEffect(() => {
    return () => {
      if (launchTimerRef.current !== null) {
        window.clearInterval(launchTimerRef.current);
      }
    };
  }, []);

  // Sync server-signed official presets on boot
  useEffect(() => {
    let active = true;
    fetch('/api/presets')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items?: SensitivityConfig[] } | null) => {
        if (!active || !data?.items?.length) return;
        setOfficialPresets(data.items);
        setSlots((prevSlots) =>
          prevSlots.map((slot) => {
            const matched = data.items?.find((item) => item.id === slot.id);
            return matched && slot.source !== 'custom'
              ? { ...matched, cap: slot.cap }
              : slot;
          })
        );
      })
      .catch(() => {
        // Offline fallback uses BUILTIN_CONFIGS cleanly
      });
    return () => {
      active = false;
    };
  }, []);

  // Persist user preferences to localStorage safely
  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.slots, JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.activeSlot, JSON.stringify(activeSlot));
  }, [activeSlot]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.customConfigs, JSON.stringify(customConfigs));
  }, [customConfigs]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.targetFps, JSON.stringify(targetFps));
  }, [targetFps]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.platform, JSON.stringify(platform));
  }, [platform]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.lowEndMode, JSON.stringify(lowEndBoostActive));
  }, [lowEndBoostActive]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.smoothGfx, JSON.stringify(smoothGraphics));
  }, [smoothGraphics]);

  useEffect(() => {
    safeSetStorage(
      STORAGE_KEYS.resolutionScale,
      JSON.stringify(resolutionScale)
    );
  }, [resolutionScale]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.profileMode, JSON.stringify(profileMode));
  }, [profileMode]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.checklist, JSON.stringify(checkedIds));
  }, [checkedIds]);

  useEffect(() => {
    safeSetStorage(
      STORAGE_KEYS.overlayEnabled,
      JSON.stringify(overlayEnabled)
    );
    if (overlayEnabled) {
      void startNativeOverlay(reticle);
    } else {
      void stopNativeOverlay();
    }
  }, [overlayEnabled]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.scopeMode, JSON.stringify(scopeMode));
  }, [scopeMode]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.reticle, JSON.stringify(reticle));
    if (overlayEnabled) {
      void updateNativeOverlay(reticle);
    }
  }, [reticle, overlayEnabled]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.gameEdition, JSON.stringify(gameEdition));
  }, [gameEdition]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.autoLaunch, JSON.stringify(autoLaunchOnApply));
  }, [autoLaunchOnApply]);

  const handleSelectScopeMode = (nextScope: ScopeModeId) => {
    const preset = getScopePreset(nextScope);
    setScopeMode(nextScope);
    setReticle((prev) => ({
      ...prev,
      shape: preset.recommendedShape,
      gapPx: preset.recommendedGapPx,
      scale: preset.recommendedScale,
    }));
  };

  const setActiveConfigForCurrentSlot = (next: SensitivityConfig) => {
    setSlots((prev) =>
      prev.map((slot, idx) => (idx === activeSlot ? next : slot))
    );
  };

  const handleCopyActiveConfig = async () => {
    triggerHaptic('success');
    const text = formatFreeFireConfig(activeConfig, platform, targetFps);
    await copyTextSafely(text);
    setCopiedTop(true);
    setTimeout(() => setCopiedTop(false), 2000);
  };

  const executeNativeDeepLinkIfMobile = useCallback(
    (cfg: SensitivityConfig) => {
      if (typeof navigator === 'undefined') return;
      const isMobileUa = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isMobileUa) return;
      const spec = buildGameLaunchSpec(gameEdition, platform, cfg, targetFps);
      const a = document.createElement('a');
      a.href = spec.deepLinkUrl;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [gameEdition, platform, targetFps]
  );

  const handleCancelAutoLaunch = useCallback(() => {
    if (launchTimerRef.current !== null) {
      window.clearInterval(launchTimerRef.current);
      launchTimerRef.current = null;
    }
    setLaunchVisible(false);
    setLaunchStatus('counting');
  }, []);

  const handleTriggerAutoLaunch = useCallback(
    (configOverride?: SensitivityConfig) => {
      const targetCfg = configOverride ?? activeConfig;
      void copyTextSafely(
        formatFreeFireConfig(targetCfg, platform, targetFps)
      );
      if (launchTimerRef.current !== null) {
        window.clearInterval(launchTimerRef.current);
      }
      setLaunchStatus('counting');
      setLaunchCountdown(3);
      setLaunchVisible(true);

      let remaining = 3;
      launchTimerRef.current = window.setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          if (launchTimerRef.current !== null) {
            window.clearInterval(launchTimerRef.current);
            launchTimerRef.current = null;
          }
          setLaunchCountdown(0);
          setLaunchStatus('launched');
          triggerHaptic('success');
          executeNativeDeepLinkIfMobile(targetCfg);
        } else {
          setLaunchCountdown(remaining);
        }
      }, 1000);
    },
    [activeConfig, platform, targetFps, executeNativeDeepLinkIfMobile]
  );

  const handleSaveCustom = async (name: string) => {
    const candidate: SensitivityConfig = {
      ...activeConfig,
      id: `custom-${Date.now()}`,
      name,
      category: 'custom',
      source: 'custom',
    };

    try {
      const res = await fetch('/api/sign-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: candidate }),
      });
      if (res.ok) {
        const data = (await res.json()) as { config: SensitivityConfig };
        setCustomConfigs((prev) => [data.config, ...prev]);
        setActiveConfigForCurrentSlot(data.config);
        return;
      }
    } catch {
      // Offline fallback: save locally
    }

    setCustomConfigs((prev) => [candidate, ...prev]);
    setActiveConfigForCurrentSlot(candidate);
  };

  const handleApplyLowEndOneTap = () => {
    triggerHaptic('success');
    setLowEndBoostActive(true);
    setSmoothGraphics(true);
    setTargetFps(60);
    setResolutionScale(75);
    setProfileMode('battery-saver');
    const lowPreset = officialPresets.find((p) => p.id === 'lowend-safe');
    if (lowPreset) {
      setActiveConfigForCurrentSlot(lowPreset);
    }
    setCheckedIds((prev) =>
      Array.from(new Set([...prev, 'ff-smooth-gfx', 'storage-headroom']))
    );
  };

  const handleApplyProfileMode = (mode: OptimizationProfileMode) => {
    const spec = OPTIMIZATION_PROFILES.find((p) => p.id === mode);
    if (!spec) return;
    setProfileMode(mode);
    setTargetFps(spec.targetFps);
    setResolutionScale(spec.resolutionScale);
    setSmoothGraphics(spec.smoothGraphics);
    setLowEndBoostActive(spec.lowEndBoost);
  };

  const handleToggleChecklistItem = (id: string) => {
    triggerHaptic('tap');
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLoadFromVault = (config: SensitivityConfig) => {
    triggerHaptic('selection');
    setActiveConfigForCurrentSlot(config);
    handleSelectTab('sensitivity');
    if (autoLaunchOnApply) {
      handleTriggerAutoLaunch(config);
    }
  };

  const handleDeleteCustom = (id: string) => {
    triggerHaptic('warning');
    setCustomConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  const handleImportVerified = (config: SensitivityConfig) => {
    triggerHaptic('success');
    const imported: SensitivityConfig = {
      ...config,
      category: 'custom',
      source: 'custom',
    };
    setCustomConfigs((prev) => {
      const withoutDup = prev.filter((c) => c.id !== imported.id);
      return [imported, ...withoutDup];
    });
    setActiveConfigForCurrentSlot(imported);
  };

  const navItems: {
    id: TabId;
    label: string;
    mobileLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'sensitivity',
      label: 'Sensitivity',
      mobileLabel: 'Sensi',
      icon: Crosshair,
    },
    { id: 'aim', label: 'Aim Assist', mobileLabel: 'Aim', icon: Target },
    { id: 'hub', label: 'Command Hub', mobileLabel: 'Hub', icon: Activity },
    { id: 'optimize', label: 'FPS & Boost', mobileLabel: 'Boost', icon: Gauge },
    { id: 'tools', label: 'Net & Touch', mobileLabel: 'Tools', icon: Wifi },
    { id: 'vault', label: 'Vault & Guard', mobileLabel: 'Vault', icon: Archive },
  ];

  const [tabDirection, setTabDirection] = useState<'right' | 'left' | 'none'>(
    'none'
  );
  const handleSelectTab = (nextTab: TabId) => {
    if (nextTab === activeTab) return;
    triggerHaptic('tap');
    const prevIdx = navItems.findIndex((item) => item.id === activeTab);
    const nextIdx = navItems.findIndex((item) => item.id === nextTab);
    setTabDirection(nextIdx >= prevIdx ? 'right' : 'left');
    setActiveTab(nextTab);
  };

  const [introDone, setIntroDone] = useState(false);
  const handleIntroComplete = useCallback(() => setIntroDone(true), []);

  const allVaultConfigs = [...customConfigs, ...officialPresets];
  const activeTabIndex = Math.max(
    0,
    navItems.findIndex((item) => item.id === activeTab)
  );
  const tabAnimationClass =
    tabDirection === 'right'
      ? 'tab-enter-right'
      : tabDirection === 'left'
        ? 'tab-enter-left'
        : 'tab-enter-neutral';

  return (
    <div
      data-intro-done={introDone ? 'true' : 'false'}
      className="relative min-h-screen bg-[#050507] text-white flex flex-col"
    >
      <AnimatedBackdrop />
      <SplashIntro onComplete={handleIntroComplete} />

      {/* Strict 3-Zone Frosted Glass Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-14 glass-navbar">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single brand wordmark + PM crest logo (5 clicks opens Owner Console) */}
          <a
            href="#top"
            onClick={handleLogoClick}
            className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
            title="PASIYA Sensi"
          >
            <BrandLogo size={28} />
            <span>
              PASIYA <span className="text-[#EF4444]">Sensi</span>
            </span>
          </a>

          {/* Zone 2: Desktop single-line 6 nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-4 lg:gap-6"
          >
            {navItems.map((item) => {
              const isCurrent = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                    isCurrent
                      ? 'text-white'
                      : 'text-[#9A9AA6] hover:text-white'
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[#EF4444] via-[#EF4444] to-white transition-transform duration-200 ease-out origin-center ${
                      isCurrent ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Gamer Profile / Login / Admin trigger + Install/Update Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {availableUpdate && (
              <button
                type="button"
                onClick={() => setShowUpdateModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#EF4444]/20 border border-[#EF4444]/60 text-white text-xs font-bold animate-pulse cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>v{availableUpdate.version} Available</span>
              </button>
            )}

            {/* Gamer Profile / Login Pill */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                {currentUser.isOwner ? (
                  <Crown className="w-3.5 h-3.5 text-[#EAB308]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                )}
                <span className="max-w-[70px] sm:max-w-[100px] truncate">
                  {currentUser.gamerTag}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#9A9AA6]" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Official Website & Squad Downloads Link */}
            <a
              href="./download.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/40 text-xs font-semibold text-[#FCA5A5] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Official Website & Squad Downloads"
            >
              <Globe className="w-3.5 h-3.5 text-[#EF4444]" />
              <span className="hidden md:inline">Website &amp; Share</span>
            </a>

            <PWAInstallButton
              onFallbackAction={() => void handleCopyActiveConfig()}
              fallbackLabel={copiedTop ? 'Copied' : 'Copy Config'}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area with Directional Tab Transition */}
      <main
        id="top"
        className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-12"
      >
        <div key={activeTab} className={tabAnimationClass}>
          {activeTab === 'sensitivity' && (
            <SensitivityView
              presets={officialPresets}
              activeConfig={activeConfig}
              activeSlot={activeSlot}
              platform={platform}
              targetFps={targetFps}
              measuredHz={telemetry.measuredHz}
              gameEdition={gameEdition}
              autoLaunchOnApply={autoLaunchOnApply}
              onEditionChange={setGameEdition}
              onToggleAutoLaunch={() => setAutoLaunchOnApply((v) => !v)}
              onLaunchGame={handleTriggerAutoLaunch}
              onSelectSlot={setActiveSlot}
              onPlatformChange={setPlatform}
              onConfigChange={setActiveConfigForCurrentSlot}
              onSaveCustom={handleSaveCustom}
              onCopyConfig={handleCopyActiveConfig}
              copied={copiedTop}
            />
          )}

          {activeTab === 'aim' && (
            <AimAssistView
              activeConfig={activeConfig}
              platform={platform}
              overlayEnabled={overlayEnabled}
              onToggleOverlay={() => setOverlayEnabled((v) => !v)}
              scopeMode={scopeMode}
              onSelectScopeMode={handleSelectScopeMode}
              reticle={reticle}
              onReticleChange={setReticle}
            />
          )}

          {activeTab === 'hub' && (
            <CommandHubView
              telemetry={telemetry}
              platform={platform}
              activeConfig={activeConfig}
              targetFps={targetFps}
              lowEndBoostActive={lowEndBoostActive}
              smoothGraphics={smoothGraphics}
              checkedIds={checkedIds}
              presetsCount={officialPresets.length}
              gameEdition={gameEdition}
              autoLaunchOnApply={autoLaunchOnApply}
              onEditionChange={setGameEdition}
              onToggleAutoLaunch={() => setAutoLaunchOnApply((v) => !v)}
              onLaunchGame={() => handleTriggerAutoLaunch()}
              onNavigateTab={handleSelectTab}
            />
          )}

          {activeTab === 'optimize' && (
            <OptimizeHubView
              telemetry={telemetry}
              platform={platform}
              targetFps={targetFps}
              lowEndBoostActive={lowEndBoostActive}
              checkedIds={checkedIds}
              smoothGraphics={smoothGraphics}
              resolutionScale={resolutionScale}
              profileMode={profileMode}
              onSelectFps={setTargetFps}
              onProbeHz={probeDisplayHz}
              onToggleLowEndBoost={() => setLowEndBoostActive((v) => !v)}
              onApplyOneTapBoost={handleApplyLowEndOneTap}
              onToggleChecklistItem={handleToggleChecklistItem}
              onToggleSmoothGraphics={() => setSmoothGraphics((v) => !v)}
              onPlatformChange={setPlatform}
              onApplyProfileMode={handleApplyProfileMode}
              onResolutionScaleChange={setResolutionScale}
            />
          )}

          {activeTab === 'tools' && <ToolsHubView platform={platform} />}

          {activeTab === 'vault' && (
            <VaultGuardView
              configs={allVaultConfigs}
              activeConfig={activeConfig}
              presets={officialPresets}
              platform={platform}
              targetFps={targetFps}
              onLoadConfig={handleLoadFromVault}
              onDeleteCustom={handleDeleteCustom}
              onImportVerifiedConfig={handleImportVerified}
            />
          )}
        </div>

        {activeTab !== 'hub' && <DeveloperContactCard compact />}
      </main>

      {/* Mobile Bottom Frosted Glass Navigation Bar with Sliding Active Bar & Glow */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-bottom-bar pb-safe"
      >
        <div
          aria-hidden="true"
          style={{
            width: `${100 / navItems.length}%`,
            transform: `translate3d(${activeTabIndex * 100}%, 0, 0)`,
          }}
          className="pointer-events-none absolute inset-y-0 left-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <div className="mx-3 h-[3px] rounded-b-full bg-gradient-to-r from-[#EF4444] via-white to-[#EF4444]" />
          <div className="mx-2 mt-0.5 h-[calc(100%-6px)] rounded-xl bg-gradient-to-b from-[#EF4444]/16 via-[#EF4444]/5 to-transparent" />
        </div>

        <div className="relative z-10 grid grid-cols-6 h-14 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? 'text-[#EF4444] scale-105'
                    : 'text-[#A0A0AC] hover:text-white active:scale-95'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isCurrent ? '-translate-y-0.5' : ''
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`text-[10px] font-semibold leading-none transition-colors duration-200 ${
                    isCurrent ? 'text-white' : ''
                  }`}
                >
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <PersistentCrosshairOverlay
        enabled={overlayEnabled}
        scopeMode={scopeMode}
        reticle={reticle}
        activeConfig={activeConfig}
        onSelectScope={handleSelectScopeMode}
        onDisable={() => setOverlayEnabled(false)}
      />

      <AutoLaunchBanner
        visible={launchVisible}
        countdownSec={launchCountdown}
        launchStatus={launchStatus}
        edition={gameEdition}
        platform={platform}
        activeConfig={activeConfig}
        targetFps={targetFps}
        onCancel={handleCancelAutoLaunch}
        onLaunchImmediately={() => {
          if (launchTimerRef.current !== null) {
            window.clearInterval(launchTimerRef.current);
            launchTimerRef.current = null;
          }
          setLaunchStatus('launched');
          setLaunchCountdown(0);
        }}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onOpenAdminConsole={() => setShowAdminModal(true)}
        onUserChanged={(u) => setCurrentUser(u)}
      />

      <AdminConsoleModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />

      {availableUpdate && showUpdateModal && (
        <AppUpdateModal
          updateInfo={availableUpdate}
          onClose={() => setShowUpdateModal(false)}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}
