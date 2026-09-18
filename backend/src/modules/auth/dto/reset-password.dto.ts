import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message: 'Mã xác thực phải gồm 6 chữ số',
  })
  otp: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, {
    message: 'Mật khẩu phải có ít nhất 6 ký tự',
  })
  newPassword: string;
}
