import {
  type PlatformTarget,
  type SensitivityConfig,
  formatFreeFireConfig,
} from './optimizer';

export type GameEdition = 'freefire' | 'freefire-max';

export interface GameLaunchSpec {
  edition: GameEdition;
  label: string;
  packageId: string;
  deepLinkUrl: string;
  storeFallbackUrl: string;
  storeLabel: string;
  sensitivitySummary: string;
}

export function buildGameLaunchSpec(
  edition: GameEdition,
  platform: PlatformTarget,
  activeConfig: SensitivityConfig,
  targetFps: number
): GameLaunchSpec {
  const isMax = edition === 'freefire-max';
  const packageId = isMax ? 'com.dts.freefiremax' : 'com.dts.freefireth';
  const scheme = isMax ? 'freefiremax' : 'freefire';
  const label = isMax ? 'Free Fire MAX' : 'Free Fire';
  const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageId}`;
  const appStoreUrl = isMax
    ? 'https://apps.apple.com/app/free-fire-max/id1480516829'
    : 'https://apps.apple.com/app/free-fire/id1300146617';

  const deepLinkUrl =
    platform === 'android'
      ? `intent://#Intent;package=${packageId};scheme=${scheme};S.browser_fallback_url=${encodeURIComponent(playStoreUrl)};end`
      : `${scheme}://`;

  return {
    edition,
    label,
    packageId,
    deepLinkUrl,
    storeFallbackUrl: platform === 'android' ? playStoreUrl : appStoreUrl,
    storeLabel: platform === 'android' ? 'Google Play Fallback' : 'App Store Fallback',
    sensitivitySummary: formatFreeFireConfig(activeConfig, platform, targetFps),
  };
}
