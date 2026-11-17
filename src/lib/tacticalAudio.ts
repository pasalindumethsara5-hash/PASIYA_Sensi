export type AudioDirectionId =
  | 'front'
  | 'front-right'
  | 'right'
  | 'rear-right'
  | 'rear'
  | 'rear-left'
  | 'left'
  | 'front-left';

export type AudioCueType = 'footsteps' | 'gunshot' | 'gloo-wall';

export interface SpatialDirectionSpec {
  id: AudioDirectionId;
  label: string;
  shortLabel: string;
  azimuthDeg: number;
  tacticalCallout: string;
}

export const SPATIAL_DIRECTIONS: SpatialDirectionSpec[] = [
  {
    id: 'front',
    label: 'Front (12 o’clock)',
    shortLabel: 'F',
    azimuthDeg: 0,
    tacticalCallout: 'Pre-aim collarbone ahead — hold crouch ready.',
  },
  {
    id: 'front-right',
    label: 'Front-Right',
    shortLabel: 'FR',
    azimuthDeg: 45,
    tacticalCallout: 'Right-hand peek push — favor right gloo wall.',
  },
  {
    id: 'right',
    label: 'Hard Right (3 o’clock)',
    shortLabel: 'R',
    azimuthDeg: 90,
    tacticalCallout: '90° right flank — snap X-drag clockwise.',
  },
  {
    id: 'rear-right',
    label: 'Rear-Right',
    shortLabel: 'RR',
    azimuthDeg: 135,
    tacticalCallout: 'Back-right third-party push — sprint + rear gloo.',
  },
  {
    id: 'rear',
    label: 'Behind (6 o’clock)',
    shortLabel: 'B',
    azimuthDeg: 180,
    tacticalCallout: 'Enemy directly behind — jump-turn 180° gloo cover.',
  },
  {
    id: 'rear-left',
    label: 'Rear-Left',
    shortLabel: 'RL',
    azimuthDeg: 225,
    tacticalCallout: 'Blind-side left flank — strafe right and drop cover.',
  },
  {
    id: 'left',
    label: 'Hard Left (9 o’clock)',
    shortLabel: 'L',
    azimuthDeg: 270,
    tacticalCallout: '90° left push — swing camera left cleanly.',
  },
  {
    id: 'front-left',
    label: 'Front-Left',
    shortLabel: 'FL',
    azimuthDeg: 315,
    tacticalCallout: 'Left angle advance — watch right-shoulder exposure.',
  },
];

export interface SpatialAudioMetrics {
  x: number;
  y: number;
  z: number;
  pan: number;
  leftGainPct: number;
  rightGainPct: number;
  isRear: boolean;
  lowpassHz: number;
}

export function azimuthToSpatialCoords(
  azimuthDeg: number,
  distanceM: number = 3.2
): SpatialAudioMetrics {
  const rad = (azimuthDeg * Math.PI) / 180;
  const rawX = Math.sin(rad) * distanceM;
  const rawZ = -Math.cos(rad) * distanceM;
  const x = Math.abs(rawX) < 1e-6 ? 0 : Number(rawX.toFixed(3));
  const z = Math.abs(rawZ) < 1e-6 ? 0 : Number(rawZ.toFixed(3));
  const pan = Number(Math.sin(rad).toFixed(3));

  // Equal-power stereo balance percentages for visual diagnostics
  const theta = ((pan + 1) * Math.PI) / 4;
  const leftAmp = Math.cos(theta);
  const rightAmp = Math.sin(theta);
  const totalPower = leftAmp + rightAmp || 1;
  const leftGainPct = Math.round((leftAmp / totalPower) * 100);
  const rightGainPct = 100 - leftGainPct;

  // Free Fire front vs rear occlusion simulation (rear steps sound slightly darker)
  const frontness = Math.cos(rad); // 1 = front, -1 = rear
  const isRear = frontness < -0.15;
  const lowpassHz = Math.round(4800 + frontness * 2300);

  return {
    x,
    y: 0,
    z,
    pan,
    leftGainPct,
    rightGainPct,
    isRear,
    lowpassHz,
  };
}

export interface SoundStageReport {
  accuracyPct: number;
  verdict: string;
  diagnostic: string;
}

export function evaluateSoundStageAccuracy(
  attempts: number,
  hits: number
): SoundStageReport {
  if (attempts === 0) {
    return {
      accuracyPct: 0,
      verdict: 'Ready to Calibrate',
      diagnostic:
        'Use headphones / IEMs, tap Start Blind Test, and click the direction you hear.',
    };
  }
  const accuracyPct = Math.min(100, Math.max(0, Math.round((hits / attempts) * 100)));
  if (accuracyPct >= 80 && attempts >= 3) {
    return {
      accuracyPct,
      verdict: 'Tournament Stereo Lock',
      diagnostic:
        'Crisp Left/Right separation & front-rear depth. Headset is tournament ready.',
    };
  }
  if (accuracyPct >= 80) {
    return {
      accuracyPct,
      verdict: 'Directional Lock Verified',
      diagnostic:
        'Clean stereo hit — test 3+ rounds across Left, Right, and Rear to confirm 360° separation.',
    };
  }
  if (accuracyPct >= 50) {
    return {
      accuracyPct,
      verdict: 'Moderate Spatial Separation',
      diagnostic:
        'Disable phone Mono Audio or Dolby virtual surround enhancements for cleaner steps.',
    };
  }
  return {
    accuracyPct,
    verdict: 'Check Earbuds / Mono Setting',
    diagnostic:
      'Low directional accuracy detected. Confirm L/R earbuds are worn properly and Mono Audio is OFF.',
  };
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new Ctor();
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => {
      // Ignore autoplay lock errors cleanly
    });
  }
  return sharedAudioCtx;
}

function createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function playDirectionalTacticalCue(
  azimuthDeg: number,
  cueType: AudioCueType = 'footsteps'
): SpatialAudioMetrics {
  const spatial = azimuthToSpatialCoords(azimuthDeg);
  const ctx = getAudioContext();
  if (!ctx) return spatial;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.85, now);

    // Real HRTF 3D spatial panner when available, with StereoPanner fallback
    let outputTarget: AudioNode = masterGain;
    if (typeof ctx.createPanner === 'function') {
      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 20;
      panner.rolloffFactor = 1.1;
      if (panner.positionX) {
        panner.positionX.setValueAtTime(spatial.x, now);
        panner.positionY.setValueAtTime(spatial.y, now);
        panner.positionZ.setValueAtTime(spatial.z, now);
      } else {
        panner.setPosition(spatial.x, spatial.y, spatial.z);
      }
      panner.connect(masterGain);
      outputTarget = panner;
    } else if (typeof ctx.createStereoPanner === 'function') {
      const stereo = ctx.createStereoPanner();
      stereo.pan.setValueAtTime(spatial.pan, now);
      stereo.connect(masterGain);
      outputTarget = stereo;
    }

    const occlusionFilter = ctx.createBiquadFilter();
    occlusionFilter.type = 'lowpass';
    occlusionFilter.frequency.setValueAtTime(spatial.lowpassHz, now);
    occlusionFilter.connect(outputTarget);

    masterGain.connect(ctx.destination);

    const scheduleNoiseBurst = (
      offsetSec: number,
      durSec: number,
      bandHz: number,
      q: number,
      peakGain: number
    ) => {
      const src = ctx.createBufferSource();
      src.buffer = createNoiseBuffer(ctx, durSec);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(bandHz, now + offsetSec);
      bp.Q.setValueAtTime(q, now + offsetSec);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now + offsetSec);
      g.gain.exponentialRampToValueAtTime(peakGain, now + offsetSec + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + offsetSec + durSec);

      src.connect(bp);
      bp.connect(g);
      g.connect(occlusionFilter);
      src.start(now + offsetSec);
      src.stop(now + offsetSec + durSec + 0.01);
    };

    const scheduleThump = (
      offsetSec: number,
      startFreq: number,
      endFreq: number,
      durSec: number,
      peakGain: number
    ) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, now + offsetSec);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(28, endFreq),
        now + offsetSec + durSec
      );
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now + offsetSec);
      g.gain.exponentialRampToValueAtTime(peakGain, now + offsetSec + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + offsetSec + durSec);

      osc.connect(g);
      g.connect(occlusionFilter);
      osc.start(now + offsetSec);
      osc.stop(now + offsetSec + durSec + 0.02);
    };

    if (cueType === 'footsteps') {
      // 3 brisk enemy sprint footsteps
      [0, 0.19, 0.38].forEach((offset, idx) => {
        const emphasis = idx === 1 ? 0.88 : 1.0;
        scheduleThump(offset, 138, 46, 0.095, 0.45 * emphasis);
        scheduleNoiseBurst(offset + 0.005, 0.085, 2200, 1.4, 0.42 * emphasis);
      });
    } else if (cueType === 'gunshot') {
      // Crisp suppressed AR 3-round tap
      [0, 0.11, 0.22].forEach((offset) => {
        scheduleThump(offset, 290, 62, 0.065, 0.42);
        scheduleNoiseBurst(offset, 0.09, 3400, 1.1, 0.56);
      });
    } else {
      // Gloo wall crystalline thud & deploy shimmer
      scheduleThump(0, 170, 38, 0.16, 0.55);
      scheduleNoiseBurst(0.01, 0.18, 1750, 2.2, 0.46);
      scheduleThump(0.09, 520, 310, 0.11, 0.18);
    }
  } catch {
    // Graceful no-op when audio device is restricted
  }

  return spatial;
}
