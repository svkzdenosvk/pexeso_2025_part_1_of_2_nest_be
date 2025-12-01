import { Injectable } from '@nestjs/common';

/**
 * APPLICATION SERVICE
 *
 * This service provides basic application-wide functionality.
 * Currently, it contains a simple method to return a greeting string.
 *
 * Responsibilities:
 * - Provide methods that are accessible throughout the application
 * - Encapsulate common logic that doesn't belong to a specific module
 */
@Injectable()
export class AppService {
  /**
   * Returns a simple greeting message.
   *
   * @returns {string} A greeting string
   */
  getHello(): string {
    return 'This is NestJS ';
  }
}
