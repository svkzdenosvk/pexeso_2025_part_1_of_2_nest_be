import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'missing_credentials' })
  email: string;

  @IsString({ message: 'missing_credentials' })
  @MinLength(4, { message: 'missing_credentials' })
  password: string;
}

//   @IsEmail()
//   email: string;

//   @IsString()
//   @MinLength(6)
//   password: string;
// }
