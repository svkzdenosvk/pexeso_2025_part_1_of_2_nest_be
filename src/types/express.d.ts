import 'express';

/**
 * EXPRESS REQUEST COOKIE TYPES
 *
 * This file extends the Express Request interface to include the `cookies` property.
 *
 * Purpose:
 * - Allows TypeScript to recognize `req.cookies` when using `cookie-parser`.
 * - Ensures type safety for accessing cookies in request handlers.
 */
declare module 'express-serve-static-core' {
  interface Request {
    cookies: Record<string, string>;
  }
}
