import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { signShortToken, signLongToken } from '../lib/jwt/jwt_helper';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  //login
  async validateUser(email: string, password: string) {
    // Find user in PostgreSQL via Prisma
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) return null;

    // Compare hashed password
    const valid: boolean = await bcrypt.compare(password, user.password);
    if (!valid) return null;

    // Generate JWT tokens
    const shortToken: string = signShortToken(user.id, user.email);
    const longToken: string = signLongToken(user.id);

    return {
      user,
      shortToken,
      longToken,
    };
  }

  //registration
  async registerUser(name: string, email: string, password: string) {
    try {
      // Check if email already exists
      const existingUser = await this.prisma.users.findUnique({
        where: { email },
      });

      if (existingUser) {
        return {
          success: false,
          error: 'email_registered',
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await this.prisma.users.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      return {
        success: true,
        user,
      };
    } catch (err) {
      console.error('Registration error:', err);
      return {
        success: false,
        error: 'req_failed',
      };
    }
  }
}
