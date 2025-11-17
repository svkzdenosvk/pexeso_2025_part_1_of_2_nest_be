import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, PrismaService } from './auth.service';
import {
  verifyShortToken,
  verifyLongToken,
  signShortToken,
} from '../jwt/jwt.helper';

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //login
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    const { email, password } = body;

    if (!email || !password) {
      throw new HttpException('missing_credentials', HttpStatus.BAD_REQUEST);
    }

    const result = await this.authService.validateUser(email, password);
    if (!result) {
      throw new HttpException('invalid_credentials', HttpStatus.UNAUTHORIZED);
    }

    const { user, shortToken, longToken } = result;

    // Cookies
    res.cookie('shortTerm_token', shortToken, {
      httpOnly: true,
      secure: false, // LOCAL dev → false
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('longTerm_token', longToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
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
      throw new HttpException('missing_credentials', HttpStatus.BAD_REQUEST);
    }

    const result = await this.authService.registerUser(name, email, password);

    if (!result.success) {
      if (result.error === 'email_registered') {
        throw new HttpException('email_registered', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('req_failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // if (!result.user) {
    //   return res.status(401).json({ error: 'invalid_credentials' });
    // }
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
  logout(@Res() res: Response) {
    // clear cookies
    res.clearCookie('shortTerm_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    res.clearCookie('longTerm_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    return res.json({ success: true });
  }

  //authCheck /api/me
  @Get('me')
  async me(@Req() req: Request, @Res() res: Response) {
    try {
      const shortToken = req.cookies['shortTerm_token'];
      const longToken = req.cookies['longTerm_token'];

      // 1) Try short token
      if (shortToken) {
        const decodedShort: any = verifyShortToken(shortToken);

        if (decodedShort?.id) {
          const user = await this.prisma.users.findUnique({
            where: { id: decodedShort.id },
            select: { id: true, email: true, name: true },
          });

          if (user) {
            return res.json({ isLoggedIn: true, user });
          }
        }
      }

      // 2) No short token -> try long token
      if (!longToken) {
        return res.status(401).json({ isLoggedIn: false });
      }

      const decodedLong: any = verifyLongToken(longToken);
      if (!decodedLong?.id) {
        return res.status(401).json({ isLoggedIn: false });
      }

      // 3) Fetch user
      const user = await this.prisma.users.findUnique({
        where: { id: decodedLong.id },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        return res.status(401).json({ isLoggedIn: false });
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

      return res.json({ isLoggedIn: true, user });
    } catch (err) {
      console.error('Auth check error:', err);
      return res.status(500).json({ isLoggedIn: false });
    }
  }
}
