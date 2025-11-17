import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import * as cookieParser from 'cookie-parser';
import cookieParser from 'cookie-parser';

async function mainFn() {
  const app = await NestFactory.create(AppModule);

  // ---- CORS (rovnaké ako v Express) ----
  app.enableCors({
    origin: [
      'http://localhost:5173', // local Vite dev
      'http://localhost:4173', // Vite preview
      'https://vite-postgres.netlify.app', // tvoje production FE
    ],
    credentials: true, // dôležité pre cookies
  });

  // ---- Cookie parser (rovnaké ako v Express) ----
  app.use(cookieParser());

  // ---- JSON parsing (Nest to robí default, ale môžeš nechať) ----
  // app.useBodyParser('json');

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  console.log('🚀 Nest server running on port 3000');
}

void mainFn();
