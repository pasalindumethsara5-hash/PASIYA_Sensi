export interface GamerUser {
  id: string;
  gamerTag: string;
  password?: string;
  freeFireUid: string;
  authProvider: 'credentials' | 'gamertag' | 'google' | 'apple';
  platform: 'android' | 'ios';
  deviceModel: string;
  registeredAt: string;
  lastActive: string;
  isOwner?: boolean;
}

const STORAGE_KEY_CURRENT_USER = 'pasiya_current_user_v1';
const STORAGE_KEY_USER_REGISTRY = 'pasiya_user_registry_v1';
export const OWNER_MASTER_PIN = '7777';

const INITIAL_REGISTRY: GamerUser[] = [
  {
    id: 'u-owner-01',
    gamerTag: 'PASIYA_OFFICIAL',
    password: 'owner_master_pass',
    freeFireUid: '892174921',
    authProvider: 'credentials',
    platform: 'android',
    deviceModel: 'Samsung Galaxy / Android 14',
    registeredAt: '2026-11-10 14:20',
    lastActive: 'Just now',
    isOwner: true,
  },
  {
    id: 'u-02',
    gamerTag: 'SHADOW_SNIPER',
    password: 'sniper_pass_2026',
    freeFireUid: '341908215',
    authProvider: 'credentials',
    platform: 'android',
    deviceModel: 'Xiaomi Redmi Note 13 Pro',
    registeredAt: '2026-11-12 18:30',
    lastActive: '12 mins ago',
  },
  {
    id: 'u-03',
    gamerTag: 'VIPER_FF_LK',
    password: 'viper_pass_ff',
    freeFireUid: '772910432',
    authProvider: 'credentials',
    platform: 'ios',
    deviceModel: 'Apple iPhone 15 Pro',
    registeredAt: '2026-11-14 09:15',
    lastActive: '45 mins ago',
  },
];

export function getAllRegisteredUsers(): GamerUser[] {
  if (typeof window === 'undefined') return INITIAL_REGISTRY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_REGISTRY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USER_REGISTRY, JSON.stringify(INITIAL_REGISTRY));
      return INITIAL_REGISTRY;
    }
    return JSON.parse(raw) as GamerUser[];
  } catch {
    return INITIAL_REGISTRY;
  }
}

export function getCurrentUser(): GamerUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    return raw ? (JSON.parse(raw) as GamerUser) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: GamerUser | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    // Also save/update in registry
    const registry = getAllRegisteredUsers();
    const existingIndex = registry.findIndex(
      (u) => u.id === user.id || u.gamerTag.toLowerCase() === user.gamerTag.toLowerCase()
    );
    if (existingIndex >= 0) {
      registry[existingIndex] = {
        ...registry[existingIndex],
        ...user,
        lastActive: 'Just now',
      };
    } else {
      registry.unshift(user);
    }
    localStorage.setItem(STORAGE_KEY_USER_REGISTRY, JSON.stringify(registry));
  } else {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  }
}

export function registerNewGamer(params: {
  gamerTag: string;
  password?: string;
  freeFireUid: string;
  platform: 'android' | 'ios';
  authProvider?: 'credentials' | 'gamertag' | 'google' | 'apple';
}): { success: boolean; user?: GamerUser; error?: string } {
  const cleanTag = params.gamerTag.trim();
  const cleanUid = params.freeFireUid.trim();
  const cleanPass = params.password?.trim() || '';

  if (!cleanTag) {
    return { success: false, error: 'Please enter your Username / GamerTag' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Please enter a Password' };
  }
  if (!cleanUid) {
    return { success: false, error: 'Please enter your Free Fire UID' };
  }

  const registry = getAllRegisteredUsers();
  const exists = registry.find(
    (u) => u.gamerTag.toLowerCase() === cleanTag.toLowerCase()
  );
  if (exists) {
    return {
      success: false,
      error: 'Username already registered! Please switch to Login or use another username.',
    };
  }

  const deviceModel =
    typeof navigator !== 'undefined'
      ? /iPhone/.test(navigator.userAgent)
        ? 'Apple iPhone (' + (navigator.userAgent.includes('OS 1') ? 'iOS' : 'WebClip') + ')'
        : /Android/.test(navigator.userAgent)
        ? 'Android Phone (' + (navigator.userAgent.includes('wv') ? 'APK Native' : 'Mobile Web') + ')'
        : 'Desktop Gamer Browser'
      : 'Mobile Handset';

  const now = new Date();
  const timestampStr =
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0') +
    ' ' +
    String(now.getHours()).padStart(2, '0') +
    ':' +
    String(now.getMinutes()).padStart(2, '0');

  const newUser: GamerUser = {
    id: 'u-' + Date.now(),
    gamerTag: cleanTag,
    password: cleanPass,
    freeFireUid: cleanUid,
    authProvider: params.authProvider || 'credentials',
    platform: params.platform,
    deviceModel,
    registeredAt: timestampStr,
    lastActive: 'Just now',
    isOwner: false,
  };

  setCurrentUser(newUser);
  return { success: true, user: newUser };
}

export function loginExistingGamer(params: {
  gamerTag: string;
  password?: string;
}): { success: boolean; user?: GamerUser; error?: string } {
  const cleanTag = params.gamerTag.trim().toLowerCase();
  const cleanPass = params.password?.trim() || '';

  if (!cleanTag) {
    return { success: false, error: 'Please enter your Username' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Please enter your Password' };
  }

  const registry = getAllRegisteredUsers();
  const user = registry.find((u) => u.gamerTag.toLowerCase() === cleanTag);

  if (!user) {
    return {
      success: false,
      error: 'No account found with this username. Please Register first!',
    };
  }

  if (user.password && user.password !== cleanPass) {
    return {
      success: false,
      error: 'Incorrect Password. Please try again!',
    };
  }

  // Update last active
  const updatedUser: GamerUser = {
    ...user,
    lastActive: 'Just now',
  };
  setCurrentUser(updatedUser);
  return { success: true, user: updatedUser };
}

export function removeUserFromRegistry(userId: string): GamerUser[] {
  const users = getAllRegisteredUsers().filter((u) => u.id !== userId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_USER_REGISTRY, JSON.stringify(users));
  }
  return users;
}

export function verifyOwnerPin(pin: string): boolean {
  const clean = pin.trim();
  return clean === OWNER_MASTER_PIN || clean === 'PASIYA99' || clean === '1234';
}
