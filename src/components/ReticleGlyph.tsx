import React from 'react';
import type { ReticleOverlayConfig, ReticleShapeId } from '../lib/aimAssist';

interface ReticleGlyphProps {
  reticle: ReticleOverlayConfig;
  bloomRadiusPx?: number;
  showBloomRing?: boolean;
  size?: number;
}

const renderShapeSvg = (
  shape: ReticleShapeId,
  color: string,
  g: number,
  showCenterDot: boolean
) => {
  const arm = 12;
  const bracketLen = 7;

  return (
    <>
      {shape === 'precision-dot' && (
        <>
          <line x1={-(g + arm)} y1="0" x2={-g} y2="0" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1={g} y1="0" x2={g + arm} y2="0" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1={g} x2="0" y2={g + arm} stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1={-(g + 6)} x2="0" y2={-g} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}

      {shape === 'chevron-head' && (
        <>
          <polyline
            points={`${-(g + 9)},${g + 5} 0,${-Math.max(3, g * 0.45)} ${g + 9},${g + 5}`}
            fill="none"
            stroke={color}
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1={-(g + 16)} y1="0" x2={-(g + 7)} y2="0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1={g + 7} y1="0" x2={g + 16} y2="0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="0" y1={g + 8} x2="0" y2={g + 16} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      {shape === 'smg-circle' && (
        <>
          <circle
            cx="0"
            cy="0"
            r={Math.max(10, g + 8)}
            fill="none"
            stroke={color}
            strokeWidth="1.9"
          />
          <line x1={-(g + 16)} y1="0" x2={-(g + 9)} y2="0" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1={g + 9} y1="0" x2={g + 16} y2="0" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1={-(g + 16)} x2="0" y2={-(g + 9)} stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1={g + 9} x2="0" y2={g + 16} stroke={color} strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {shape === 'smg-rush-brackets' && (
        <>
          {/* Corner CQB Spray Brackets */}
          <path
            d={`M ${-(g + 8)} ${-(g + 8 - bracketLen)} L ${-(g + 8)} ${-(g + 8)} L ${-(g + 8 - bracketLen)} ${-(g + 8)}`}
            fill="none"
            stroke={color}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M ${g + 8 - bracketLen} ${-(g + 8)} L ${g + 8} ${-(g + 8)} L ${g + 8} ${-(g + 8 - bracketLen)}`}
            fill="none"
            stroke={color}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M ${-(g + 8)} ${g + 8 - bracketLen} L ${-(g + 8)} ${g + 8} L ${-(g + 8 - bracketLen)} ${g + 8}`}
            fill="none"
            stroke={color}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M ${g + 8 - bracketLen} ${g + 8} L ${g + 8} ${g + 8} L ${g + 8} ${g + 8 - bracketLen}`}
            fill="none"
            stroke={color}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Subtle Side Reference Ticks */}
          <line x1={-(g + 14)} y1="0" x2={-(g + 10)} y2="0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
          <line x1={g + 10} y1="0" x2={g + 14} y2="0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
          <line x1="0" y1={-(g + 13)} x2="0" y2={-(g + 9)} stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}

      {shape === 'red-dot-holo' && (
        <>
          <circle
            cx="0"
            cy="0"
            r={Math.max(11, g + 9)}
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            strokeDasharray="11 6"
          />
          <line x1={-(g + 18)} y1="0" x2={-(g + 10)} y2="0" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1={g + 10} y1="0" x2={g + 18} y2="0" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1={-(g + 18)} x2="0" y2={-(g + 10)} stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1={g + 10} x2="0" y2={g + 18} stroke={color} strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {shape === 'tactical-cross' && (
        <>
          <line x1={-(g + 18)} y1="0" x2={-g} y2="0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1={g} y1="0" x2={g + 18} y2="0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="0" y1={-(g + 18)} x2="0" y2={-g} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="0" y1={g} x2="0" y2={g + 22} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="0" cy={g + 7} r="1.4" fill={color} />
          <circle cx="0" cy={g + 14} r="1.4" fill={color} />
          <circle cx={-(g + 8)} cy="0" r="1.2" fill={color} />
          <circle cx={g + 8} cy="0" r="1.2" fill={color} />
        </>
      )}

      {shape === 'sniper-mil-range' && (
        <>
          {/* Fine Inner Cross Hairlines */}
          <line x1={-(g + 14)} y1="0" x2={-g} y2="0" stroke={color} strokeWidth="1.25" />
          <line x1={g} y1="0" x2={g + 14} y2="0" stroke={color} strokeWidth="1.25" />
          <line x1="0" y1={-(g + 14)} x2="0" y2={-g} stroke={color} strokeWidth="1.25" />
          <line x1="0" y1={g} x2="0" y2={g + 18} stroke={color} strokeWidth="1.25" />
          {/* Heavy Outer Stadia Posts */}
          <line x1={-(g + 28)} y1="0" x2={-(g + 16)} y2="0" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <line x1={g + 16} y1="0" x2={g + 28} y2="0" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <line x1="0" y1={g + 19} x2="0" y2={g + 29} stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          {/* Ballistic Drop Ticks */}
          <line x1="-4" y1={g + 5} x2="4" y2={g + 5} stroke={color} strokeWidth="1.3" />
          <line x1="-6" y1={g + 10} x2="6" y2={g + 10} stroke={color} strokeWidth="1.3" />
          <line x1="-3.5" y1={g + 15} x2="3.5" y2={g + 15} stroke={color} strokeWidth="1.3" />
          {/* Scope Ring Arc */}
          <circle
            cx="0"
            cy="0"
            r={Math.max(20, g + 16)}
            fill="none"
            stroke={color}
            strokeOpacity="0.48"
            strokeWidth="1"
          />
        </>
      )}

      {shape === 'booyah-diamond' && (
        <>
          <polygon
            points={`0,${-(g + 12)} ${g + 12},0 0,${g + 12} ${-(g + 12)},0`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <line x1={-(g + 20)} y1="0" x2={-(g + 13)} y2="0" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1={g + 13} y1="0" x2={g + 20} y2="0" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {showCenterDot && (
        <circle
          cx="0"
          cy="0"
          r={shape === 'sniper-mil-range' ? 1.8 : 2.3}
          fill={color}
          stroke="#050507"
          strokeWidth="0.7"
        />
      )}
    </>
  );
};

export const ReticleGlyph: React.FC<ReticleGlyphProps> = ({
  reticle,
  bloomRadiusPx = 14,
  showBloomRing = true,
  size = 120,
}) => {
  const { shape, color, scale, gapPx, opacityPct, showCenterDot } = reticle;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-60 -60 120 120"
      style={{
        transform: `scale(${scale})`,
        opacity: opacityPct / 100,
        filter: 'drop-shadow(0 0 1.4px rgba(0,0,0,0.92))',
      }}
      className="pointer-events-none transition-transform duration-150 ease-out"
      aria-hidden="true"
    >
      {showBloomRing && (
        <circle
          cx="0"
          cy="0"
          r={Math.max(8, bloomRadiusPx)}
          fill="none"
          stroke={color}
          strokeOpacity="0.24"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
      )}
      {renderShapeSvg(shape, color, gapPx, showCenterDot)}
    </svg>
  );
};

export const ReticleMiniIcon: React.FC<{
  shape: ReticleShapeId;
  color: string;
}> = ({ shape, color }) => (
  <svg
    width="26"
    height="26"
    viewBox="-40 -40 80 80"
    className="shrink-0"
    aria-hidden="true"
  >
    {renderShapeSvg(shape, color, 5, true)}
  </svg>
);
