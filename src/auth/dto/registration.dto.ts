import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for user registration.
 *
 * Purpose of validation:
 * - Ensures correct field formats
 * - Blocks oversized payloads (basic DoS/memory abuse prevention)
 *
 * Validates incoming request body using class-validator:
 * - name: required string, 3–50 characters
 * - email: valid email format, max 50 characters
 * - password: string, 6–20 characters
 */

export class RegistrationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @MaxLength(50)
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;
}
