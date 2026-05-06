import { apiService } from "@/services/api";
import type { Word } from "@/types";

/**
 * API-backed words service
 */

export async function getWordsAPI(): Promise<Word[]> {
  try {
    const response = await apiService.getWords({ limit: 100, offset: 0 });
    if (!response.data) return [];

    return (response.data as any[]).map((word: any) => ({
      id: word.id,
      word: word.word,
      category: "Easy" as const,
      length: word.word.length,
      liked: false,
      addedAt: Date.now(),
      isCustom: false,
    }));
  } catch (error) {
    console.error("Failed to fetch words from API:", error);
    throw error;
  }
}

export async function createWordAPI(
  word: string,
  language: string = "english",
  difficulty: number = 1
): Promise<Word> {
  try {
    const response = await apiService.createWord({
      word,
      language,
      difficulty,
    } as any);

    if (!response.data) {
      throw new Error("Failed to create word");
    }

    const data = response.data as any;
    return {
      id: data.id,
      word: data.word,
      category: getDifficultyName(data.difficulty || difficulty) as Word["category"],
      length: data.word.length,
      liked: false,
      addedAt: data.createdAt || Date.now(),
      isCustom: true,
    };
  } catch (error) {
    console.error("Failed to create word on API:", error);
    throw error;
  }
}

export async function deleteWordAPI(id: string): Promise<void> {
  try {
    await apiService.deleteWord(id);
  } catch (error) {
    console.error("Failed to delete word from API:", error);
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
