import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { signShortToken, signLongToken } from '../lib/jwt/jwt_helper';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  //login
  async validateUser(email: string, password: string) {
    try {
      // Find user in PostgreSQL via Prisma
      const user = await this.prisma.users.findUnique({ where: { email } });
      if (!user) {
        return { ok: false, error: 'invalid_credentials' };
      }
      // Compare hashed password
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
  async registerUser(name: string, email: string, password: string) {
    try {
      // Check if email already exists
      const existingUser = await this.prisma.users.findUnique({
        where: { email },
      });

      if (existingUser) {
        return { ok: false, error: 'email_registered' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
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
