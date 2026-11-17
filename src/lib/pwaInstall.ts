export type DeviceInstallPlatform = 'android' | 'ios' | 'desktop';
export type BrowserInstallKind = 'chrome' | 'edge' | 'safari' | 'in-app' | 'other';

export interface InstallEnvironment {
  platform: DeviceInstallPlatform;
  browserKind: BrowserInstallKind;
  isStandalone: boolean;
  isInIframe: boolean;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __pasiyaDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function detectInstallEnvironment(
  userAgent: string,
  isStandalone: boolean,
  isInIframe: boolean
): InstallEnvironment {
  const ua = userAgent.toLowerCase();

  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const platform: DeviceInstallPlatform = isIOS
    ? 'ios'
    : isAndroid
      ? 'android'
      : 'desktop';

  const isInAppWebView =
    /\b(fban|fbav|instagram|whatsapp|line|tiktok|musically|bytedancewebview|wv)\b/.test(
      ua
    );

  let browserKind: BrowserInstallKind = 'other';
  if (isInAppWebView) {
    browserKind = 'in-app';
  } else if (/edg|edga|edgios/.test(ua)) {
    browserKind = 'edge';
  } else if (
    isIOS &&
    /safari/.test(ua) &&
    !/crios|fxios|opios|edgios/.test(ua)
  ) {
    browserKind = 'safari';
  } else if (/chrome|chromium|crios/.test(ua)) {
    browserKind = 'chrome';
  } else if (/safari/.test(ua)) {
    browserKind = 'safari';
  }

  return {
    platform,
    browserKind,
    isStandalone,
    isInIframe,
  };
}

export function buildExternalBrowserUrl(
  currentHref: string,
  platform: DeviceInstallPlatform
): string {
  try {
    const parsed = new URL(currentHref);
    parsed.searchParams.set('install', '1');
    const cleanUrl = parsed.toString();

    if (platform === 'android' && parsed.protocol === 'https:') {
      const withoutProtocol = cleanUrl.replace(/^https:\/\//i, '');
      return `intent://${withoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`;
    }

    return cleanUrl;
  } catch {
    return currentHref;
  }
}

export function getInstallGuidanceSummary(
  env: InstallEnvironment,
  hasNativePrompt: boolean
): {
  mode: 'instant-native' | 'open-external' | 'ios-safari' | 'browser-menu';
  headline: string;
} {
  if (hasNativePrompt) {
    return {
      mode: 'instant-native',
      headline: 'One-tap system install is ready for this device.',
    };
  }

  if (env.platform === 'ios') {
    if (env.isInIframe || env.browserKind !== 'safari') {
      return {
        mode: 'open-external',
        headline:
          'Open directly in Safari to add PASIYA SENSI to your iPhone Home Screen.',
      };
    }
    return {
      mode: 'ios-safari',
      headline:
        'Tap Share in Safari and choose Add to Home Screen to install as a full-screen app.',
    };
  }

  if (env.isInIframe || env.browserKind === 'in-app') {
    return {
      mode: 'open-external',
      headline:
        'Open outside this embedded frame in Chrome to trigger automatic Android installation.',
    };
  }

  return {
    mode: 'browser-menu',
    headline:
      'Use your browser menu to install PASIYA SENSI directly to your Home Screen or taskbar.',
  };
}

export function downloadIosWebClipProfile(
  appUrl = 'https://pasiya-sensi.ai.studio/'
): void {
  const profileXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>PASIYA SENSI</string>
            <key>PayloadDescription</key>
            <string>Free Fire Optimizer &amp; Sensitivity Tool</string>
            <key>PayloadDisplayName</key>
            <string>PASIYA SENSI</string>
            <key>PayloadIdentifier</key>
            <string>com.pasiya.sensi.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>B4190DF4-E6E4-4BC3-83CD-5B1D2CE97FA0</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${appUrl}</string>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>PASIYA SENSI</string>
    <key>PayloadIdentifier</key>
    <string>com.pasiya.sensi.profile</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>4B6EFA42-4BF3-4908-AE27-8E5A73F1321D</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

  const blob = new Blob([profileXml], {
    type: 'application/x-apple-aspen-config',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'PASIYA-SENSI.mobileconfig';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
