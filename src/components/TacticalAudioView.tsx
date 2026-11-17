import React, { useEffect, useRef, useState } from 'react';
import {
  Crosshair,
  Headphones,
  Play,
  RotateCcw,
  Square,
  Volume2,
} from 'lucide-react';
import {
  type AudioCueType,
  type AudioDirectionId,
  SPATIAL_DIRECTIONS,
  type SpatialDirectionSpec,
  azimuthToSpatialCoords,
  evaluateSoundStageAccuracy,
  playDirectionalTacticalCue,
} from '../lib/tacticalAudio';
import { triggerHaptic } from '../lib/haptics';
import { SlidingSegmentedControl } from './SlidingSegmentedControl';

const RADAR_POSITIONS: Record<
  AudioDirectionId,
  { leftPct: number; topPct: number }
> = {
  front: { leftPct: 50, topPct: 12 },
  'front-right': { leftPct: 77, topPct: 23 },
  right: { leftPct: 88, topPct: 50 },
  'rear-right': { leftPct: 77, topPct: 77 },
  rear: { leftPct: 50, topPct: 88 },
  'rear-left': { leftPct: 23, topPct: 77 },
  left: { leftPct: 12, topPct: 50 },
  'front-left': { leftPct: 23, topPct: 23 },
};

export const TacticalAudioView: React.FC = () => {
  const [cueType, setCueType] = useState<AudioCueType>('footsteps');
  const [activeDir, setActiveDir] = useState<SpatialDirectionSpec>(
    SPATIAL_DIRECTIONS[0]
  );
  const [pulseSeq, setPulseSeq] = useState(0);
  const [sweeping, setSweeping] = useState(false);

  // Blind Footstep Direction Test state
  const [blindTarget, setBlindTarget] = useState<SpatialDirectionSpec | null>(
    null
  );
  const [blindFeedback, setBlindFeedback] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hits, setHits] = useState(0);

  const sweepTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (sweepTimerRef.current !== null) {
        window.clearInterval(sweepTimerRef.current);
      }
    };
  }, []);

  const spatial = azimuthToSpatialCoords(activeDir.azimuthDeg);
  const stageReport = evaluateSoundStageAccuracy(attempts, hits);

  const stopSweep = () => {
    if (sweepTimerRef.current !== null) {
      window.clearInterval(sweepTimerRef.current);
      sweepTimerRef.current = null;
    }
    setSweeping(false);
  };

  const triggerDirectionCue = (dir: SpatialDirectionSpec) => {
    if (blindTarget) {
      const matched = dir.id === blindTarget.id;
      triggerHaptic(matched ? 'success' : 'warning');
      setAttempts((a) => a + 1);
      if (matched) setHits((h) => h + 1);
      setActiveDir(dir);
      setBlindFeedback(
        matched
          ? `Exact Lock: ${blindTarget.label} (${blindTarget.azimuthDeg}°)`
          : `Cue came from ${blindTarget.label} (${blindTarget.azimuthDeg}°) — you tapped ${dir.shortLabel}`
      );
      setBlindTarget(null);
      playDirectionalTacticalCue(dir.azimuthDeg, cueType);
      setPulseSeq((s) => s + 1);
      return;
    }

    stopSweep();
    triggerHaptic('detent');
    setBlindFeedback(null);
    setActiveDir(dir);
    setPulseSeq((s) => s + 1);
    playDirectionalTacticalCue(dir.azimuthDeg, cueType);
  };

  const handleToggleSweep = () => {
    if (sweeping) {
      triggerHaptic('impact');
      stopSweep();
      return;
    }

    triggerHaptic('action');
    setBlindTarget(null);
    setBlindFeedback(null);
    setSweeping(true);

    let step = 0;
    const first = SPATIAL_DIRECTIONS[0];
    setActiveDir(first);
    setPulseSeq((s) => s + 1);
    playDirectionalTacticalCue(first.azimuthDeg, cueType);

    sweepTimerRef.current = window.setInterval(() => {
      step = (step + 1) % SPATIAL_DIRECTIONS.length;
      const next = SPATIAL_DIRECTIONS[step];
      setActiveDir(next);
      setPulseSeq((s) => s + 1);
      playDirectionalTacticalCue(next.azimuthDeg, cueType);
      if (step === SPATIAL_DIRECTIONS.length - 1) {
        window.setTimeout(() => {
          stopSweep();
        }, 460);
      }
    }, 520);
  };

  const handleStartBlindTest = () => {
    stopSweep();
    triggerHaptic('action');
    const pool = SPATIAL_DIRECTIONS;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setBlindTarget(picked);
    setBlindFeedback('Listening... tap the compass node where you heard it.');
    setPulseSeq((s) => s + 1);
    playDirectionalTacticalCue(picked.azimuthDeg, cueType);
  };

  const handleReplayBlind = () => {
    if (!blindTarget) return;
    triggerHaptic('tap');
    setPulseSeq((s) => s + 1);
    playDirectionalTacticalCue(blindTarget.azimuthDeg, cueType);
  };

  const handleResetScore = () => {
    stopSweep();
    triggerHaptic('impact');
    setBlindTarget(null);
    setBlindFeedback(null);
    setAttempts(0);
    setHits(0);
  };

  return (
    <section
      aria-labelledby="tactical-audio-heading"
      className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#050507] border border-[#EF4444]/40 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5 text-[#EF4444]" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="tactical-audio-heading"
                className="text-lg sm:text-xl font-bold tracking-tight text-white"
              >
                Tactical 3D Audio Sound Stage
              </h2>
              <span className="text-[11px] font-mono-num font-bold text-[#EF4444]">
                HRTF Spatial Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#9A9AA6] mt-0.5">
              Test headset stereo separation &amp; front/rear Free Fire enemy footstep pinpointing
            </p>
          </div>
        </div>

        <SlidingSegmentedControl<AudioCueType>
          ariaLabel="Tactical audio cue sample"
          variant="crimson"
          layout="scrollable"
          className="max-w-full"
          value={cueType}
          onChange={setCueType}
          options={[
            {
              id: 'footsteps',
              label: 'Enemy Footsteps',
              testId: 'audio-cue-footsteps',
            },
            {
              id: 'gunshot',
              label: 'Suppressed AR',
              testId: 'audio-cue-gunshot',
            },
            {
              id: 'gloo-wall',
              label: 'Gloo Wall',
              testId: 'audio-cue-gloo',
            },
          ]}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive 360° Directional Compass Stage */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div
            data-testid="tactical-audio-radar"
            className="relative w-full max-w-[320px] sm:max-w-[350px] aspect-square rounded-full bg-[#050507] border border-[#23232B] shadow-[inset_0_0_40px_rgba(239,68,68,0.08)]"
          >
            {/* Concentric acoustic range rings */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[18%] rounded-full border border-[#23232B]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[36%] rounded-full border border-dashed border-[#2A2A34]"
            />
            {/* Crosshair N/S/E/W axes */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-4 left-1/2 -translate-x-1/2 w-px bg-[#1E1E26]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 h-px bg-[#1E1E26]"
            />

            {/* Directional emitter beam when active (hidden during blind guess) */}
            {!blindTarget && (
              <div
                aria-hidden="true"
                style={{
                  transform: `rotate(${activeDir.azimuthDeg}deg)`,
                }}
                className="pointer-events-none absolute inset-0 transition-transform duration-300 ease-out"
              >
                <div className="mx-auto mt-10 w-0.5 h-[36%] bg-gradient-to-t from-[#EF4444] via-[#EF4444]/60 to-transparent" />
              </div>
            )}

            {/* Center Listener Node */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#0B0B0F] border border-[#EF4444]/60 flex flex-col items-center justify-center">
              {pulseSeq > 0 && (
                <span
                  key={pulseSeq}
                  aria-hidden="true"
                  className="ff-shockwave absolute -inset-2 rounded-full border border-[#EF4444]/70"
                />
              )}
              <Volume2 className="w-4 h-4 text-white" aria-hidden="true" />
              <span className="text-[9px] font-mono-num text-[#9A9AA6] mt-0.5">
                YOU
              </span>
            </div>

            {/* 8 Interactive Compass Direction Nodes */}
            {SPATIAL_DIRECTIONS.map((dir) => {
              const pos = RADAR_POSITIONS[dir.id];
              const isSelected = !blindTarget && activeDir.id === dir.id;
              return (
                <button
                  key={dir.id}
                  type="button"
                  data-testid={`audio-dir-${dir.id}`}
                  aria-label={`Play 3D audio from ${dir.label}`}
                  aria-pressed={isSelected}
                  onClick={() => triggerDirectionCue(dir)}
                  style={{
                    left: `${pos.leftPct}%`,
                    top: `${pos.topPct}%`,
                  }}
                  className={`ios-spring-btn -translate-x-1/2 -translate-y-1/2 absolute min-w-[42px] min-h-[42px] px-2 rounded-full text-xs font-bold font-mono-num flex items-center justify-center cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#EF4444] text-white border border-white/80 shadow-[0_0_20px_rgba(239,68,68,0.45)]'
                      : 'bg-[#0B0B0F] text-[#C4C4CF] border border-[#2A2A34] hover:border-[#EF4444]/70 hover:text-white'
                  }`}
                >
                  {dir.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Primary Sweep & Blind Challenge Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              data-testid="audio-sweep-btn"
              onClick={handleToggleSweep}
              className={`ios-spring-btn min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                sweeping
                  ? 'bg-white text-[#050507]'
                  : 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
              }`}
            >
              {sweeping ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  Stop 360° Sweep
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  360° Orbit Sweep
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="audio-blind-test-btn"
              onClick={handleStartBlindTest}
              className="ios-spring-btn min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#13131A] border border-[#2A2A34] hover:border-[#EF4444]/70 text-xs font-bold text-white cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
              Blind Step Test
            </button>

            {blindTarget && (
              <button
                type="button"
                data-testid="audio-replay-blind-btn"
                onClick={handleReplayBlind}
                className="ios-spring-btn min-h-[42px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#050507] border border-[#EF4444]/60 text-xs font-bold text-white cursor-pointer"
              >
                Replay Cue
              </button>
            )}
          </div>
        </div>

        {/* Right: Channel Separation Telemetry + Tactical Callout + Accuracy Grade */}
        <div className="lg:col-span-6 space-y-4">
          {/* Active Direction Readout */}
          <div className="rounded-xl bg-[#060609] border border-[#23232B] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[#9A9AA6]">
                Active Emitter Vector
              </span>
              <span
                data-testid="audio-active-azimuth"
                className="text-xs font-bold font-mono-num text-[#EF4444]"
              >
                {blindTarget ? 'HIDDEN TARGET' : `${activeDir.azimuthDeg}°`}
              </span>
            </div>
            <div className="mt-1 text-base font-bold text-white">
              {blindTarget ? 'Blind Sound-Stage Challenge Active' : activeDir.label}
            </div>
            <p className="mt-1 text-xs text-[#C4C4CF]">
              {blindFeedback ?? activeDir.tacticalCallout}
            </p>
          </div>

          {/* Left / Right Channel Balance & Occlusion Depth */}
          <div className="rounded-xl bg-[#060609] border border-[#23232B] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                Stereo Channel Separation
              </span>
              <span className="font-mono-num text-[#9A9AA6]">
                Filter {spatial.lowpassHz} Hz {spatial.isRear ? '· Rear Occluded' : '· Direct Front'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono-num text-[#C4C4CF] mb-1">
                  <span>Left Ear (L)</span>
                  <span className="text-white font-bold">
                    {blindTarget ? '—' : `${spatial.leftGainPct}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#13131A] overflow-hidden">
                  <div
                    style={{
                      width: `${blindTarget ? 50 : spatial.leftGainPct}%`,
                    }}
                    className="h-full rounded-full bg-white transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-mono-num text-[#C4C4CF] mb-1">
                  <span>Right Ear (R)</span>
                  <span className="text-white font-bold">
                    {blindTarget ? '—' : `${spatial.rightGainPct}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#13131A] overflow-hidden">
                  <div
                    style={{
                      width: `${blindTarget ? 50 : spatial.rightGainPct}%`,
                    }}
                    className="h-full rounded-full bg-[#EF4444] transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Blind Pinpointing Accuracy Card */}
          <div className="rounded-xl bg-[#060609] border border-[#23232B] p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#9A9AA6]">
                  Sound Stage Score
                </div>
                <div
                  data-testid="audio-accuracy-readout"
                  className="mt-0.5 text-sm font-bold text-white"
                >
                  {stageReport.verdict}
                  {attempts > 0 ? (
                    <span className="ml-2 font-mono-num text-[#EF4444]">
                      {stageReport.accuracyPct}% ({hits}/{attempts})
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                aria-label="Reset audio test score"
                onClick={handleResetScore}
                className="min-h-[36px] min-w-[36px] rounded-lg bg-[#13131A] border border-[#2A2A34] text-[#9A9AA6] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[#9A9AA6] leading-relaxed">
              {stageReport.diagnostic}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
