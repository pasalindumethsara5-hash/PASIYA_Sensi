import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { UPLOADED_LOGO_SRC } from './BrandLogo';
import { WhatsAppLogoIcon } from './DeveloperContactCard';
import {
  OWNER_CONTACT,
  buildMailtoUrl,
  buildWhatsAppChatUrl,
} from '../lib/contact';
import { triggerHaptic } from '../lib/haptics';

interface SplashIntroProps {
  onComplete: () => void;
}

export const SplashIntro: React.FC<SplashIntroProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return true;
  });
  const [exiting, setExiting] = useState(false);
  const completedRef = useRef(false);
  const dismissTimerRef = useRef<number | null>(null);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!visible) {
      finishIntro();
      return;
    }
    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, 3100);
    const doneTimer = window.setTimeout(() => {
      setVisible(false);
      finishIntro();
    }, 3550);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, [visible, finishIntro]);

  const handleDismiss = () => {
    triggerHaptic('action');
    setExiting(true);
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      finishIntro();
    }, 220);
  };

  if (!visible) return null;

  return (
    <div
      data-testid="splash-intro"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050507] px-6 overflow-hidden transition-opacity duration-400 ease-out ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Tactical Crimson & White Arena Spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.28)_0%,rgba(255,255,255,0.06)_26%,rgba(5,5,7,0.98)_68%)]"
      />

      {/* Precision Crosshair Axis Lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-[#EF4444]/35 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent"
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Counter-Rotating Free Fire Scope Reticles + Shockwave + Uploaded Logo */}
        <div className="relative flex items-center justify-center">
          {/* Expanding Target-Lock Shockwave */}
          <div
            aria-hidden="true"
            className="ff-shockwave absolute -inset-4 rounded-full border border-[#EF4444]/50"
          />

          {/* Outer Rotating Dashed Rangefinder Ring */}
          <svg
            viewBox="0 0 240 240"
            className="ff-splash-spin-cw absolute -inset-7 w-[calc(100%+56px)] h-[calc(100%+56px)] pointer-events-none"
            aria-hidden="true"
          >
            <circle
              cx="120"
              cy="120"
              r="112"
              stroke="rgba(239,68,68,0.45)"
              strokeWidth="1.25"
              strokeDasharray="14 10 4 10"
              fill="none"
            />
          </svg>

          {/* Inner Counter-Rotating Tactical Quadrant Arcs */}
          <svg
            viewBox="0 0 220 220"
            className="ff-splash-spin-ccw absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] pointer-events-none"
            aria-hidden="true"
          >
            <path
              d="M110 10 A100 100 0 0 1 200 72 M210 110 A100 100 0 0 1 148 202 M110 210 A100 100 0 0 1 20 148 M10 110 A100 100 0 0 1 72 18"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Uploaded MP Free Fire Logo Emblem Frame */}
          <div className="splash-pm-reveal relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-black border border-[#EF4444]/70 overflow-hidden shadow-[0_0_64px_rgba(239,68,68,0.42)]">
            <img
              src={UPLOADED_LOGO_SRC}
              alt="MP Free Fire Official Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain p-2 select-none"
            />

            {/* Diagonal Laser Gleam Sweep Across Logo */}
            <div
              aria-hidden="true"
              className="ff-logo-laser pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/30 to-[#EF4444]/30 blur-[1px]"
            />

            {/* Corner Lock Brackets */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#EF4444]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/80"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/80"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#EF4444]"
            />
          </div>
        </div>

        {/* Brand Title */}
        <div className="splash-title-reveal mt-7">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            PASIYA <span className="text-[#EF4444]">Sensi</span>
          </h1>
          <p className="mt-1.5 text-xs font-medium tracking-[0.22em] uppercase text-[#C4C4CF]">
            Free Fire Pro Calibrator · Android &amp; iOS
          </p>

          {/* Created / Owned By Credit */}
          <div
            data-testid="splash-owner-credit"
            className="mt-4 inline-flex flex-col items-center rounded-xl bg-[#0B0B0F]/95 border border-[#EF4444]/40 px-4 py-2"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#EF4444]">
              {OWNER_CONTACT.creditLabel}
            </span>
            <span className="mt-0.5 text-sm font-bold text-white">
              {OWNER_CONTACT.ownerCredit}
            </span>
          </div>
        </div>

        {/* Tactical Crimson-to-White Energy Progress Bar */}
        <div className="mt-5 w-56 h-1 rounded-full bg-[#16161D] overflow-hidden border border-[#23232B]">
          <div className="splash-sweep-reveal h-full w-full origin-left rounded-full bg-gradient-to-r from-[#991B1B] via-[#EF4444] to-white" />
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="ff-btn-sheen splash-skip-reveal mt-6 min-h-[42px] px-6 py-2 rounded-xl bg-[#0B0B0F] border border-[#EF4444]/50 text-xs font-bold text-white hover:border-white/70 transition-colors cursor-pointer"
        >
          Enter Arena
        </button>

        {/* Direct WhatsApp + Email Links */}
        <div className="splash-skip-reveal mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <a
            href={buildWhatsAppChatUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('action')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D1F15] border border-[#25D366]/50 text-[11px] font-semibold text-white hover:border-[#25D366] transition-colors"
          >
            <WhatsAppLogoIcon className="w-4 h-4 shrink-0" />
            <span className="font-mono-num">{OWNER_CONTACT.phoneLocal}</span>
          </a>
          <a
            href={buildMailtoUrl()}
            onClick={() => triggerHaptic('selection')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0B0F] border border-[#23232B] text-[11px] font-medium text-[#C4C4CF] hover:text-white hover:border-[#EF4444]/50 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-[#EF4444] shrink-0" aria-hidden="true" />
            <span>{OWNER_CONTACT.email}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
