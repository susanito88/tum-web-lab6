import { apiService } from "@/services/api";
import type { GameHistoryEntry, Statistics } from "@/types";
import type { Word } from "@/types";

/**
 * API-backed game history service
 * Falls back to local IndexedDB if API is unavailable
 */

export async function addGameToHistoryAPI(
  entry: Omit<GameHistoryEntry, "id">,
  guesses: string[] = []
): Promise<void> {
  try {
    // Convert frontend format to backend format
    const backendEntry = {
      word: entry.word,
      guesses,
      won: entry.won,
      difficulty: entry.difficulty,
      duration: entry.timeElapsed,
    };

    const response = await apiService.recordGame(backendEntry as any);
    console.log("Game recorded on backend:", response);
  } catch (error) {
    console.error("Failed to record game on backend, falling back to local storage:", error);
    throw error;
  }
}

export async function getGameHistoryAPI(): Promise<GameHistoryEntry[]> {
  try {
    const response = await apiService.getGameHistory({ limit: 100, offset: 0 });
    if (!response.data) return [];

    return (response.data as any[]).map((record: any) => ({
      id: record.id,
      word: record.word,
      won: record.won,
      difficulty: record.difficulty,
      category: getDifficultyName(record.difficulty) as Word["category"],
      gameMode: "classic" as const,
      guessCount: 0,
      timeElapsed: record.duration,
      coinsEarned: 0,
      playedAt: record.playedAt,
    }));
  } catch (error) {
    console.error("Failed to fetch game history from API:", error);
    throw error;
  }
}

export async function getStatisticsAPI(): Promise<Statistics> {
  try {
    const response = await apiService.getStatistics();
    if (!response.data) {
      return getEmptyStatistics();
    }

    const stats = response.data;
    return {
      totalGames: stats.totalGames || 0,
      wins: stats.wonGames || 0,
      losses: stats.lostGames || 0,
      winRate: parseFloat(stats.winRate) || 0,
      currentStreak: 0,
      longestStreak: 0,
      averageGuesses: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      coinsEarned: 0,
    };
  } catch (error) {
    console.error("Failed to fetch statistics from API:", error);
    throw error;
  }
}

function getDifficultyName(level: number): string {
  switch (level) {
    case 1:
      return "Easy";
    case 2:
      return "Medium";
    case 3:
      return "Hard";
    case 4:
      return "Extreme";
    default:
      return "Easy";
  }
}

function getEmptyStatistics(): Statistics {
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
