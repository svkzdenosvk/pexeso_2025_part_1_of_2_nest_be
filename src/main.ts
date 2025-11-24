import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function mainFn() {
  const app = await NestFactory.create(AppModule);

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

void mainFn();
