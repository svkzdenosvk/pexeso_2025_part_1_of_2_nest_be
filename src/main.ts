import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

/**
 * MAIN ENTRY POINT
 *
 * This file initializes and starts the NestJS application.
 * It sets up global validation, CORS, and cookie parsing.
 *
 * Responsibilities:
 * - Create NestJS application from AppModule
 * - Apply global validation pipes (whitelist, forbid unknown properties, auto-transform)
 * - Enable CORS for frontend communication with credentials support
 * - Use cookie parser for reading and setting cookies
 * - Start server on specified port (default 3000)
 */

async function mainFn() {
  // Create NestJS application
  const app = await NestFactory.create(AppModule);

  // Apply global validation rules
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://localhost:5173', // local Vite dev
      'http://localhost:4173', // Vite preview
      'https://vite-postgres.netlify.app', // production FE
    ],
    credentials: true, // important for cookies
  });

  // Cookie parser
  app.use(cookieParser());

  // Start Server
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  console.log('🚀 Nest server running on port 3000');
}

// Initialize the app
void mainFn();
