import { Capacitor, registerPlugin } from '@capacitor/core';
import type { ReticleOverlayConfig } from './aimAssist';

interface NativeCrosshairPlugin {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ requested: boolean }>;
  startOverlay(options: {
    shape: string;
    color: string;
    gapPx: number;
    scale: number;
    opacity: number;
    showCenterDot: boolean;
  }): Promise<{ success: boolean }>;
  stopOverlay(): Promise<{ success: boolean }>;
  updateOverlay(options: {
    shape: string;
    color: string;
    gapPx: number;
    scale: number;
    opacity: number;
    showCenterDot: boolean;
  }): Promise<{ success: boolean }>;
  isRunning(): Promise<{ running: boolean }>;
}

const NativeCrosshair = registerPlugin<NativeCrosshairPlugin>('NativeCrosshair');

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

export const checkOverlayPermission = async (): Promise<boolean> => {
  if (!isNativeAndroid()) return true;
  try {
    const result = await NativeCrosshair.checkPermission();
    return Boolean(result?.granted);
  } catch (err) {
    console.warn('[NativeCrosshair] checkPermission error:', err);
    return false;
  }
};

export const requestOverlayPermission = async (): Promise<void> => {
  if (!isNativeAndroid()) return;
  try {
    await NativeCrosshair.requestPermission();
  } catch (err) {
    console.warn('[NativeCrosshair] requestPermission error:', err);
  }
};

export const startNativeOverlay = async (
  reticle: ReticleOverlayConfig
): Promise<boolean> => {
  if (!isNativeAndroid()) return false;
  try {
    const granted = await checkOverlayPermission();
    if (!granted) {
      await requestOverlayPermission();
      return false;
    }

    const res = await NativeCrosshair.startOverlay({
      shape: reticle.shape,
      color: reticle.color,
      gapPx: reticle.gapPx,
      scale: reticle.scale,
      opacity: reticle.opacityPct / 100,
      showCenterDot: reticle.showCenterDot,
    });
    return Boolean(res?.success);
  } catch (err) {
    console.warn('[NativeCrosshair] startOverlay error:', err);
    return false;
  }
};

export const updateNativeOverlay = async (
  reticle: ReticleOverlayConfig
): Promise<boolean> => {
  if (!isNativeAndroid()) return false;
  try {
    const res = await NativeCrosshair.updateOverlay({
      shape: reticle.shape,
      color: reticle.color,
      gapPx: reticle.gapPx,
      scale: reticle.scale,
      opacity: reticle.opacityPct / 100,
      showCenterDot: reticle.showCenterDot,
    });
    return Boolean(res?.success);
  } catch (err) {
    console.warn('[NativeCrosshair] updateOverlay error:', err);
    return false;
  }
};

export const stopNativeOverlay = async (): Promise<boolean> => {
  if (!isNativeAndroid()) return false;
  try {
    const res = await NativeCrosshair.stopOverlay();
    return Boolean(res?.success);
  } catch (err) {
    console.warn('[NativeCrosshair] stopOverlay error:', err);
    return false;
  }
};
