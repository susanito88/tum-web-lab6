// Word entity
export interface Word {
  id: string;
  word: string;
  category: "Easy" | "Medium" | "Hard" | "Extreme";
  length: number;
  liked: boolean;
  addedAt: number;
  isCustom: boolean;
}

// Game modes
export type GameMode = "classic" | "speed" | "hardcore";

// Guess tracking
export interface Guess {
  word: string;
  result: LetterResult[];
}

export type LetterResult = "correct" | "present" | "absent";

// Game state
export interface GameState {
  targetWord: string;
  guesses: Guess[];
  gameMode: GameMode;
  category: Word["category"];
  startTime: number;
  endTime?: number;
  won: boolean;
  timeElapsed?: number;
  hintsUsed: {
    revealed: Set<number>;
    positions: Set<number>;
    eliminated: Set<string>;
  };
}

// Game history entry
export interface GameHistoryEntry {
  id: string;
  word: string;
  gameMode: GameMode;
  category: Word["category"];
  won: boolean;
  guessCount: number;
  timeElapsed: number;
  coinsEarned: number;
  difficulty: number;
  playedAt: number;
}

// Statistics
export interface Statistics {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  averageGuesses: number;
  guessDistribution: Record<number, number>;
  coinsEarned: number;
}

// Hint types
export interface Hint {
  type: "reveal" | "position" | "eliminate";
  cost: number;
}

// Theme
export type Theme = "light" | "dark" | "colorblind";

// User preferences
export interface UserPreferences {
  theme: Theme;
  coins: number;
  currentStreak: number;
  lastPlayedAt?: number;
}
