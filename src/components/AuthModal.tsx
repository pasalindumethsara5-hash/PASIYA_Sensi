import React, { useState } from 'react';
import {
  Check,
  Crown,
  KeyRound,
  Lock,
  LogOut,
  Shield,
  Smartphone,
  User,
  X,
  Zap,
} from 'lucide-react';
import {
  type GamerUser,
  getCurrentUser,
  setCurrentUser,
  verifyOwnerPin,
} from '../lib/authStore';
import { triggerHaptic } from '../lib/haptics';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminConsole: () => void;
  onUserChanged: (user: GamerUser | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminConsole,
  onUserChanged,
}) => {
  const [currentUser, setCurrentUserState] = useState<GamerUser | null>(() =>
    getCurrentUser()
  );
  const [gamerTag, setGamerTag] = useState('');
  const [freeFireUid, setFreeFireUid] = useState('');
  const [platform, setPlatform] = useState<'android' | 'ios'>('android');
  const [ownerPin, setOwnerPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickLogin = (authProvider: 'gamertag' | 'google' | 'apple') => {
    triggerHaptic('action');
    const tag =
      gamerTag.trim() ||
      (authProvider === 'google'
        ? 'GoogleGamer_' + Math.floor(1000 + Math.random() * 9000)
        : authProvider === 'apple'
        ? 'AppleGamer_' + Math.floor(1000 + Math.random() * 9000)
        : 'Player_' + Math.floor(1000 + Math.random() * 9000));

    const uid = freeFireUid.trim() || String(Math.floor(100000000 + Math.random() * 900000000));

    const deviceModel =
      typeof navigator !== 'undefined'
        ? /iPhone/.test(navigator.userAgent)
          ? 'Apple iPhone'
          : /Android/.test(navigator.userAgent)
          ? 'Android Handset'
          : 'Desktop Gamer'
        : 'Mobile Handset';

    const newUser: GamerUser = {
      id: 'u-' + Date.now(),
      gamerTag: tag,
      freeFireUid: uid,
      authProvider,
      platform,
      deviceModel,
      registeredAt: new Date().toLocaleDateString(),
      lastActive: 'Just now',
      isOwner: false,
    };

    setCurrentUser(newUser);
    setCurrentUserState(newUser);
    onUserChanged(newUser);
    triggerHaptic('success');
    onClose();
  };

  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerPin(ownerPin)) {
      triggerHaptic('success');
      const ownerUser: GamerUser = {
        id: 'u-owner-01',
        gamerTag: 'PASIYA_OFFICIAL',
        freeFireUid: '892174921',
        authProvider: 'gamertag',
        platform: 'android',
        deviceModel: 'Owner Workstation',
        registeredAt: '2026-11-10',
        lastActive: 'Just now',
        isOwner: true,
      };
      setCurrentUser(ownerUser);
      setCurrentUserState(ownerUser);
      onUserChanged(ownerUser);
      setShowPinInput(false);
      onClose();
      onOpenAdminConsole();
    } else {
      triggerHaptic('tap');
      setErrorMsg('Invalid Master PIN. Default is 7777');
    }
  };

  const handleLogout = () => {
    triggerHaptic('action');
    setCurrentUser(null);
    setCurrentUserState(null);
    onUserChanged(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gamer Authentication & Profile"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md my-auto rounded-2xl bg-[#0B0B0F] border border-[#23232B] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#23232B] bg-[#07070A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center">
              <User className="w-4 h-4 text-[#EF4444]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {currentUser ? 'Gamer Profile' : 'Free Fire Gamer Login'}
              </h3>
              <p className="text-[11px] font-mono text-[#9A9AA6]">
                Sync Sensitivities &amp; Headshot Analytics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {currentUser ? (
            /* Logged In View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#140A0D] border border-[#EF4444]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#22C55E] animate-pulse" />
                    <span className="text-sm font-bold text-white">{currentUser.gamerTag}</span>
                  </div>
                  {currentUser.isOwner ? (
                    <span className="text-[10px] font-mono font-bold text-[#EAB308] bg-[#EAB308]/20 px-2 py-0.5 rounded border border-[#EAB308]/40 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      OWNER
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-[#22C55E] bg-[#22C55E]/20 px-2 py-0.5 rounded border border-[#22C55E]/40">
                      VERIFIED GAMER
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#9A9AA6] space-y-1">
                  <div>Free Fire UID: <strong className="text-white">{currentUser.freeFireUid}</strong></div>
                  <div>Device: <strong className="text-white">{currentUser.deviceModel}</strong></div>
                  <div>Registered: <strong className="text-white">{currentUser.registeredAt}</strong></div>
                </div>
              </div>

              {currentUser.isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminConsole();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#EAB308] hover:bg-[#CA8A04] text-black text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>Open Owner Admin Dashboard</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : showPinInput ? (
            /* Owner PIN Gate */
            <form onSubmit={handleOwnerLogin} className="space-y-3">
              <div className="text-xs text-[#C4C4CF]">
                Enter the secret Owner Master PIN to access user registries:
              </div>
              <input
                type="password"
                placeholder="Enter Master PIN (Default: 7777)"
                value={ownerPin}
                onChange={(e) => {
                  setOwnerPin(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060609] border border-[#23232B] focus:border-[#EF4444] text-white text-xs font-mono outline-none"
                autoFocus
              />
              {errorMsg && <p className="text-[11px] text-[#EF4444]">{errorMsg}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinInput(false)}
                  className="flex-1 py-2 rounded-xl bg-white/10 text-white text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#EF4444] text-white text-xs font-bold cursor-pointer"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          ) : (
            /* Registration / Login Form */
            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] text-[#9A9AA6] font-semibold block mb-1">
                  Free Fire In-Game Name / GamerTag
                </label>
                <input
                  type="text"
                  placeholder="e.g. PASIYA_KILLER"
                  value={gamerTag}
                  onChange={(e) => setGamerTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060609] border border-[#23232B] focus:border-[#EF4444] text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#9A9AA6] font-semibold block mb-1">
                  Free Fire UID (Account Number)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 549102931"
                  value={freeFireUid}
                  onChange={(e) => setFreeFireUid(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060609] border border-[#23232B] focus:border-[#EF4444] text-white text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#9A9AA6] font-semibold block mb-1">
                  Platform
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlatform('android')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      platform === 'android'
                        ? 'bg-[#EF4444] text-white border-[#EF4444]'
                        : 'bg-[#060609] text-[#9A9AA6] border-[#23232B]'
                    }`}
                  >
                    Android
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform('ios')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      platform === 'ios'
                        ? 'bg-[#EF4444] text-white border-[#EF4444]'
                        : 'bg-[#060609] text-[#9A9AA6] border-[#23232B]'
                    }`}
                  >
                    Apple iOS
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleQuickLogin('gamertag')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Save &amp; Enter Sensi Lab</span>
              </button>

              <div className="relative py-1 text-center">
                <span className="text-[10px] text-[#6A6A78] uppercase tracking-wider bg-[#0B0B0F] px-2 relative z-10">
                  Or 1-Tap Cloud Link
                </span>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#23232B]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('google')}
                  className="py-2.5 px-3 rounded-xl bg-[#060609] border border-[#23232B] hover:border-white/40 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="w-4 h-4 rounded-full bg-white text-black font-extrabold text-[10px] flex items-center justify-center">
                    G
                  </span>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('apple')}
                  className="py-2.5 px-3 rounded-xl bg-[#060609] border border-[#23232B] hover:border-white/40 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="text-white text-sm"></span>
                  <span>Apple ID</span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowPinInput(true)}
                  className="text-[10px] text-[#6A6A78] hover:text-[#9A9AA6] flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Owner Master Login (Admin)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
