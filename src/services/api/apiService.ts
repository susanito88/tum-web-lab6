import { tokenService } from "./tokenService";
import type { Word, GameHistoryEntry } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Main API service for communicating with the backend
 */
export const apiService = {
  /**
   * Make an authenticated request to the API
   */
  async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      params?: Record<string, any>;
      role?: "ADMIN" | "WRITER" | "VISITOR";
    } = {}
  ): Promise<T> {
    const { method = "GET", body, params, role = "VISITOR" } = options;

    // Build query string
    const queryString = params
      ? new URLSearchParams(
          Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value !== undefined && value !== null) {
                acc[key] = String(value);
              }
              return acc;
            },
            {} as Record<string, string>
          )
        ).toString()
      : "";

    const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ""}`;

    // Get auth header
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(await tokenService.getAuthHeader(role)),
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `API request failed with status ${response.status}`
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  },

  // ============= WORDS API =============

  /**
   * Get all words with pagination
   */
  async getWords(
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<Word[]>> {
    return this.request("/words", {
      params: {
        limit: pagination.limit || 10,
        offset: pagination.offset || 0,
      },
      role: "VISITOR",
    });
  },

  /**
   * Get a single word by ID
   */
  async getWord(id: string): Promise<ApiResponse<Word>> {
    return this.request(`/words/${id}`, {
      role: "VISITOR",
    });
  },

  /**
   * Create a new word
   */
  async createWord(word: Omit<Word, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<Word>> {
    return this.request("/words", {
      method: "POST",
      body: word,
      role: "WRITER",
    });
  },

  /**
   * Update a word
   */
  async updateWord(
    id: string,
    updates: Partial<Word>
  ): Promise<ApiResponse<Word>> {
    return this.request(`/words/${id}`, {
      method: "PUT",
      body: updates,
      role: "WRITER",
    });
  },

  /**
   * Delete a word
   */
  async deleteWord(id: string): Promise<void> {
    await this.request(`/words/${id}`, {
      method: "DELETE",
      role: "ADMIN",
    });
  },

  // ============= GAME HISTORY API =============

  /**
   * Get all game history records with pagination
   */
  async getGameHistory(
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<GameHistoryEntry[]>> {
    return this.request("/game-history", {
      params: {
        limit: pagination.limit || 10,
        offset: pagination.offset || 0,
      },
      role: "VISITOR",
    });
  },

  /**
   * Get a single game record by ID
   */
  async getGameRecord(id: string): Promise<ApiResponse<GameHistoryEntry>> {
    return this.request(`/game-history/${id}`, {
      role: "VISITOR",
    });
  },

  /**
   * Record a new game
   */
  async recordGame(
    game: Omit<GameHistoryEntry, "id" | "playedAt">
  ): Promise<ApiResponse<GameHistoryEntry>> {
    return this.request("/game-history", {
      method: "POST",
      body: {
        ...game,
        playedAt: Date.now(),
      },
      role: "WRITER",
    });
  },

  /**
   * Delete a game record
   */
  async deleteGameRecord(id: string): Promise<void> {
    await this.request(`/game-history/${id}`, {
      method: "DELETE",
      role: "ADMIN",
    });
  },

  // ============= STATISTICS API =============

  /**
   * Get game statistics
   */
  async getStatistics(): Promise<ApiResponse<any>> {
    return this.request("/statistics", {
      role: "VISITOR",
    });
  },
};
