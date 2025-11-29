import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpException,
  // HttpStatus,
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

@Controller('api')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  //login
  @Post('login')
  async login(
    // @Body() body: { email: string; password: string },
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract credentials from request body
    // const { email, password } = body;

    // // Validate input fields
    // if (!email || !password) {
    //   throw new HttpException(
    //     { error: 'missing_credentials' },
    //     HttpStatus.BAD_REQUEST,
    //   );
    // }
    // Auth.service login part validateUser
    const result = await this.authService.validateUser(dto.email, dto.password);

    if (!result.ok || !result.data) {
      switch (result.error) {
        case 'invalid_credentials':
          throw new HttpException({ error: 'invalid_credentials' }, 401);
        default:
          throw new HttpException({ error: 'unknown_err' }, 500);
      }
    }

    const { user, shortToken, longToken } = result.data;

    //set this on server process.env.NODE_ENV === 'production';!!!!!!!!!!

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
    // Auth.service registraton part registerUser
    const result = await this.authService.registerUser(
      dto.name,
      dto.email,
      dto.password,
    );

    if (!result.ok) {
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
      expires: new Date(0),
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
      // Extract tokens from cookies
      const shortToken = String(req.cookies.shortTerm_token ?? ''); // string | undefined
      const longToken = String(req.cookies.longTerm_token ?? ''); // string | undefined

      // Attempt to verify short-term token
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

      // Fallback: validate long-term token
      if (!longToken?.length) {
        return { isLoggedIn: false };
      }

      const decodedLong = verifyLongToken(longToken);
      if (!decodedLong?.id) {
        return { isLoggedIn: false };
      }

      // Confirm that user still exists in database
      const user = await this.prisma.users.findUnique({
        where: { id: decodedLong.id },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        return { isLoggedIn: false };
      }

      // Refresh short-term token and set new cookie
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
