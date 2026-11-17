import React from 'react';

const EMBERS = [
  { left: '5%', delay: '0s', duration: '8.5s', size: 4, white: false },
  { left: '12%', delay: '1.8s', duration: '11s', size: 3, white: true },
  { left: '19%', delay: '0.6s', duration: '10s', size: 5, white: false },
  { left: '28%', delay: '3.2s', duration: '12s', size: 3, white: true },
  { left: '36%', delay: '1.1s', duration: '9.2s', size: 4, white: false },
  { left: '44%', delay: '2.5s', duration: '10.6s', size: 5, white: true },
  { left: '53%', delay: '0.4s', duration: '9.8s', size: 4, white: false },
  { left: '62%', delay: '3.9s', duration: '11.8s', size: 3, white: true },
  { left: '70%', delay: '1.4s', duration: '9.4s', size: 5, white: false },
  { left: '79%', delay: '2.8s', duration: '10.9s', size: 4, white: true },
  { left: '87%', delay: '0.9s', duration: '10.4s', size: 4, white: false },
  { left: '94%', delay: '3.5s', duration: '11.5s', size: 3, white: true },
];

export const AnimatedBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050507]"
    >
      {/* Drifting Radiant Crimson, Ruby & Violet Depth Orbs for Frosted Glass Refraction */}
      <div
        className="ambient-glow-a absolute -top-40 -left-24 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.06) 50%, transparent 70%)',
        }}
      />
      <div
        className="ambient-glow-b absolute top-1/4 -right-32 w-[550px] h-[550px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.14) 0%, rgba(239, 68, 68, 0.05) 50%, transparent 70%)',
        }}
      />
      <div
        className="ambient-glow-a absolute top-2/3 -left-36 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(239, 68, 68, 0.04) 50%, transparent 70%)',
        }}
      />
      <div
        className="ambient-glow-b absolute -bottom-48 right-16 w-[550px] h-[550px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, rgba(255, 255, 255, 0.03) 50%, transparent 70%)',
        }}
      />

      {/* Precision Dark-Black Rangefinder Grid with White/Red Hairlines */}
      <div
        className="absolute inset-0 opacity-[0.24]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(239, 68, 68, 0.14) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 90% 80% at 50% 35%, black 32%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 80% at 50% 35%, black 32%, transparent 100%)',
        }}
      />

      {/* Giant Corner Free Fire Tactical Crosshair / Scope HUD Rings */}
      <svg
        viewBox="0 0 420 420"
        className="ff-reticle-spin-cw absolute -top-36 -right-36 w-[520px] h-[520px] opacity-[0.11]"
        fill="none"
      >
        <circle
          cx="210"
          cy="210"
          r="185"
          stroke="#EF4444"
          strokeWidth="1.2"
          strokeDasharray="18 14 4 14"
        />
        <circle
          cx="210"
          cy="210"
          r="138"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeDasharray="6 18"
        />
        <path
          d="M210 12V48M210 372V408M12 210H48M372 210H408"
          stroke="#EF4444"
          strokeWidth="2"
        />
      </svg>

      <svg
        viewBox="0 0 360 360"
        className="ff-reticle-spin-ccw absolute -bottom-32 -left-32 w-[460px] h-[460px] opacity-[0.09]"
        fill="none"
      >
        <circle
          cx="180"
          cy="180"
          r="156"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeDasharray="24 12 6 12"
        />
        <circle
          cx="180"
          cy="180"
          r="112"
          stroke="#EF4444"
          strokeWidth="1.2"
          strokeDasharray="10 14"
        />
        <polygon
          points="180,38 186,52 174,52"
          fill="#EF4444"
        />
        <polygon
          points="180,322 186,308 174,308"
          fill="#FFFFFF"
        />
      </svg>

      {/* Diagonal Red-to-White Tactical Sweep Beam */}
      <div className="backdrop-scan absolute -top-1/2 left-0 w-48 h-[200%] bg-gradient-to-r from-transparent via-[#EF4444]/[0.08] to-white/[0.045] blur-2xl" />

      {/* Horizontal Tactical Target-Lock Scanline */}
      <div className="ff-scanline-y absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#EF4444]/65 to-transparent shadow-[0_0_16px_rgba(239,68,68,0.55)]" />

      {/* Rising Glowing Crimson & White Combat Sparks */}
      {EMBERS.map((ember, idx) => (
        <span
          key={idx}
          style={{
            left: ember.left,
            width: `${ember.size}px`,
            height: `${ember.size}px`,
            animationDelay: ember.delay,
            animationDuration: ember.duration,
            boxShadow: ember.white
              ? '0 0 11px rgba(255,255,255,0.72)'
              : '0 0 13px rgba(239,68,68,0.9)',
          }}
          className={`crimson-ember absolute -bottom-6 rounded-full ${
            ember.white ? 'bg-white' : 'bg-[#EF4444]'
          }`}
        />
      ))}
    </div>
  );
};
