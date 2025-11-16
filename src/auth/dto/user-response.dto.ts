// src/auth/dto/user-response.dto.ts
export class UserResponseDto {
  id: number;
  email: string;
  name?: string;

  constructor(user: any) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
  }
}