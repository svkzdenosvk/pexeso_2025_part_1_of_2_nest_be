import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  verifyShortToken,
  verifyLongToken,
  signShortToken,
} from '../lib/jwt/jwt_helper';

@Controller('api')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  //login
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = body;

    if (!email || !password) {
      throw new HttpException(
        { error: 'missing_credentials' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.authService.validateUser(email, password);
    if (!result) {
      throw new HttpException(
        { error: 'invalid_credentials' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { user, shortToken, longToken } = result;

    //set this on server process.env.NODE_ENV === 'production';!!!!!!!!!!

    // Cookies
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
  async register(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
    },
  ) {
    const { name, email, password } = body;

    if (!name || !email || !password) {
      throw new HttpException(
        { error: 'missing_credentials' }, // tvoj i18n error
        HttpStatus.BAD_REQUEST, // status 400
      );
    }

    const result = await this.authService.registerUser(name, email, password);

    if (!result.success && result.error === 'email_registered') {
      throw new HttpException(
        { error: 'email_registered' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!result.success) {
      throw new HttpException(
        { error: 'req_failed' },
        HttpStatus.INTERNAL_SERVER_ERROR, // status 500
      );
    }

    if (!result.user) {
      throw new HttpException(
        { error: 'req_failed' },
        HttpStatus.INTERNAL_SERVER_ERROR, // status 500
      );
    }

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
    };
  }

  //logout
  @Get('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    // clear cookies
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

    return { success: true };
  }

  //authCheck /api/me
  @Get('me')
  async me(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const shortToken = String(req.cookies.shortTerm_token ?? ''); // string | undefined
      const longToken = String(req.cookies.longTerm_token ?? ''); // string | undefined

      // 1) Try short token
      // if (shortToken) {
      if (shortToken?.length) {
        const decodedShort = verifyShortToken(shortToken);

        if (decodedShort?.id) {
          const user = await this.prisma.users.findUnique({
            where: { id: decodedShort.id },
            select: { id: true, email: true, name: true },
          });

          if (user) {
            // return res.json({ isLoggedIn: true, user });
            return { isLoggedIn: true, user };
          }
        }
      }

      // 2) No short token -> try long token
      // if (!longToken) {
      if (!longToken?.length) {
        // return res.status(401).json({ isLoggedIn: false });
        return { isLoggedIn: false };
      }

      const decodedLong = verifyLongToken(longToken);
      if (!decodedLong?.id) {
        // return res.status(401).json({ isLoggedIn: false });
        return { isLoggedIn: false };
      }

      // 3) Fetch user
      const user = await this.prisma.users.findUnique({
        where: { id: decodedLong.id },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        // return res.status(401).json({ isLoggedIn: false });
        return { isLoggedIn: false };
      }

      // 4) Refresh short token
      const newShortToken = signShortToken(user.id, user.email);

      res.cookie('shortTerm_token', newShortToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      });

      // return res.json({ isLoggedIn: true, user });
      return { isLoggedIn: true, user };
    } catch (err) {
      console.error('Auth check error:', err);
      return res.status(500).json({ isLoggedIn: false });
    }
  }
}
