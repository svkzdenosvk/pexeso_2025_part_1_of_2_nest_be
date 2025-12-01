import jwt from 'jsonwebtoken';

/**
 * JWT Helper Functions
 *
 * Provides utilities for signing and verifying JSON Web Tokens (JWT)
 * for short-term (e.g., session) and long-term (e.g., refresh) tokens.
 *
 * Key Features:
 * - signShortToken: signs a short-lived JWT with user id + email
 * - signLongToken: signs a long-lived JWT with user id only
 * - verifyShortToken: verifies short token and returns user payload
 * - verifyLongToken: verifies long token and returns id payload
 *
 * Notes:
 * - Secrets and expiration times are loaded from environment variables
 *   with fallback values for development.
 * - Uses TypeScript template strings for flexible expiry duration typing.
 */

// Type for payload of short token
type My_Type_Unique_User = { id: number; email: string };

// Duration strings for JWT expiration (e.g., "15m", "7d")
type MsString = `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`; // napr. 15m, 7d, 2h

// Load env variables once
const JWT_SHORT_SECRET = process.env.JWT_SHORT_SECRET!;
const JWT_LONG_SECRET = process.env.JWT_LONG_SECRET!;
const JWT_SHORT_EXPIRES_IN: MsString =
  (process.env.JWT_SHORT_EXPIRES_IN as MsString) || '15m';
const JWT_LONG_EXPIRES_IN: MsString =
  (process.env.JWT_LONG_EXPIRES_IN as MsString) || '7d';

// Ensure a secret exists, fallback for dev environment
const ensureSecret = (secret: string | undefined, name: string): string => {
  if (!secret) {
    console.warn(`JWT ${name} not set, using fallback`);
    return 'dev-fallback-secret-2025';
  }
  return secret;
};

// Sign a short-term token with id + email
export const signShortToken = (id: number, email: string): string => {
  const payload: My_Type_Unique_User = { id, email };
  return jwt.sign(payload, ensureSecret(JWT_SHORT_SECRET, 'SHORT'), {
    expiresIn: JWT_SHORT_EXPIRES_IN,
  });
};

// Sign a long-term token with id only
export function signLongToken(id: number): string {
  return jwt.sign({ id }, ensureSecret(JWT_LONG_SECRET, 'LONG'), {
    expiresIn: JWT_LONG_EXPIRES_IN,
  });
}

// Verify short token, return payload or null
export function verifyShortToken(token: string): My_Type_Unique_User | null {
  try {
    return jwt.verify(
      token,
      ensureSecret(JWT_SHORT_SECRET, 'SHORT'),
    ) as My_Type_Unique_User;
  } catch {
    return null;
  }
}

// Verify long token, return payload or null
export function verifyLongToken(token: string): { id: number } | null {
  try {
    return jwt.verify(token, ensureSecret(JWT_LONG_SECRET, 'LONG')) as {
      id: number;
    };
  } catch {
    return null;
  }
}
