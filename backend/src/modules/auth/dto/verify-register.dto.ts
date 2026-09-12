import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyRegisterDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
