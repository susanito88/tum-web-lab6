import { openDB } from "idb";
import type { GameHistoryEntry, Statistics, GameMode } from "@/types";

let db: any = null;

const DB_NAME = "WordleDB";
const DB_VERSION = 3;

export async function initGameHistoryDB(): Promise<void> {
  if (db) return;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db: any) {
      if (!db.objectStoreNames.contains("history")) {
        const store = db.createObjectStore("history", { keyPath: "id" });
        store.createIndex("by-gameMode", "gameMode");
        store.createIndex("by-playedAt", "playedAt");
      }

      if (!db.objectStoreNames.contains("words")) {
        const wordsStore = db.createObjectStore("words", { keyPath: "id" });
        wordsStore.createIndex("by-category", "category");
        wordsStore.createIndex("by-isCustom", "isCustom");
      }
    },
  });
}

export async function resetGameHistoryDB(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      // Avoid hanging reset flow if another tab keeps DB open.
      console.warn("WordleDB deletion blocked by another open connection");
      resolve();
    };
  });
}

export async function addGameToHistory(
  entry: Omit<GameHistoryEntry, "id">,
): Promise<void> {
  if (!db) await initGameHistoryDB();
  if (!db) throw new Error("Failed to initialize DB");

  const fullEntry: GameHistoryEntry = {
    ...entry,
    id: `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };

  await db.add("history", fullEntry);
}

export async function getGameHistory(
  mode?: GameMode,
): Promise<GameHistoryEntry[]> {
  if (!db) await initGameHistoryDB();
  if (!db) throw new Error("Failed to initialize DB");

  if (mode) {
    return (await db.getAllFromIndex(
      "history",
      "by-gameMode",
      mode,
    )) as GameHistoryEntry[];
  }

  return (await db.getAll("history")) as GameHistoryEntry[];
}

export async function getStatistics(mode?: GameMode): Promise<Statistics> {
  const games = await getGameHistory(mode);

  if (games.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageGuesses: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      coinsEarned: 0,
    };
  }

  const wins = games.filter((g) => g.won).length;
  const guessDistribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  };

  let totalGuesses = 0;
  let totalCoins = 0;

  for (const game of games) {
    if (game.won) {
      const guessCount = Math.min(
        Math.max(game.guessCount, 1),
        6,
      ) as keyof typeof guessDistribution;
      guessDistribution[guessCount]++;
      totalGuesses += game.guessCount;
    }
    totalCoins += game.coinsEarned || 0;
  }

  const avgGuesses = wins > 0 ? totalGuesses / wins : 0;

  // Calculate streaks - sort by date
  const sortedGames = [...games].sort((a, b) => a.playedAt - b.playedAt);
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < sortedGames.length; i++) {
    if (sortedGames[i].won) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Check if current streak is still active (last game was today or yesterday)
  if (sortedGames.length > 0) {
    const lastGame = sortedGames[sortedGames.length - 1];
    const daysSinceLastGame = Math.floor((now - lastGame.playedAt) / oneDayMs);

    if (lastGame.won && daysSinceLastGame <= 1) {
      currentStreak = tempStreak;
    }
  }

  return {
    totalGames: games.length,
    wins,
    losses: games.length - wins,
    winRate: (wins / games.length) * 100,
    currentStreak,
    longestStreak,
    averageGuesses: avgGuesses,
    guessDistribution,
    coinsEarned: totalCoins,
  };
}
