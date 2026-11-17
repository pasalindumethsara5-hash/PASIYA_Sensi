export interface AppVersionInfo {
  version: string;
  versionCode: number;
  releaseDate: string;
  apkUrl: string;
  profileUrl: string;
  mandatory?: boolean;
  changelog: string[];
}

export const CURRENT_APP_VERSION = '2.0.0';
export const CURRENT_APP_CODE = 200;

const REMOTE_VERSION_URL =
  'https://pasalindumethsara5-hash.github.io/PASIYA_Sensi/version.json';

export async function fetchRemoteVersion(): Promise<AppVersionInfo | null> {
  try {
    const res = await fetch(`${REMOTE_VERSION_URL}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AppVersionInfo;
    return data;
  } catch (err) {
    console.warn('[AppUpdater] Failed to check for updates:', err);
    return null;
  }
}

export function isUpdateAvailable(remote: AppVersionInfo | null): boolean {
  if (!remote) return false;
  return remote.versionCode > CURRENT_APP_CODE;
}
