import { Theme, UserPreferences } from '@/types';

const STORAGE_KEY = 'worlde_user_prefs';
const COINS_KEY = 'worlde_coins';
const THEME_KEY = 'worlde_theme';
const STREAK_KEY = 'worlde_streak';

export const localStorageService = {
  // Coins management
  getCoins(): number {
    const coins = localStorage.getItem(COINS_KEY);
    return coins ? parseInt(coins, 10) : 0;
  },

  setCoins(amount: number): void {
    localStorage.setItem(COINS_KEY, amount.toString());
  },

  addCoins(amount: number): number {
    const current = this.getCoins();
    const next = current + amount;
    this.setCoins(next);
    return next;
  },

  spendCoins(amount: number): boolean {
    const current = this.getCoins();
    if (current < amount) return false;
    this.setCoins(current - amount);
    return true;
  },

  // Theme management
  getTheme(): Theme {
    const theme = localStorage.getItem(THEME_KEY) as Theme | null;
    
    if (theme) return theme;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },

  setTheme(theme: Theme): void {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  },

  // Streak management
  getStreak(): number {
    const streak = localStorage.getItem(STREAK_KEY);
    return streak ? parseInt(streak, 10) : 0;
  },

  setStreak(streak: number): void {
    localStorage.setItem(STREAK_KEY, streak.toString());
  },

  incrementStreak(): number {
    const current = this.getStreak();
    const next = current + 1;
    this.setStreak(next);
    return next;
  },

  resetStreak(): void {
    this.setStreak(0);
  },

  // Get all preferences
  getPreferences(): UserPreferences {
    return {
      theme: this.getTheme(),
      coins: this.getCoins(),
      currentStreak: this.getStreak(),
      lastPlayedAt: this.getLastPlayedAt(),
    };
  },

  // Last played tracking
  getLastPlayedAt(): number | undefined {
    const lastPlayed = localStorage.getItem('worlde_lastPlayedAt');
    return lastPlayed ? parseInt(lastPlayed, 10) : undefined;
  },

  setLastPlayedAt(timestamp: number): void {
    localStorage.setItem('worlde_lastPlayedAt', timestamp.toString());
  },
};

// Apply theme to document
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  // Remove all theme classes
  root.classList.remove('light', 'dark', 'colorblind');
  root.classList.add(theme);

  // Set CSS variables based on theme
  if (theme === 'light') {
    root.style.setProperty('--bg-color', '#ffffff');
    root.style.setProperty('--text-color', '#000000');
    root.style.setProperty('--cell-bg', '#f3f3f3');
    root.style.setProperty('--cell-border', '#d3d6da');
    root.style.setProperty('--key-bg', '#d3d6da');
    root.style.setProperty('--correct-bg', '#6aaa64');
    root.style.setProperty('--present-bg', '#c9b458');
    root.style.setProperty('--absent-bg', '#787c7e');
  } else if (theme === 'dark') {
    root.style.setProperty('--bg-color', '#121213');
    root.style.setProperty('--text-color', '#ffffff');
    root.style.setProperty('--cell-bg', '#1a1a1a');
    root.style.setProperty('--cell-border', '#3a3a3c');
    root.style.setProperty('--key-bg', '#3a3a3c');
    root.style.setProperty('--correct-bg', '#6aaa64');
    root.style.setProperty('--present-bg', '#c9b458');
    root.style.setProperty('--absent-bg', '#565758');
  } else if (theme === 'colorblind') {
    root.style.setProperty('--bg-color', '#ffffff');
    root.style.setProperty('--text-color', '#000000');
    root.style.setProperty('--cell-bg', '#f3f3f3');
    root.style.setProperty('--cell-border', '#d3d6da');
    root.style.setProperty('--key-bg', '#d3d6da');
    root.style.setProperty('--correct-bg', '#0066cc');
    root.style.setProperty('--present-bg', '#ff6600');
    root.style.setProperty('--absent-bg', '#787c7e');
  }
}

// Listen for system theme changes
export function subscribeToSystemTheme(): void {
  if (!window.matchMedia) return;

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (!storedTheme) {
      localStorageService.setTheme(e.matches ? 'dark' : 'light');
    }
  });
}
