import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ForgotDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  _csrf?: string;
}
