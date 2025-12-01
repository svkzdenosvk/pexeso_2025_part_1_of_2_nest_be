import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { signShortToken, signLongToken } from '../lib/jwt/jwt_helper';

/**
 * AUTH SERVICE
 *
 * This service handles all authentication-related logic:
 *
 * 1. validateUser()
 *    - Finds user in PostgreSQL (Prisma)
 *    - Verifies password via bcrypt
 *    - Generates JWT tokens (short-term + long-term)
 *    - Returns structured result for the controller
 *
 * 2. registerUser()
 *    - Checks for existing email
 *    - Hashes password
 *    - Creates new user in the database
 *    - Returns basic user data
 *
 * Notes:
 *   - All methods return a unified { ok, data?, error? } format.
 *   - Actual HTTP responses are handled in AuthController.
 */

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  //login

  /**
   * Validates user credentials and generates JWT tokens.
   *
   * @param email - User email
   * @param password - Plain text password
   * @returns { ok, data?, error? }
   */
  async validateUser(email: string, password: string) {
    try {
      // Find user in PostgreSQL via Prisma by email
      const user = await this.prisma.users.findUnique({ where: { email } });
      if (!user) {
        return { ok: false, error: 'invalid_credentials' };
      }
      // Compare hashed password with submitted one
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return { ok: false, error: 'invalid_credentials' };
      }

      // Generate JWT tokens
      const shortToken = signShortToken(user.id, user.email);
      const longToken = signLongToken(user.id);

      return {
        ok: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          shortToken,
          longToken,
        },
      };
    } catch {
      return { ok: false, error: 'req_failed' };
    }
  }

  //registration

  /**
   * Registers a new user in the database.
   *
   * @param name - User's display name
   * @param email - Unique email address
   * @param password - Plain text password
   * @returns { ok, data?, error? }
   */
  async registerUser(name: string, email: string, password: string) {
    try {
      // Check if email already exists
      const existingUser = await this.prisma.users.findUnique({
        where: { email },
      });

      if (existingUser) {
        return { ok: false, error: 'email_registered' };
      }

      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user -> insert new user record into PostgreSQL
      const user = await this.prisma.users.create({
        data: { name, email, password: hashedPassword },
      });

      return {
        ok: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch {
      return { ok: false, error: 'req_failed' };
    }
  }
}
