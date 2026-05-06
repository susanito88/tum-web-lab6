import { v4 as uuidv4 } from 'uuid';
import { GameHistory, PaginationParams } from '../types';
import { runAsync, getAsync, allAsync } from '../config/database';

export class GameHistoryService {
  static async createGameRecord(
    word: string,
    guesses: string[],
    won: boolean,
    difficulty: number,
    duration: number
  ): Promise<GameHistory> {
    const id = uuidv4();
    const playedAt = Date.now();

    await runAsync(
      'INSERT INTO game_history (id, word, guesses, won, difficulty, playedAt, duration) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, word, JSON.stringify(guesses), won ? 1 : 0, difficulty, playedAt, duration]
    );

    return { id, word, guesses, won, difficulty, playedAt, duration };
  }

  static async getGameRecord(id: string): Promise<GameHistory | null> {
    const row = await getAsync('SELECT * FROM game_history WHERE id = ?', [id]);
    if (!row) return null;

    return {
      ...row,
      guesses: JSON.parse(row.guesses),
      won: row.won === 1,
    };
  }

  static async getAllGameRecords(params: PaginationParams): Promise<{ records: GameHistory[]; total: number }> {
    const countRow = await getAsync('SELECT COUNT(*) as count FROM game_history');
    const total = countRow.count;

    const records = await allAsync(
      'SELECT * FROM game_history ORDER BY playedAt DESC LIMIT ? OFFSET ?',
      [params.limit, params.offset]
    );

    const parsedRecords = records.map((row) => ({
      ...row,
      guesses: JSON.parse(row.guesses),
      won: row.won === 1,
    }));

    return { records: parsedRecords, total };
  }

  static async deleteGameRecord(id: string): Promise<boolean> {
    const result = await runAsync('DELETE FROM game_history WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async getStatistics(): Promise<any> {
    const totalGames = await getAsync('SELECT COUNT(*) as count FROM game_history');
    const wonGames = await getAsync('SELECT COUNT(*) as count FROM game_history WHERE won = 1');
    const avgDuration = await getAsync('SELECT AVG(duration) as avg FROM game_history');

    return {
      totalGames: totalGames.count,
      wonGames: wonGames.count,
      lostGames: totalGames.count - wonGames.count,
      winRate: ((wonGames.count / totalGames.count) * 100).toFixed(2),
      averageDuration: avgDuration.avg || 0,
    };
  }
}
