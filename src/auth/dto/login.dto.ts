// src/auth/dto/login.dto.ts
import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Zadaj platný email' })
  email: string;

  @MinLength(1, { message: 'Heslo nesmie byť prázdne' })
  password: string;
}