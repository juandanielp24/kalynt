import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  tenantName: string;

  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'tenantSlug debe contener solo letras minúsculas, números y guiones',
  })
  tenantSlug: string;

  @IsOptional()
  @IsString()
  country?: string;
}
