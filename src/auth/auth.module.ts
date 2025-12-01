import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Auth Module
 *
 * Encapsulates authentication functionality including:
 * - Login, registration, logout, and auth-check routes
 * - Integration with Prisma for database access
 * - JWT token handling via AuthService
 *
 * Providers:
 * - AuthService: contains the core authentication logic
 * - PrismaService: database access layer
 *
 * Controllers:
 * - AuthController: exposes REST API endpoints for authentication
 */
@Module({
  controllers: [AuthController], // handles incoming auth-related requests
  providers: [AuthService, PrismaService], // business logic + DB access
})
export class AuthModule {}
