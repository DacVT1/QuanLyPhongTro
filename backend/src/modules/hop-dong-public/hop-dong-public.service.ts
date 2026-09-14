import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TaiKhoan } from '../../entities/tai-khoan.entity';
import { NhaTro } from '../../entities/nha-tro.entity';
import { Phong } from '../../entities/phong.entity';
import { Giuong } from '../../entities/giuong.entity';
import { HopDongPublicPdfService } from './hop-dong-public-pdf.service';
import { EmailService } from '../email/email.service';

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
    private readonly emailService: EmailService,
    private readonly pdfService: HopDongPublicPdfService,
  ) {}

  async submitContract(
    body: any,
    files: {
      cccdMatTruoc?: Express.Multer.File[];
      cccdMatSau?: Express.Multer.File[];
    },
  ) {
    // 1. Validate dữ liệu
    if (!body.email) {
      throw new BadRequestException('Email người thuê không được để trống.');
    }
    const cccdMatTruoc = files?.cccdMatTruoc?.[0];
    const cccdMatSau = files?.cccdMatSau?.[0];

    if (!cccdMatTruoc) {
      throw new BadRequestException('Vui lòng cung cấp ảnh CCCD mặt trước.');
    }

    if (!cccdMatSau) {
      throw new BadRequestException('Vui lòng cung cấp ảnh CCCD mặt sau.');
    }
    // 2. Tìm phòng
    const phong = await this.phongRepository.findOne({
      where: {
        id: body.phongId,
      },
      relations: {
        nhaTro: true,
      },
    });

    if (!phong) {
      throw new NotFoundException('Không tìm thấy phòng.');
    }

    // 3. Tìm giường
    const giuong = await this.giuongRepository.findOne({
      where: {
        id: body.giuongId,
      },
      relations: {
        phong: {
          nhaTro: true,
        },
      },
    });

    if (!giuong) {
      throw new NotFoundException('Không tìm thấy giường.');
    }

    // 4. Kiểm tra giường đã được thuê chưa
    const status = String(giuong.trangThai ?? '').toLowerCase();

    if (['da_thue', 'đã thuê', 'occupied'].includes(status)) {
      throw new BadRequestException('Giường này đã được thuê.');
    }

    // 5. Tạo hợp đồng trong database
    // Phần này cần map chính xác theo HopDong entity
    // hiện tại của project.

    // const hopDong = this.hopDongRepository.create(...);
    // const savedHopDong = await this.hopDongRepository.save(hopDong);

    // 6. Tạo PDF
    const pdfBuffer = await this.pdfService.generate({
      // =========================
      // BÊN A
      // =========================
      benA: {
        hoTen: 'Nguyễn Thị Chi',
        cccd: '0909889908098',
        ngayCap: '12/13/2026',
        noiCap: 'Bộ công an',
        sdt: '098989898',
        nganHang: 'Viettin bank',
        soTaiKhoan: '09453242344',
        chuTaiKhoan: 'Nguyễn Thị Chi',
        diaChi: 'Cầu Giấy',
      },

      // =========================
      // BÊN B
      // =========================
      hoTen: body.hoTen,
      cccd: body.cccd,
      sdt: body.sdt,
      email: body.email,
      ngaySinh: body.ngaySinh,
      diaChi: body.diaChi,
      bienSoXe: body.bienSoXe,
      cccdMatTruoc: cccdMatTruoc.buffer,
      cccdMatSau: cccdMatSau.buffer,

      // =========================
      // ĐIỀU 1
      // =========================
      tenNhaTro: phong.nhaTro?.tenNhaTro ?? '',
      diaChiNhaTro: phong.nhaTro?.diaChi ?? '',
      tangSo: phong.tangSo,
      maPhong: phong.maPhong,
      giuongSo: giuong.giuongSo,

      // =========================
      // ĐIỀU 2
      // =========================
      tienDatCoc: Number(body.tienDatCoc),
      tienThue: Number(giuong.giaGiuong),

      // =========================
      // ĐIỀU 3
      // =========================
      ngayBatDau: body.ngayBatDau,
      ngayKetThuc: body.ngayKetThuc,

      // =========================
      // XÁC NHẬN
      // =========================
      benBDaKy: Boolean(body.benBDaKy),
      dongYHopDong: Boolean(body.dongYHopDong),
    });

    // 7. Tạo tên file
    const fileName =
      `Hop-Dong-Thue-Tro-${body.hoTen}`.replace(/[^a-zA-Z0-9À-ỹ0-9-_]/g, '-') +
      '.pdf';

    // 8. Gửi cho Bên B + Bên A
    await this.emailService.sendContractPdf(
      [body.email, 'nguyenchihaucan@gmail.com'],
      fileName,
      pdfBuffer,
      body.hoTen,
    );

    return {
      success: true,
      message: 'Hợp đồng đã được tạo và gửi qua email thành công.',
    };
  }
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
