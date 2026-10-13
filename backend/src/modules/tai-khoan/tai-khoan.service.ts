import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TaiKhoan } from '../../entities/tai-khoan.entity';
import * as bcrypt from 'bcrypt';
import { Tenant } from 'src/entities/tenant.entity';

@Injectable()
export class TaiKhoanService {
  constructor(
    @InjectRepository(TaiKhoan)
    private readonly repository: Repository<TaiKhoan>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    private readonly dataSource: DataSource,
  ) {}

  async findAll(tenantId: string) {
    return this.repository.find({
      where: {
        tenant: {
          id: tenantId,
        },
      },
      relations: { nhaTros: true },
    });
  }

  async findAllUsersForAdmin(adminId: string) {
    // Kiểm tra quyền admin trực tiếp từ database,
    // không chỉ tin role được lưu trong JWT.
    const admin = await this.repository.findOne({
      where: {
        id: adminId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!admin || admin.role !== 'admin') {
      throw new ForbiddenException(
        'Bạn không có quyền xem danh sách tài khoản.',
      );
    }

    // Lấy tất cả tài khoản có role user trên toàn hệ thống.
    // Không giới hạn theo tenant của admin.
    // Không trả về passwordHash hoặc dữ liệu CCCD/ngân hàng.
    return this.repository.find({
      where: {
        role: 'user',
      },
      select: {
        id: true,
        username: true,
        tenHienThi: true,
        email: true,
        role: true,
        createdAt: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async removeUserForAdmin(adminId: string, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const taiKhoanRepo = manager.getRepository(TaiKhoan);

      // 1. Kiểm tra quyền admin trực tiếp từ database.
      const admin = await taiKhoanRepo.findOne({
        where: { id: adminId },
        select: {
          id: true,
          role: true,
        },
      });

      if (!admin || admin.role !== 'admin') {
        throw new ForbiddenException('Bạn không có quyền xóa tài khoản.');
      }

      // 2. Tìm tài khoản cần xóa và tenant liên quan.
      const targetUser = await taiKhoanRepo.findOne({
        where: { id: userId },
        relations: {
          tenant: true,
        },
      });

      if (!targetUser) {
        throw new NotFoundException('Không tìm thấy tài khoản cần xóa.');
      }

      // Không cho phép admin xóa tài khoản admin khác.
      if (targetUser.role !== 'user') {
        throw new ForbiddenException(
          'Chỉ được phép xóa tài khoản có quyền user.',
        );
      }

      const tenantId = targetUser.tenant?.id;

      if (!tenantId) {
        throw new BadRequestException(
          'Tài khoản không có tenant liên kết. Không thể xóa dữ liệu an toàn.',
        );
      }

      // 3. Xóa OTP đặt lại mật khẩu của email tài khoản (nếu có).
      if (targetUser.email) {
        await manager.query(
          `DELETE FROM "password_reset_otp" WHERE "email" = $1`,
          [targetUser.email],
        );
      }

      // 4. Xóa dữ liệu theo thứ tự tránh vi phạm khóa ngoại.
      // Chỉ xóa các bản ghi thuộc tenant đang được xử lý.
      const tables = [
        'hoa_don',
        'hop_dong',
        'giuong',
        'phong',
        'nha_tro',
        'nguoi_thue',
        'subscription',
        'tai_khoan',
      ];

      for (const table of tables) {
        await manager.query(`DELETE FROM "${table}" WHERE "tenant_id" = $1`, [
          tenantId,
        ]);
      }

      // 5. Xóa tenant sau khi dữ liệu liên quan đã được xóa.
      await manager.query(`DELETE FROM "tenant" WHERE "id" = $1`, [tenantId]);

      return {
        message:
          'Đã xóa tài khoản, tenant và toàn bộ dữ liệu thuộc tenant thành công.',
        id: userId,
        tenantId,
      };
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
      relations: { nhaTros: true },
    });
  }

  async create(payload: Partial<TaiKhoan>, tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('Không xác định được tenant.');
    }

    const tenant = await this.tenantRepository.findOne({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Không tìm thấy tenant.');
    }

    const { id: _ignoredId, tenant: _ignoredTenant, ...data } = payload as any;

    if (data.passwordHash) {
      data.passwordHash = await bcrypt.hash(data.passwordHash, 10);
    }

    const taiKhoan = this.repository.create({
      ...data,
      tenant,
    });

    return this.repository.save(taiKhoan);
  }

  async update(id: string, payload: Partial<TaiKhoan>, tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('Không xác định được tenant.');
    }

    const item = await this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy tài khoản.');
    }

    const { id: _ignoredId, tenant: _ignoredTenant, ...data } = payload as any;

    Object.assign(item, data);

    return this.repository.save(item);
  }

  async remove(id: string, tenantId: string) {
    const item = await this.findOne(id, tenantId);
    if (!item) return null;
    await this.repository.remove(item);
    return item;
  }

  async getMe(id: string, tenantId: string) {
    const item = await this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản.');
    }

    return this.toProfileResponse(item);
  }

  async updateMe(
    id: string,
    tenantId: string,
    payload: any,
    file?: Express.Multer.File,
  ) {
    const item = await this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản.');
    }

    item.hoTen = payload.hoTen ?? '';
    item.tenHienThi = payload.tenHienThi ?? '';
    item.soCccd = payload.soCccd ?? '';
    item.ngayCap = payload.ngayCap || null;
    item.noiCap = payload.noiCap ?? '';
    item.diaChiThuongTru = payload.diaChiThuongTru ?? '';
    item.email = payload.email ?? '';
    item.dienThoai = payload.dienThoai ?? '';
    item.nganHang = payload.nganHang ?? '';
    item.soTaiKhoan = payload.soTaiKhoan ?? '';
    item.chuTaiKhoan = payload.chuTaiKhoan ?? '';

    if (file) {
      item.maQrThanhToan = `/uploads/tai-khoan/${file.filename}`;
    }

    const saved = await this.repository.save(item);

    return this.toProfileResponse(saved);
  }

  private toProfileResponse(item: TaiKhoan) {
    return {
      id: item.id,
      username: item.username,

      hoTen: item.hoTen ?? '',
      tenHienThi: item.tenHienThi ?? '',
      soCccd: item.soCccd ?? '',
      ngayCap: item.ngayCap ?? '',
      noiCap: item.noiCap ?? '',
      diaChiThuongTru: item.diaChiThuongTru ?? '',
      email: item.email ?? '',
      dienThoai: item.dienThoai ?? '',
      nganHang: item.nganHang ?? '',
      soTaiKhoan: item.soTaiKhoan ?? '',
      chuTaiKhoan: item.chuTaiKhoan ?? '',
      maQrThanhToan: item.maQrThanhToan ?? '',
    };
  }
}
