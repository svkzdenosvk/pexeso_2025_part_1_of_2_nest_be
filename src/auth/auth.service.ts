import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { signShortToken, signLongToken } from '../lib/jwt/jwt_helper';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  //login
  async validateUser(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) return null;

    const valid: boolean = await bcrypt.compare(password, user.password);
    if (!valid) return null;

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
      // 1. Check if email already exists
      const existingUser = await this.prisma.users.findUnique({
        where: { email },
      });

      if (existingUser) {
        return {
          success: false,
          error: 'email_registered',
        };
      }

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Create user
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
