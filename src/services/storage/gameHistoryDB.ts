import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { GameHistoryEntry, Statistics } from '@/types';

interface GameHistoryDB extends DBSchema {
  history: {
    key: string;
    value: GameHistoryEntry;
    indexes: {
      'by-gameMode': GameHistoryEntry['gameMode'];
      'by-playedAt': number;
    };
  };
}

let db: IDBPDatabase<GameHistoryDB> | null = null;

const DB_NAME = 'WordleDB';
const DB_VERSION = 1;

export async function initGameHistoryDB(): Promise<void> {
  if (db) return;

  db = await openDB<GameHistoryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('history')) {
        const store = db.createObjectStore('history', { keyPath: 'id' });
        store.createIndex('by-gameMode', 'gameMode');
        store.createIndex('by-playedAt', 'playedAt');
      }
    },
  });
}

export async function addGameToHistory(entry: GameHistoryEntry): Promise<void> {
  if (!db) await initGameHistoryDB();
  if (!db) throw new Error('Failed to initialize DB');

  await db.put('history', entry);
}

export async function getGameHistory(gameMode?: GameHistoryEntry['gameMode']): Promise<GameHistoryEntry[]> {
  if (!db) await initGameHistoryDB();
  if (!db) throw new Error('Failed to initialize DB');

  if (gameMode) {
    return db.getAllFromIndex('history', 'by-gameMode', gameMode);
  }
  return db.getAll('history');
}

export async function getStatistics(gameMode?: GameHistoryEntry['gameMode']): Promise<Statistics> {
  const history = await getGameHistory(gameMode);

  if (history.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageGuesses: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      letterPositionHeatmap: {},
      coinsEarned: 0,
    };
  }

  // Sort by playedAt to calculate streaks
  const sortedHistory = [...history].sort((a, b) => a.playedAt - b.playedAt);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const entry of sortedHistory) {
    if (entry.won) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Check if current streak is still active (last game was today)
  const lastGame = sortedHistory[sortedHistory.length - 1];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(lastGame.playedAt).getTime() >= today.getTime() && lastGame.won) {
    currentStreak = tempStreak;
  }

  const wins = history.filter(h => h.won).length;
  const losses = history.length - wins;
  const totalGuesses = history.reduce((sum, h) => sum + h.guessCount, 0);
  const averageGuesses = history.length > 0 ? totalGuesses / history.length : 0;

  // Build guess distribution
  const guessDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const entry of history) {
    if (entry.won && entry.guessCount >= 1 && entry.guessCount <= 6) {
      guessDistribution[entry.guessCount]++;
    }
  }

  // Calculate total coins earned
  const coinsEarned = history.reduce((sum, h) => sum + h.coinsEarned, 0);

  return {
    totalGames: history.length,
    wins,
    losses,
    currentStreak,
    longestStreak,
    averageGuesses,
    guessDistribution,
    letterPositionHeatmap: {},
    coinsEarned,
  };
}

export async function clearGameHistory(): Promise<void> {
  if (!db) await initGameHistoryDB();
  if (!db) throw new Error('Failed to initialize DB');

  const allKeys = await db.getAllKeys('history');
  const tx = db.transaction('history', 'readwrite');
  for (const key of allKeys) {
    await tx.store.delete(key);
  }
  await tx.done;
}
