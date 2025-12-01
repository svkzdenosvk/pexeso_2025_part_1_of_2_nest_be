import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  verifyShortToken,
  verifyLongToken,
  signShortToken,
} from '../lib/jwt/jwt_helper';
import { LoginDto } from './dto/login.dto';
import { RegistrationDto } from './dto/registration.dto';

/**
 * AUTH CONTROLLER (NestJS)
 *
 * Handles authentication-related routes:
 *   - POST /api/login ........ Logs in a user, validates credentials,
 *                              generates JWT cookies, returns user data.
 *
 *   - POST /api/registration .. Registers a new user, validates input,
 *                              checks for duplicate email, stores hashed password.
 *
 *   - GET /api/logout ......... Clears authentication cookies and ends session.
 *
 *   - GET /api/me .............. Verifies short-term or long-term token,
 *                              refreshes session if valid, returns auth state.
 *
 * Responsibilities:
 *   - Delegates business logic to AuthService and PrismaService.
 *   - Sends consistent error responses for FE error handling.
 *   - Manages secure cookie behavior (httpOnly, sameSite, production mode).
 *
 * Notes:
 *   - Uses DTO validation (LoginDto, RegistrationDto).
 *   - JWT tokens are short-lived (15m) and long-lived (7 days).
 *   - Passwords are hashed using bcrypt.
 *
 */
@Controller('api')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  //login
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Validate credentials via AuthService
    const result = await this.authService.validateUser(dto.email, dto.password);

    if (!result.ok || !result.data) {
      // Map backend error → FE i18n translation key
      switch (result.error) {
        case 'invalid_credentials':
          throw new HttpException({ error: 'invalid_credentials' }, 401);
        case 'req_failed':
          throw new HttpException({ error: 'req_failed' }, 500);
        default:
          // Fallback for unexpected backend states
          throw new HttpException({ error: 'unknown_err' }, 500);
      }
    }

    const { user, shortToken, longToken } = result.data;

    // Set authentication cookies
    res.cookie('shortTerm_token', shortToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('longTerm_token', longToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    //  Return user data
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  //registration
  @Post('registration')
  async register(@Body() dto: RegistrationDto) {
    // Delegate DB logic to AuthService
    const result = await this.authService.registerUser(
      dto.name,
      dto.email,
      dto.password,
    );

    if (!result.ok) {
      // Map backend error → FE i18n translation key
      switch (result.error) {
        case 'email_registered':
          throw new HttpException({ error: 'email_registered' }, 400);

        default:
          throw new HttpException({ error: 'req_failed' }, 500);
      }
    }

    return { user: result.data };
  }

  //logout
  @Get('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    //  Remove authentication cookies
    res.clearCookie('shortTerm_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      expires: new Date(0), // force immediate removal
    });

    res.clearCookie('longTerm_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      expires: new Date(0),
    });

    // Confirm logout success
    return { success: true };
  }

  //authCheck /api/me
  @Get('me')
  async me(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      // Extract session tokens from cookies
      const shortToken = String(req.cookies.shortTerm_token ?? ''); // string | undefined
      const longToken = String(req.cookies.longTerm_token ?? ''); // string | undefined

      // 1) Try verifying short-term token (fast path)
      if (shortToken?.length) {
        const decodedShort = verifyShortToken(shortToken);

        if (decodedShort?.id) {
          const user = await this.prisma.users.findUnique({
            where: { id: decodedShort.id },
            select: { id: true, email: true, name: true },
          });

          if (user) {
            return { isLoggedIn: true, user };
          }
        }
      } // else token expired or not exists

      // 2) If short token missing/expired, fallback to long-term
      if (!longToken?.length) {
        return { isLoggedIn: false };
      }

      const decodedLong = verifyLongToken(longToken);
      if (!decodedLong?.id) {
        return { isLoggedIn: false };
      }

      // 3) Confirm that user still exists in database
      const user = await this.prisma.users.findUnique({
        where: { id: decodedLong.id },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        return { isLoggedIn: false };
      }

      // 4) Refresh short-term token and set new cookie
      const newShortToken = signShortToken(user.id, user.email);

      res.cookie('shortTerm_token', newShortToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      });

      // Return authenticated user
      return { isLoggedIn: true, user };
    } catch (err) {
      console.error('Auth check error:', err);
      return res.status(500).json({ isLoggedIn: false });
    }
  }
}
