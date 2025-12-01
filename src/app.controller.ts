import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * APPLICATION CONTROLLER
 *
 * This controller handles basic application routes.
 *
 * Current functionality:
 * - GET / → returns a simple greeting message from AppService
 *
 * Responsibilities:
 * - Serve as the main entry point for generic routes
 * - Delegate business logic to AppService
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
