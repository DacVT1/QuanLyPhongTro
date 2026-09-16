import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
