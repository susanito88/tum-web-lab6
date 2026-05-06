import { v4 as uuidv4 } from 'uuid';
import { Word, PaginationParams } from '../types';
import { runAsync, getAsync, allAsync } from '../config/database';

export class WordService {
  static async createWord(word: string, language: string, difficulty: number): Promise<Word> {
    const id = uuidv4();
    const now = Date.now();

    await runAsync(
      'INSERT INTO words (id, word, language, difficulty, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, word, language, difficulty, now, now]
    );

    return { id, word, language, difficulty, createdAt: now, updatedAt: now };
  }

  static async getWord(id: string): Promise<Word | null> {
    const row = await getAsync('SELECT * FROM words WHERE id = ?', [id]);
    return row || null;
  }

  static async getWordByName(word: string): Promise<Word | null> {
    const row = await getAsync('SELECT * FROM words WHERE word = ?', [word]);
    return row || null;
  }

  static async getAllWords(params: PaginationParams): Promise<{ words: Word[]; total: number }> {
    const countRow = await getAsync('SELECT COUNT(*) as count FROM words');
    const total = countRow.count;

    const words = await allAsync(
      'SELECT * FROM words ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [params.limit, params.offset]
    );

    return { words, total };
  }

  static async updateWord(
    id: string,
    updates: Partial<Word>
  ): Promise<Word | null> {
    const existing = await this.getWord(id);
    if (!existing) return null;

    const now = Date.now();
    const updatedWord = {
      ...existing,
      ...updates,
      id,
      updatedAt: now,
    };

    await runAsync(
      'UPDATE words SET word = ?, language = ?, difficulty = ?, updatedAt = ? WHERE id = ?',
      [updatedWord.word, updatedWord.language, updatedWord.difficulty, now, id]
    );

    return updatedWord;
  }

  static async deleteWord(id: string): Promise<boolean> {
    const result = await runAsync('DELETE FROM words WHERE id = ?', [id]);
    return result.changes > 0;
  }
}
