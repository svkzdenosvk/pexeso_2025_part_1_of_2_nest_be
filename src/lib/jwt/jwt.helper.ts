import jwt /*, { SignOptions }*/ from 'jsonwebtoken';

type My_Type_Unique_User = { id: number; email: string };

// Duration strings for JWT expiration
type MsString = `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`; // napr. 15m, 7d, 2h

// Načítaj env raz
const JWT_SHORT_SECRET = process.env.JWT_SHORT_SECRET!;
const JWT_LONG_SECRET = process.env.JWT_LONG_SECRET!;
const JWT_SHORT_EXPIRES_IN: MsString =
  (process.env.JWT_SHORT_EXPIRES_IN as MsString) || '15m';
const JWT_LONG_EXPIRES_IN: MsString =
  (process.env.JWT_LONG_EXPIRES_IN as MsString) || '7d';

// Fallback pre dev
const ensureSecret = (secret: string | undefined, name: string): string => {
  if (!secret) {
    console.warn(`JWT ${name} not set, using fallback`);
    return 'dev-fallback-secret-2025';
  }
  return secret;
};

export const signShortToken = (id: number, email: string): string => {
  const payload: My_Type_Unique_User = { id, email };
  return jwt.sign(payload, ensureSecret(JWT_SHORT_SECRET, 'SHORT'), {
    expiresIn: JWT_SHORT_EXPIRES_IN,
  });
};

// Sign long token
export function signLongToken(id: number): string {
  return jwt.sign({ id }, ensureSecret(JWT_LONG_SECRET, 'LONG'), {
    expiresIn: JWT_LONG_EXPIRES_IN,
  });
}
// Verify short
// export function verifyShortToken(token: string): My_Type_Unique_User | null {
//   try {
//     return jwt.verify(token, ensureSecret(JWT_SHORT_SECRET, 'SHORT')) as My_Type_Unique_User;
//   } catch {
//     return null;
//   }
// }

// // Verify long
// export function verifyLongToken(token: string): { id: number } | null {
//   try {
//     return jwt.verify(token, ensureSecret(JWT_LONG_SECRET, 'LONG')) as { id: number };
//   } catch {
//     return null;
//   }
// }
