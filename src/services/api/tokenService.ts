const TOKEN_KEY = "wordle_api_token";
const TOKEN_EXPIRY_KEY = "wordle_api_token_expiry";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export interface TokenData {
  token: string;
  role: "ADMIN" | "WRITER" | "VISITOR";
  permissions: string[];
  expiresIn: number;
  obtainedAt: number;
}

export const tokenService = {
  /**
   * Request a new token from the backend
   */
  async requestToken(
    role: "ADMIN" | "WRITER" | "VISITOR" = "VISITOR",
    permissions?: string[]
  ): Promise<TokenData> {
    try {
      const response = await fetch(`${API_BASE_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          permissions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.statusText}`);
      }

      const data = await response.json();
      const tokenData: TokenData = {
        token: data.data.token,
        role: data.data.role,
        permissions: data.data.permissions,
        expiresIn: data.data.expiresIn,
        obtainedAt: Date.now(),
      };

      this.saveToken(tokenData);
      return tokenData;
    } catch (error) {
      console.error("Error requesting token:", error);
      throw error;
    }
  },

  /**
   * Get the current valid token, requesting a new one if needed
   */
  async getValidToken(
    role: "ADMIN" | "WRITER" | "VISITOR" = "VISITOR"
  ): Promise<string> {
    const stored = this.getToken();

    // Check if token exists and is still valid (with 10 second buffer)
    if (stored && this.isTokenValid(stored)) {
      return stored.token;
    }

    // Request new token
    const tokenData = await this.requestToken(role);
    return tokenData.token;
  },

  /**
   * Save token to localStorage
   */
  saveToken(tokenData: TokenData): void {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
    const expiryTime = Date.now() + tokenData.expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  },

  /**
   * Get stored token data
   */
  getToken(): TokenData | null {
    try {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  /**
   * Check if token is still valid
   */
  isTokenValid(tokenData?: TokenData): boolean {
    const token = tokenData || this.getToken();
    if (!token) return false;

    const expiryTime = token.obtainedAt + token.expiresIn * 1000;
    // Add 10 second buffer to prevent using expired tokens
    return Date.now() < expiryTime - 10000;
  },

  /**
   * Clear stored token
   */
  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },

  /**
   * Get token with refresh if needed
   */
  async getAuthHeader(
    role: "ADMIN" | "WRITER" | "VISITOR" = "VISITOR"
  ): Promise<Record<string, string>> {
    const token = await this.getValidToken(role);
    return {
      Authorization: `Bearer ${token}`,
    };
  },
};
