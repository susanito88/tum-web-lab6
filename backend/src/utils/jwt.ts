import jwt from 'jsonwebtoken';
import { JWTPayload, AuthRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = 60; // 1 minute as per requirements

export function generateToken(userId: string, authRequest: AuthRequest): string {
  const payload: JWTPayload = {
    userId,
    role: authRequest.role,
    permissions: authRequest.permissions || getDefaultPermissions(authRequest.role),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getDefaultPermissions(role: 'ADMIN' | 'WRITER' | 'VISITOR'): string[] {
  const permissions: Record<string, string[]> = {
    ADMIN: ['READ', 'WRITE', 'DELETE', 'MANAGE_USERS'],
    WRITER: ['READ', 'WRITE'],
    VISITOR: ['READ'],
  };
  return permissions[role] || ['READ'];
}
