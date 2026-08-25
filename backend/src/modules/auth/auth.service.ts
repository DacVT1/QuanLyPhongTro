import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { TaiKhoan } from '../../entities/tai-khoan.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TaiKhoan)
    private readonly taiKhoanRepository: Repository<TaiKhoan>,

    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const username = dto.username.trim();

    const existingAccount =
      await this.taiKhoanRepository.findOne({
        where: { username },
      });

    if (existingAccount) {
      throw new ConflictException(
        'Tên đăng nhập đã tồn tại',
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      10,
    );

    const taiKhoan =
      this.taiKhoanRepository.create({
        username,
        passwordHash,
        tenHienThi: dto.tenHienThi.trim(),
        email: dto.email?.trim() || undefined,
        role: 'admin',
      });

    const saved =
      await this.taiKhoanRepository.save(taiKhoan);

    return {
      message: 'Đăng ký tài khoản thành công',
      account: {
        id: saved.id,
        username: saved.username,
        tenHienThi: saved.tenHienThi,
        email: saved.email,
        role: saved.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const username = dto.username.trim();

    const taiKhoan =
      await this.taiKhoanRepository.findOne({
        where: { username },
      });

    if (!taiKhoan) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không đúng',
      );
    }

    const passwordValid =
      await bcrypt.compare(
        dto.password,
        taiKhoan.passwordHash,
      );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không đúng',
      );
    }

    const payload = {
      sub: taiKhoan.id,
      username: taiKhoan.username,
      role: taiKhoan.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      message: 'Đăng nhập thành công',
      accessToken,
      user: {
        id: taiKhoan.id,
        username: taiKhoan.username,
        tenHienThi: taiKhoan.tenHienThi,
        email: taiKhoan.email,
        role: taiKhoan.role,
      },
    };
  }
}