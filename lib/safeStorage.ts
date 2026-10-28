const memoryStorage = new Map<string, string>();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // iOS Safari/Chrome Private Mode veya ITP iframe kısıtlaması durumunda bellek yedeği kullan
    }
    return memoryStorage.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    memoryStorage.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // iOS Safari/Chrome kısıtlamasında sessizce bellek yedeğine devam et
    }
  },

  removeItem(key: string): void {
    memoryStorage.delete(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Yoksay
    }
  },
};
