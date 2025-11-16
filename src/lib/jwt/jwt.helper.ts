import { sign } from 'jsonwebtoken';

export const signShortToken = (userId: number, email: string) => {
  return sign(
    { sub: userId, email },
    process.env.JWT_SHORT_SECRET!,
    { expiresIn: process.env.JWT_SHORT_EXPIRES_IN || '15m' }
  );
};

export const signLongToken = (userId: number) => {
  return sign(
    { sub: userId },
    process.env.JWT_LONG_SECRET!,
    { expiresIn: process.env.JWT_LONG_EXPIRES_IN || '7d' }
  );
};

//treba odkontrolovat s povodným z expresu  lebo chyb averifikacne funkcie