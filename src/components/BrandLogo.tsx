import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
  fullEmblem?: boolean;
}

export const UPLOADED_LOGO_SRC = './logo.png';

/**
 * Displays the user's uploaded MP Free Fire emblem framed in a crisp black-and-red
 * tactical shield, with an inline geometric SVG fallback if offline/missing.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 32,
  animated = false,
  fullEmblem = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const gradId = React.useId();

  if (!imgFailed) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative shrink-0 overflow-hidden bg-black border border-[#EF4444]/60 shadow-[0_0_18px_rgba(239,68,68,0.22)] ${
          fullEmblem ? 'rounded-3xl' : 'rounded-lg'
        } ${animated ? 'logo-corners-pulse' : ''} ${className}`}
      >
        <img
          src={UPLOADED_LOGO_SRC}
          alt="MP Free Fire Logo"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className={`w-full h-full select-none ${
            fullEmblem
              ? 'object-contain p-1.5'
              : 'object-cover object-[52%_34%] scale-[1.48]'
          }`}
        />
        {/* Crisp tactical corner ticks */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-[#EF4444]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-white/80"
        />
      </div>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="16" y1="16" x2="104" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
      </defs>
      <rect
        x="6"
        y="6"
        width="108"
        height="108"
        rx="24"
        fill="#07070A"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="2.5"
      />
      <path
        d="M18 34V18H34M86 18H102V34M18 86V102H34M86 102H102V86"
        stroke="#EF4444"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'logo-corners-pulse' : ''}
      />
      <path
        d="M27 84V36H49.5C58.2 36 63.5 40.8 63.5 49.2C63.5 57.6 58.2 62.6 49.5 62.6H38.5V84H27ZM38.5 53.4H48.2C51.6 53.4 53.5 51.8 53.5 49.2C53.5 46.6 51.6 45 48.2 45H38.5V53.4Z"
        fill="#FFFFFF"
      />
      <path
        d="M62 84L68.5 36H79.5L86 60.5L92.5 36H103.5L97 84H87.2L89.6 58.5L83.2 80H78.2L73.6 58.5L71.2 84H62Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
};
