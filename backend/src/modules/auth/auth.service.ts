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
import { Tenant } from 'src/entities/tenant.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TaiKhoan)
    private readonly taiKhoanRepository: Repository<TaiKhoan>,

    @InjectRepository(Tenant)
private readonly tenantRepository: Repository<Tenant>,
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

  // 1. Tạo Tenant cho tài khoản đăng ký
  const tenant = this.tenantRepository.create({
    maTenant: `TENANT-${Date.now()}`,
    ten: dto.tenHienThi.trim(),
    trangThai: 'active',
  });

  const savedTenant =
    await this.tenantRepository.save(tenant);

  // 2. Tạo tài khoản và gán Tenant
  const taiKhoan =
    this.taiKhoanRepository.create({
      username,
      passwordHash,
      tenHienThi: dto.tenHienThi.trim(),
      email: dto.email?.trim() || undefined,
      role: 'admin',
      tenant: savedTenant,
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
      tenantId: savedTenant.id,
    },
  };
}

  async login(dto: LoginDto) {
    const username = dto.username.trim();

    const taiKhoan =
  await this.taiKhoanRepository.findOne({
    where: { username },
    relations: {
      tenant: true,
    },
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
  tenantId: taiKhoan.tenant.id,
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