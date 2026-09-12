import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Request } from 'express';

import { TaiKhoan } from '../../../entities/tai-khoan.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(TaiKhoan)
    private readonly taiKhoanRepository: Repository<TaiKhoan>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thiếu access token');
    }

    const token = authHeader.substring(7);

    try {
      // =====================================================
      // 1. KIỂM TRA JWT
      // =====================================================

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (!payload.sub || !payload.tenantId) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      // =====================================================
      // 2. KIỂM TRA TÀI KHOẢN CÒN TỒN TẠI TRONG DATABASE
      // =====================================================

      const taiKhoan = await this.taiKhoanRepository.findOne({
        where: {
          id: payload.sub,
        },

        relations: {
          tenant: true,
        },
      });

      // Tài khoản hoặc tenant đã bị xóa
      if (!taiKhoan || !taiKhoan.tenant) {
        throw new UnauthorizedException(
          'Tài khoản không còn tồn tại hoặc tenant đã bị xóa',
        );
      }

      // =====================================================
      // 3. KIỂM TRA TENANT CỦA JWT VỚI DATABASE
      // =====================================================

      if (String(taiKhoan.tenant.id) !== String(payload.tenantId)) {
        throw new UnauthorizedException('Tenant của tài khoản không hợp lệ');
      }

      // =====================================================
      // 4. GẮN USER VÀO REQUEST
      // =====================================================

      (request as any).user = payload;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        'Access token không hợp lệ hoặc đã hết hạn',
      );
    }
  }
}
