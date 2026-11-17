export interface GamerUser {
  id: string;
  gamerTag: string;
  freeFireUid: string;
  authProvider: 'gamertag' | 'google' | 'apple';
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
    freeFireUid: '892174921',
    authProvider: 'google',
    platform: 'android',
    deviceModel: 'Android 14 (Samsung A54)',
    registeredAt: '2026-11-10 14:20',
    lastActive: 'Just now',
    isOwner: true,
  },
  {
    id: 'u-02',
    gamerTag: 'SHADOW_SNIPER',
    freeFireUid: '341908215',
    authProvider: 'google',
    platform: 'android',
    deviceModel: 'Xiaomi Redmi Note 13 Pro',
    registeredAt: '2026-11-12 18:30',
    lastActive: '12 mins ago',
  },
  {
    id: 'u-03',
    gamerTag: 'VIPER_FF_LK',
    freeFireUid: '772910432',
    authProvider: 'apple',
    platform: 'ios',
    deviceModel: 'Apple iPhone 15 Pro',
    registeredAt: '2026-11-14 09:15',
    lastActive: '45 mins ago',
  },
  {
    id: 'u-04',
    gamerTag: 'DRAG_KING_99',
    freeFireUid: '665123990',
    authProvider: 'gamertag',
    platform: 'android',
    deviceModel: 'Vivo Y200 5G',
    registeredAt: '2026-11-15 21:04',
    lastActive: '2 hours ago',
  },
  {
    id: 'u-05',
    gamerTag: 'GHOST_AIM_IOS',
    freeFireUid: '109283746',
    authProvider: 'apple',
    platform: 'ios',
    deviceModel: 'Apple iPhone 13',
    registeredAt: '2026-11-16 11:40',
    lastActive: '5 hours ago',
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
      registry[existingIndex] = { ...registry[existingIndex], ...user, lastActive: 'Just now' };
    } else {
      registry.unshift(user);
    }
    localStorage.setItem(STORAGE_KEY_USER_REGISTRY, JSON.stringify(registry));
  } else {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  }
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
