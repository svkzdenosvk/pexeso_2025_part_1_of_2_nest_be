// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';
import bcrypt from 'bcrypt';
import { signShortToken, signLongToken } from '../lib/jwt/jwt.helper';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(dto: LoginDto, res: any) {
    const { email, password } = dto;

    const user = await this.prisma.client.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('invalid_credentials');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new UnauthorizedException('invalid_credentials');
    }

    const shortToken = signShortToken(user.id, user.email);
    const longToken = signLongToken(user.id);

    // Nastav cookies
    res.cookie('shortTerm_token', shortToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('longTerm_token', longToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return new UserResponseDto(user);
  }
}