import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { triggerHaptic } from '../lib/haptics';

export interface SegmentedOption<T extends string> {
  id: T;
  label: React.ReactNode;
  ariaLabel?: string;
  testId?: string;
}

interface SlidingSegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  variant?: 'crimson' | 'white' | 'surface';
  layout?: 'inline' | 'grid' | 'scrollable';
  className?: string;
  buttonClassName?: string;
  pillRadiusClass?: string;
}

export function SlidingSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  variant = 'crimson',
  layout = 'inline',
  className = '',
  buttonClassName = '',
  pillRadiusClass = 'rounded-lg',
}: SlidingSegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({ left: 0, top: 0, width: 0, height: 0, ready: false });

  const measure = useCallback(() => {
    const activeBtn = btnRefs.current[value];
    if (!activeBtn) {
      setIndicator((prev) => (prev.ready ? { ...prev, ready: false } : prev));
      return;
    }
    setIndicator({
      left: activeBtn.offsetLeft,
      top: activeBtn.offsetTop,
      width: activeBtn.offsetWidth,
      height: activeBtn.offsetHeight,
      ready: true,
    });
  }, [value]);

  useLayoutEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, options.length]);

  const handleSelect = (id: T) => {
    if (id === value) return;
    triggerHaptic('selection');
    onChange(id);
    if (layout === 'scrollable') {
      const btn = btnRefs.current[id];
      btn?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  const containerLayoutClass =
    layout === 'grid'
      ? 'grid gap-1.5'
      : layout === 'scrollable'
        ? 'flex items-center gap-1.5 overflow-x-auto no-scrollbar'
        : 'inline-flex items-center gap-1';

  const indicatorToneClass =
    variant === 'white'
      ? 'bg-white shadow-[0_4px_16px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/40'
      : variant === 'surface'
        ? 'bg-[#190B0E] border border-[#EF4444]/65 shadow-[0_0_16px_rgba(239,68,68,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]'
        : 'bg-gradient-to-r from-[#EF4444] to-[#DC2626] border border-white/25 shadow-[0_4px_20px_rgba(239,68,68,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]';

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={ariaLabel}
      style={
        layout === 'grid'
          ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }
          : undefined
      }
      className={`relative ${containerLayoutClass} p-1 rounded-xl bg-[#0B0B0F] border border-[#23232B] ${className}`}
    >
      {/* iOS-smooth sliding pill indicator */}
      <div
        aria-hidden="true"
        style={{
          transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`,
          width: `${indicator.width}px`,
          height: `${indicator.height}px`,
          opacity: indicator.ready ? 1 : 0,
        }}
        className={`ios-spring-indicator pointer-events-none absolute top-0 left-0 ${pillRadiusClass} ${indicatorToneClass}`}
      />

      {options.map((opt) => {
        const isActive = opt.id === value;
        const activeTextClass =
          variant === 'white' ? 'text-[#050507]' : 'text-white';
        const idleTextClass = 'text-[#9A9AA6] hover:text-white';

        return (
          <button
            key={opt.id}
            ref={(node) => {
              btnRefs.current[opt.id] = node;
            }}
            type="button"
            data-testid={opt.testId}
            aria-label={opt.ariaLabel}
            aria-pressed={isActive}
            onClick={() => handleSelect(opt.id)}
            className={`ios-spring-btn relative z-10 min-h-[36px] px-3.5 py-1.5 ${pillRadiusClass} text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
              isActive ? activeTextClass : idleTextClass
            } ${buttonClassName}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
