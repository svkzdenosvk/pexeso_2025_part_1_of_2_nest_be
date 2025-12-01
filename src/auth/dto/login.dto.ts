import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for user login.
 *
 * Purpose of validation:
 * - Ensures correct field formats
 * - Blocks oversized payloads (basic DoS/memory abuse prevention)
 *
 * Validates incoming request body:
 * - email: valid email format
 * - password: string, 6–20 characters
 */
export class LoginDto {
  @MaxLength(50)
  @IsEmail()
  email: string;

  @MaxLength(50)
  @IsString()
  @MinLength(6)
  password: string;
}
