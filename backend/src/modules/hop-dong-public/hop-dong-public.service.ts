import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TaiKhoan } from '../../entities/tai-khoan.entity';
import { NhaTro } from '../../entities/nha-tro.entity';
import { Phong } from '../../entities/phong.entity';
import { Giuong } from '../../entities/giuong.entity';

@Injectable()
export class HopDongPublicService {
  /**
   * Tài khoản cung cấp dữ liệu cho
   * Form HỢP ĐỒNG THUÊ TRỌ public.
   *
   * Người thuê không cần đăng nhập.
   */
  private readonly publicEmail = 'nguyenchihaucan@gmail.com';

  constructor(
    @InjectRepository(TaiKhoan)
    private readonly taiKhoanRepository: Repository<TaiKhoan>,

    @InjectRepository(NhaTro)
    private readonly nhaTroRepository: Repository<NhaTro>,

    @InjectRepository(Phong)
    private readonly phongRepository: Repository<Phong>,

    @InjectRepository(Giuong)
    private readonly giuongRepository: Repository<Giuong>,
  ) {}

  async getData() {
    // ==========================================
    // 1. Tìm tài khoản public
    // ==========================================
    const taiKhoan = await this.taiKhoanRepository.findOne({
      where: {
        email: this.publicEmail,
      },
      relations: {
        tenant: true,
      },
    });

    if (!taiKhoan) {
      throw new NotFoundException(
        'Không tìm thấy tài khoản cung cấp dữ liệu hợp đồng.',
      );
    }

    // ==========================================
    // 2. Lấy tenant_id
    // ==========================================
    const tenantId = taiKhoan.tenant?.id;

    if (!tenantId) {
      throw new NotFoundException('Tài khoản chưa được cấu hình tenant.');
    }

    // ==========================================
    // 3. Lấy Nhà trọ của tenant
    // ==========================================
    const nhaTros = await this.nhaTroRepository.find({
      where: {
        tenant: {
          id: tenantId,
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });

    // ==========================================
    // 4. Lấy Phòng của tenant
    // ==========================================
    const phongs = await this.phongRepository.find({
      where: {
        tenant: {
          id: tenantId,
        },
      },
      relations: {
        nhaTro: true,
      },
      order: {
        tangSo: 'ASC',
        maPhong: 'ASC',
      },
    });

    // ==========================================
    // 5. Lấy Giường của tenant
    // ==========================================
    const giuongs = await this.giuongRepository.find({
      where: {
        tenant: {
          id: tenantId,
        },
      },
      relations: {
        phong: {
          nhaTro: true,
        },
      },
      order: {
        giuongSo: 'ASC',
      },
    });

    // ==========================================
    // 6. Trả dữ liệu public
    // ==========================================
    return {
      nhaTros,
      phongs,
      giuongs,
    };
  }
}
