import React, { useState } from 'react';
import {
  Check,
  Crown,
  Eye,
  EyeOff,
  Gamepad2,
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
  loginExistingGamer,
  registerNewGamer,
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
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [gamerTag, setGamerTag] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [freeFireUid, setFreeFireUid] = useState('');
  const [platform, setPlatform] = useState<'android' | 'ios'>(() => {
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      return 'ios';
    }
    return 'android';
  });
  const [ownerPin, setOwnerPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isMandatory = currentUser === null;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = registerNewGamer({
      gamerTag,
      password,
      freeFireUid,
      platform,
      authProvider: 'credentials',
    });

    if (!res.success || !res.user) {
      triggerHaptic('error');
      setErrorMsg(res.error || 'Failed to register account.');
      return;
    }

    triggerHaptic('success');
    setCurrentUserState(res.user);
    onUserChanged(res.user);
    onClose();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = loginExistingGamer({
      gamerTag,
      password,
    });

    if (!res.success || !res.user) {
      triggerHaptic('error');
      setErrorMsg(res.error || 'Login failed.');
      return;
    }

    triggerHaptic('success');
    setCurrentUserState(res.user);
    onUserChanged(res.user);
    onClose();
  };

  const handleSocialQuickFill = (provider: 'google' | 'apple') => {
    triggerHaptic('action');
    const autoName =
      provider === 'google'
        ? 'GoogleGamer_' + Math.floor(100 + Math.random() * 900)
        : 'AppleGamer_' + Math.floor(100 + Math.random() * 900);
    setGamerTag(autoName);
    setPassword('ff_player_' + Math.floor(1000 + Math.random() * 9000));
    setFreeFireUid(String(Math.floor(100000000 + Math.random() * 900000000)));
    setSuccessMsg(`Auto-filled ${provider === 'google' ? 'Google' : 'Apple'} gamer credentials. Click Create Account to proceed.`);
  };

  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerPin(ownerPin)) {
      triggerHaptic('success');
      const ownerUser: GamerUser = {
        id: 'u-owner-01',
        gamerTag: 'PASIYA_OFFICIAL',
        password: 'owner_master_pass',
        freeFireUid: '892174921',
        authProvider: 'credentials',
        platform: 'android',
        deviceModel: 'Owner Workstation',
        registeredAt: '2026-11-10 14:20',
        lastActive: 'Just now',
        isOwner: true,
      };
      setCurrentUser(ownerUser);
      setCurrentUserState(ownerUser);
      onUserChanged(ownerUser);
      onClose();
      onOpenAdminConsole();
    } else {
      triggerHaptic('error');
      setErrorMsg('Incorrect Master PIN! (Hint: 7777)');
    }
  };

  const handleLogout = () => {
    triggerHaptic('action');
    setCurrentUser(null);
    setCurrentUserState(null);
    onUserChanged(null);
    setErrorMsg('');
    setSuccessMsg('');
    setMode('register');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gamer Authentication Gate"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 overflow-y-auto"
      onClick={() => {
        if (!isMandatory) onClose();
      }}
    >
      <div
        className="w-full max-w-md my-auto rounded-2xl bg-[#0B0B0F] border border-[#EF4444]/60 shadow-[0_12px_48px_rgba(239,68,68,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-[#23232B] bg-[#140A0D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/50 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {currentUser ? 'Gamer Account' : 'Gamer Verification'}
                </h3>
                {isMandatory && (
                  <span className="text-[10px] font-mono-num font-bold text-[#EF4444] bg-[#EF4444]/20 px-2 py-0.5 rounded border border-[#EF4444]/40">
                    REQUIRED
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9A9AA6]">
                {currentUser
                  ? 'Active Free Fire Battle Profile'
                  : 'Register Username & Password to unlock'}
              </p>
            </div>
          </div>
          {!isMandatory && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#060609] border border-[#23232B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9A9AA6]">GamerTag / Nickname</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {currentUser.gamerTag}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9A9AA6]">Free Fire UID</span>
                  <span className="text-xs font-bold text-[#EF4444] font-mono">
                    {currentUser.freeFireUid}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9A9AA6]">Device Platform</span>
                  <span className="text-xs font-semibold text-white uppercase font-mono">
                    {currentUser.platform}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9A9AA6]">Registered Date</span>
                  <span className="text-xs text-[#9A9AA6] font-mono">
                    {currentUser.registeredAt}
                  </span>
                </div>
              </div>

              {currentUser.isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminConsole();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#EAB308] text-black text-xs font-bold hover:bg-[#CA8A04] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Crown className="w-4 h-4" />
                  <span>Open Owner Admin Console</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-bold hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Switch Account / Log Out</span>
              </button>
            </div>
          ) : showPinInput ? (
            /* Owner PIN Access */
            <form onSubmit={handleOwnerLogin} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#14120A] border border-[#EAB308]/40 text-xs text-[#FDE047] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-[#EAB308]" />
                  <span>Owner Master PIN Access</span>
                </div>
                <p className="text-[11px] text-[#FEF08A]">
                  Enter Master PIN (7777) to bypass verification and open Owner Dashboard.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Owner Master PIN:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#EAB308] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={10}
                    placeholder="Enter PIN..."
                    value={ownerPin}
                    onChange={(e) => setOwnerPin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#060609] border border-[#23232B] focus:border-[#EAB308] text-sm text-white font-mono tracking-widest outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-400">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinInput(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#CA8A04] text-xs font-bold text-black transition-colors cursor-pointer shadow-lg"
                >
                  Verify PIN
                </button>
              </div>
            </form>
          ) : (
            /* Register or Login Form */
            <div className="space-y-4">
              {/* Mandatory Notice */}
              <div className="p-3 rounded-xl bg-[#180C0E] border border-[#EF4444]/40 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                <p className="text-xs text-[#FCA5A5] leading-relaxed">
                  <strong className="text-white">Player Verification:</strong> All players on Android &amp; iOS must register with a Username &amp; Password to activate Free Fire Sensi Engine.
                </p>
              </div>

              {/* Mode Tabs: Register vs Login */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[#060609] border border-[#23232B]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-[#EF4444] text-white shadow-md'
                      : 'text-[#9A9AA6] hover:text-white'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[#EF4444] text-white shadow-md'
                      : 'text-[#9A9AA6] hover:text-white'
                  }`}
                >
                  Existing Login
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-400">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-lg bg-green-950/40 border border-green-800/40 text-xs text-green-300">
                  {successMsg}
                </div>
              )}

              {mode === 'register' ? (
                /* Register Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#D4D4DD] mb-1">
                      Username / GamerTag:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#9A9AA6] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. PASIYA_KILLER"
                        value={gamerTag}
                        onChange={(e) => setGamerTag(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060609] border border-[#23232B] focus:border-[#EF4444] text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D4D4DD] mb-1">
                      Password:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#9A9AA6] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Choose a password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#060609] border border-[#23232B] focus:border-[#EF4444] text-xs text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-7 h-7 absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#9A9AA6] hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D4D4DD] mb-1">
                      Free Fire UID (Game ID):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 284910482"
                      value={freeFireUid}
                      onChange={(e) => setFreeFireUid(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-[#060609] border border-[#23232B] focus:border-[#EF4444] text-xs text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D4D4DD] mb-1">
                      Your Phone Platform:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPlatform('android')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                          platform === 'android'
                            ? 'bg-[#22C55E]/15 border-[#22C55E] text-[#22C55E]'
                            : 'bg-[#060609] border-[#23232B] text-[#9A9AA6]'
                        }`}
                      >
                        <span>🤖 Android</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlatform('ios')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                          platform === 'ios'
                            ? 'bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444]'
                            : 'bg-[#060609] border-[#23232B] text-[#9A9AA6]'
                        }`}
                      >
                        <span>🍎 iPhone (iOS)</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#EF4444] text-white text-xs font-bold hover:bg-[#DC2626] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Create Account &amp; Activate App</span>
                  </button>
                </form>
              ) : (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#D4D4DD] mb-1">
                      Registered Username / GamerTag:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#9A9AA6] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Enter your Username..."
                        value={gamerTag}
                        onChange={(e) => setGamerTag(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060609] border border-[#23232B] focus:border-[#EF4444] text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D4D4DD] mb-1">
                      Password:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#9A9AA6] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#060609] border border-[#23232B] focus:border-[#EF4444] text-xs text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-7 h-7 absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#9A9AA6] hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#EF4444] text-white text-xs font-bold hover:bg-[#DC2626] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Login &amp; Enter</span>
                  </button>
                </form>
              )}

              {/* Quick Fill Options */}
              <div className="relative pt-2">
                <span className="relative z-10 px-2 bg-[#0B0B0F] text-[10px] text-[#6A6A78] uppercase font-mono block text-center mx-auto w-fit">
                  Or 1-Tap Cloud Fill
                </span>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#23232B]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSocialQuickFill('google')}
                  className="py-2 px-3 rounded-xl bg-[#060609] border border-[#23232B] hover:border-white/40 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="w-4 h-4 rounded-full bg-white text-black font-extrabold text-[10px] flex items-center justify-center">
                    G
                  </span>
                  <span>Google Fill</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialQuickFill('apple')}
                  className="py-2 px-3 rounded-xl bg-[#060609] border border-[#23232B] hover:border-white/40 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="text-white text-sm"></span>
                  <span>Apple Fill</span>
                </button>
              </div>

              {/* Owner Master Login Trigger */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinInput(true);
                    setErrorMsg('');
                  }}
                  className="text-[11px] text-[#EAB308] hover:text-[#CA8A04] font-medium flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>👑 Owner Master Access (PIN 7777)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
