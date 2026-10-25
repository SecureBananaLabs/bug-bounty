import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(Role)
  @IsNotIn([Role.ADMIN], {
    message: 'Admin role cannot be assigned during registration.',
  })
  @IsOptional()
  role?: Role;
}
