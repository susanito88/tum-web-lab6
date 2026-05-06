export interface Word {
  id: string;
  word: string;
  language: string;
  difficulty: number;
  createdAt: number;
  updatedAt: number;
}

export interface GameHistory {
  id: string;
  word: string;
  guesses: string[];
  won: boolean;
  difficulty: number;
  playedAt: number;
  duration: number;
}

export interface JWTPayload {
  userId: string;
  role: 'ADMIN' | 'WRITER' | 'VISITOR';
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface AuthRequest {
  role: 'ADMIN' | 'WRITER' | 'VISITOR';
  permissions?: string[];
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

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
