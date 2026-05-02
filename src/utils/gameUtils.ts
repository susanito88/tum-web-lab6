import type { Guess, LetterResult } from "@/types";

// Evaluate a guess against the target word
export function evaluateGuess(guess: string, target: string): LetterResult[] {
  const guessArray = guess.toUpperCase().split("");
  const targetArray = target.toUpperCase().split("");
  const result: LetterResult[] = new Array(guessArray.length).fill("absent");

  // First pass: mark correct positions
  const targetCounts = new Map<string, number>();
  for (let i = 0; i < guessArray.length; i++) {
    if (guessArray[i] === targetArray[i]) {
      result[i] = "correct";
    } else {
      targetCounts.set(
        targetArray[i],
        (targetCounts.get(targetArray[i]) ?? 0) + 1,
      );
    }
  }

  // Second pass: mark present positions
  for (let i = 0; i < guessArray.length; i++) {
    if (result[i] === "absent" && targetCounts.has(guessArray[i])) {
      const count = targetCounts.get(guessArray[i]) ?? 0;
      if (count > 0) {
        result[i] = "present";
        targetCounts.set(guessArray[i], count - 1);
      }
    }
  }

  return result;
}

// Get keyboard state based on guesses
export function getKeyboardState(
  guesses: Guess[],
): Record<string, LetterResult | undefined> {
  const state: Record<string, LetterResult | undefined> = {};

  for (const guess of guesses) {
    for (let i = 0; i < guess.word.length; i++) {
      const letter = guess.word[i].toUpperCase();
      const result = guess.result[i];

      // Don't downgrade from correct to present/absent
      if (state[letter] !== "correct") {
        state[letter] = result;
      }
    }
  }

  return state;
}

// Calculate coins earned for winning
export function calculateCoinsEarned(
  guessCount: number,
  gameMode: string,
  difficulty: number,
): number {
  const baseCoins = 10;
  const guessBonus = Math.max(0, 6 - guessCount) * 2;
  const modeMultiplier =
    gameMode === "hardcore" ? 1.5 : gameMode === "speed" ? 1.2 : 1;
  const difficultyBonus = difficulty * 5;

  return Math.floor(
    (baseCoins + guessBonus + difficultyBonus) * modeMultiplier,
  );
}

// Get difficulty number from category
export function getDifficultyNumber(category: string): number {
  const difficulties: Record<string, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
    Extreme: 4,
  };
  return difficulties[category] ?? 1;
}

// Format time to MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Check if streak should break (no play today)
export function shouldBreakStreak(lastPlayedAt?: number): boolean {
  if (!lastPlayedAt) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastPlayed = new Date(lastPlayedAt);
  lastPlayed.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return lastPlayed < yesterday;
}

