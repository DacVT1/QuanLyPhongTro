import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

import { TaiKhoan } from '../../entities/tai-khoan.entity';
import { NhaTro } from '../../entities/nha-tro.entity';
import { Phong } from '../../entities/phong.entity';
import { Giuong } from '../../entities/giuong.entity';
import { HopDongPublicPdfService } from './hop-dong-public-pdf.service';
import { EmailService } from '../email/email.service';
import { HopDongXacNhan } from 'src/entities/hop-dong-xac-nhan.entity';
import { NguoiThue } from '../../entities/nguoi-thue.entity';
import { HopDong } from '../../entities/hop-dong.entity';

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

    @InjectRepository(HopDongXacNhan)
    private readonly hopDongXacNhanRepository: Repository<HopDongXacNhan>,
    private readonly emailService: EmailService,
    private readonly pdfService: HopDongPublicPdfService,

    @InjectRepository(NguoiThue)
    private readonly nguoiThueRepository: Repository<NguoiThue>,

    @InjectRepository(HopDong)
    private readonly hopDongRepository: Repository<HopDong>,
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
        nhaTro: {
          tenant: true,
        },
      },
    });

    if (!phong) {
      throw new NotFoundException('Không tìm thấy phòng.');
    }

    if (!phong.nhaTro) {
      throw new NotFoundException('Phòng chưa được liên kết với nhà trọ.');
    }

    const tenant = phong.nhaTro.tenant;

    if (!tenant) {
      throw new NotFoundException('Không xác định được tenant của nhà trọ.');
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
      benBDaKy:
        body.benBDaKy === true ||
        body.benBDaKy === 'true' ||
        body.benBDaKy === 1 ||
        body.benBDaKy === '1',

      dongYHopDong:
        body.dongYHopDong === true ||
        body.dongYHopDong === 'true' ||
        body.dongYHopDong === 1 ||
        body.dongYHopDong === '1',
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

  async requestVerification(
    body: any,
    files: {
      cccdMatTruoc?: Express.Multer.File[];
      cccdMatSau?: Express.Multer.File[];
    },
  ) {
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

    // Tìm phòng
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

    // Tìm giường
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

    const status = String(giuong.trangThai ?? '').toLowerCase();

    if (['da_thue', 'đã thuê', 'occupied'].includes(status)) {
      throw new BadRequestException('Giường này đã được thuê.');
    }

    // OTP 6 số
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // OTP hết hạn sau 10 phút
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const benBDaKy =
      body.benBDaKy === true ||
      body.benBDaKy === 'true' ||
      body.benBDaKy === 1 ||
      body.benBDaKy === '1';

    const dongYHopDong =
      body.dongYHopDong === true ||
      body.dongYHopDong === 'true' ||
      body.dongYHopDong === 1 ||
      body.dongYHopDong === '1';

    if (!dongYHopDong) {
      throw new BadRequestException('Bên B chưa đồng ý với nội dung hợp đồng.');
    }

    const pendingContract = this.hopDongXacNhanRepository.create({
      email: body.email.trim(),
      hoTen: body.hoTen.trim(),

      verificationCode,

      expiresAt,

      verified: false,

      attemptCount: 0,

      contractData: {
        hoTen: body.hoTen,
        cccd: body.cccd,
        sdt: body.sdt,
        email: body.email,
        ngaySinh: body.ngaySinh,
        diaChi: body.diaChi,
        bienSoXe: body.bienSoXe,

        nhaTroId: body.nhaTroId,
        tangSo: body.tangSo,
        phongId: body.phongId,
        giuongId: body.giuongId,

        tienDatCoc: Number(body.tienDatCoc),

        ngayBatDau: body.ngayBatDau,
        ngayKetThuc: body.ngayKetThuc,

        benBDaKy,
        dongYHopDong,
      },

      cccdMatTruoc: cccdMatTruoc.buffer,

      cccdMatSau: cccdMatSau.buffer,

      cccdMatTruocMimeType: cccdMatTruoc.mimetype,

      cccdMatSauMimeType: cccdMatSau.mimetype,
    });

    const saved = await this.hopDongXacNhanRepository.save(pendingContract);

    await this.emailService.sendContractVerificationCode(
      body.email.trim(),
      body.hoTen.trim(),
      verificationCode,
      benBDaKy,
    );

    return {
      success: true,

      verificationId: saved.id,

      message: 'Mã xác nhận đã được gửi đến email của Bên B.',
    };
  }

  async verifyContract(verificationId: string, code: string) {
    const pending = await this.hopDongXacNhanRepository.findOne({
      where: {
        id: verificationId,
      },
    });

    if (!pending) {
      throw new NotFoundException('Không tìm thấy yêu cầu xác nhận hợp đồng.');
    }

    if (pending.verified) {
      throw new BadRequestException('Mã xác nhận này đã được sử dụng.');
    }

    if (new Date() > new Date(pending.expiresAt)) {
      throw new BadRequestException(
        'Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới.',
      );
    }

    if (pending.attemptCount >= 5) {
      throw new BadRequestException('Bạn đã nhập sai mã quá số lần cho phép.');
    }

    if (String(code).trim() !== String(pending.verificationCode)) {
      pending.attemptCount += 1;

      await this.hopDongXacNhanRepository.save(pending);

      throw new BadRequestException(
        'Mã xác nhận không đúng. Vui lòng kiểm tra lại.',
      );
    }

    const body = pending.contractData;

    const phong = await this.phongRepository.findOne({
      where: {
        id: body.phongId,
      },
      relations: {
        nhaTro: {
          tenant: true,
        },
      },
    });

    if (!phong) {
      throw new NotFoundException('Không tìm thấy phòng.');
    }

    const giuong = await this.giuongRepository.findOne({
      where: {
        id: body.giuongId,
      },
      relations: {
        phong: {
          nhaTro: {
            tenant: true,
          },
        },
      },
    });

    if (!giuong) {
      throw new NotFoundException('Không tìm thấy giường.');
    }

    const status = String(giuong.trangThai ?? '').toLowerCase();

    if (['da_thue', 'đã thuê', 'occupied'].includes(status)) {
      throw new BadRequestException('Giường này đã được thuê.');
    }

    if (giuong.phong?.id !== phong.id) {
      throw new BadRequestException('Giường không thuộc phòng đã chọn.');
    }

    const nguoiThue = await this.createNguoiThueFromContract(
      pending,
      giuong.phong,
    );

    if (!nguoiThue) {
      throw new BadRequestException(
        'Không thể xác định người thuê để tạo hợp đồng.',
      );
    }

    const hopDong = await this.createHopDongFromContract(
      pending,
      phong,
      giuong,
      nguoiThue,
    );

    if (!hopDong) {
      throw new BadRequestException('Không thể tạo hợp đồng.');
    }

    giuong.trangThai = 'da_thue';

    await this.giuongRepository.save(giuong);

    const pdfBuffer = await this.pdfService.generate({
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

      hoTen: body.hoTen,
      cccd: body.cccd,
      sdt: body.sdt,
      email: body.email,
      ngaySinh: body.ngaySinh,
      diaChi: body.diaChi,
      bienSoXe: body.bienSoXe,

      cccdMatTruoc: pending.cccdMatTruoc,

      cccdMatSau: pending.cccdMatSau,

      tenNhaTro: phong.nhaTro?.tenNhaTro ?? '',

      diaChiNhaTro: phong.nhaTro?.diaChi ?? '',

      tangSo: phong.tangSo,

      maPhong: phong.maPhong,

      giuongSo: giuong.giuongSo,

      tienDatCoc: Number(body.tienDatCoc),

      tienThue: Number(giuong.giaGiuong),

      ngayBatDau: body.ngayBatDau,

      ngayKetThuc: body.ngayKetThuc,

      benBDaKy: body.benBDaKy,

      dongYHopDong: body.dongYHopDong,
    });

    const fileName =
      `Hop-Dong-Thue-Tro-${body.hoTen}`.replace(/[^a-zA-Z0-9À-ỹ0-9-_]/g, '-') +
      '.pdf';

    await this.emailService.sendContractPdf(
      [body.email, 'nguyenchihau@gmail.com'],
      fileName,
      pdfBuffer,
      body.hoTen,
    );

    pending.verified = true;

    await this.hopDongXacNhanRepository.save(pending);

    return {
      success: true,

      message: 'Xác nhận thành công. Hợp đồng đã được gửi đến email của bạn.',
    };
  }

  private async saveNguoiThueImage(
    buffer: Buffer,
    mimeType: string | null,
  ): Promise<string> {
    const storageDir =
      process.env.STORAGE_DIR || join(process.cwd(), 'uploads');

    const uploadDir = join(storageDir, 'nguoi-thue');

    await mkdir(uploadDir, {
      recursive: true,
    });

    let extension = '.jpg';

    if (mimeType === 'image/png') {
      extension = '.png';
    } else if (mimeType === 'image/webp') {
      extension = '.webp';
    } else if (mimeType === 'image/jpeg') {
      extension = '.jpg';
    }

    const fileName = `${randomUUID()}${extension}`;

    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    return `/uploads/nguoi-thue/${fileName}`;
  }

  private async createNguoiThueFromContract(
    pending: HopDongXacNhan,
    phong: Phong,
  ): Promise<NguoiThue | null> {
    const body = pending.contractData;

    const benBDaKy =
      body.benBDaKy === true ||
      body.benBDaKy === 'true' ||
      body.benBDaKy === 1 ||
      body.benBDaKy === '1';

    // Không ký thì không tạo người thuê
    // if (!benBDaKy) {
    //   return null;
    // }

    const tenant = phong.nhaTro?.tenant;

    if (!tenant) {
      throw new NotFoundException('Không xác định được tenant của nhà trọ.');
    }
    // Kiểm tra Người thuê đã tồn tại theo CCCD trong cùng tenant
    const existingNguoiThue = await this.nguoiThueRepository.findOne({
      where: {
        cccd: body.cccd?.trim(),
        tenant: {
          id: tenant.id,
        },
      },
    });

    if (existingNguoiThue) {
      return existingNguoiThue;
    }
    // Lưu ảnh CCCD
    const cccdMatTruoc = await this.saveNguoiThueImage(
      pending.cccdMatTruoc,
      pending.cccdMatTruocMimeType,
    );

    const cccdMatSau = await this.saveNguoiThueImage(
      pending.cccdMatSau,
      pending.cccdMatSauMimeType,
    );

    const nguoiThue = this.nguoiThueRepository.create({
      hoTen: body.hoTen?.trim(),
      cccd: body.cccd?.trim(),
      sdt: body.sdt?.trim(),
      email: body.email?.trim(),
      diaChi: body.diaChi?.trim(),
      ngaySinh: body.ngaySinh || null,
      bienSoXe: body.bienSoXe?.trim() || null,

      cccdMatTruoc,
      cccdMatSau,

      tenant,
    });

    return this.nguoiThueRepository.save(nguoiThue);
  }

  private async generateMaHopDong(
    phong: Phong,
    giuong: Giuong,
  ): Promise<string> {
    const nhaTroCode =
      phong.nhaTro?.maNhaTro || phong.nhaTro?.tenNhaTro || 'NHA-TRO';

    const phongCode = phong.maPhong || `P${phong.id}`;

    const giuongCode = String(giuong.giuongSo ?? `G${giuong.id}`);

    const prefix = `${nhaTroCode}_${phongCode}_${giuongCode}`;

    const existingContracts = await this.hopDongRepository
      .createQueryBuilder('hopDong')
      .where('hopDong.maHopDong LIKE :prefix', {
        prefix: `${prefix}_%`,
      })
      .getMany();

    let sequence = existingContracts.length + 1;

    let maHopDong = `${prefix}_${sequence}`;

    while (
      await this.hopDongRepository.findOne({
        where: {
          maHopDong,
        },
      })
    ) {
      sequence += 1;
      maHopDong = `${prefix}_${sequence}`;
    }

    return maHopDong;
  }

  private async createHopDongFromContract(
    pending: HopDongXacNhan,
    phong: Phong,
    giuong: Giuong,
    nguoiThue: NguoiThue,
  ): Promise<HopDong> {
    const body = pending.contractData;

    if (!nguoiThue) {
      throw new BadRequestException(
        'Không xác định được người thuê để tạo hợp đồng.',
      );
    }

    const tenant = phong.nhaTro?.tenant;

    if (!tenant) {
      throw new NotFoundException('Không xác định được tenant của nhà trọ.');
    }

    const maHopDong = await this.generateMaHopDong(phong, giuong);

    const hopDong = this.hopDongRepository.create({
      maHopDong,

      ngayBatDau: new Date(body.ngayBatDau),

      ngayKetThuc: body.ngayKetThuc ? new Date(body.ngayKetThuc) : null,

      tienThue: Number(giuong.giaGiuong ?? 0),

      chuKyThanhToan: 1,

      tienDatCoc: Number(body.tienDatCoc ?? 0),

      tienDien: 0,

      tienNuoc: 0,

      tienDichVu: 0,

      trangThai: 'active',

      ghiChu: 'Hợp đồng được tạo từ Form HỢP ĐỒNG THUÊ TRỌ public.',

      giuong,

      nguoiThue,

      tenant,
    });

    return this.hopDongRepository.save(hopDong);
  }
}
