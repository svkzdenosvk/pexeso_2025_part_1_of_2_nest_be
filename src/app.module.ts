import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';

/**
 * APPLICATION MODULE
 *
 * This is the root module of the NestJS application.
 * It organizes the main structure of the app by:
 * - Importing feature modules (e.g., AuthModule)
 * - Registering global controllers (e.g., AppController)
 * - Providing shared services (e.g., AppService, PrismaService)
 *
 * Responsibilities:
 * - Serve as the entry point for module composition
 * - Centralize the main dependencies and providers
 *
 */
@Module({
  imports: [AuthModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
