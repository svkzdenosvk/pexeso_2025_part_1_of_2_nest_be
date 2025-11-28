import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { /*HttpException,*/ ValidationPipe } from '@nestjs/common';

async function mainFn() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //     exceptionFactory: (validationErrors = []) => {
  //       // vezmeme prvú chybu (alebo si spravíš vlastnú logiku)
  //       const errorMsg =
  //         validationErrors[0]?.constraints?.[
  //           Object.keys(validationErrors[0].constraints)[0]
  //         ] || 'invalid_request';

  //       return new HttpException({ error: errorMsg }, 400);
  //     },
  //   }),
  // );

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
