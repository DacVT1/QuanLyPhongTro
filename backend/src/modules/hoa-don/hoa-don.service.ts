import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HoaDon } from '../../entities/hoa-don.entity';
import { HopDong } from '../../entities/hop-dong.entity';

@Injectable()
export class HoaDonService {
  constructor(
    @InjectRepository(HoaDon)
    private readonly repository: Repository<HoaDon>,

    @InjectRepository(HopDong)
    private readonly hopDongRepository: Repository<HopDong>,
  ) {}

  async findAll() {
    return this.repository.find({
      relations: {
        hopDong: {
          nguoiThue: true,
          giuong: {
            phong: {
              nhaTro: true,
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: {
        hopDong: {
          nguoiThue: true,
          giuong: {
            phong: {
              nhaTro: true,
            },
          },
        },
      },
    });
  }

  async create(payload: Partial<HoaDon>) {
    const tienPhong = Number(payload.tienPhong ?? 0);
    const tienDien = Number(payload.tienDien ?? 0);
    const tienNuoc = Number(payload.tienNuoc ?? 0);
    const tienDichVuKhac = Number(payload.tienDichVuKhac ?? 0);

    payload.tienPhong = tienPhong;
    payload.tienDien = tienDien;
    payload.tienNuoc = tienNuoc;
    payload.tienDichVuKhac = tienDichVuKhac;

    payload.tongTien =
      tienPhong +
      tienDien +
      tienNuoc +
      tienDichVuKhac;

    if (payload.trangThai === 'da_thanh_toan') {
      payload.ngayNop = new Date();
    } else {
      payload.ngayNop = null;
    }

    return this.repository.save(
      this.repository.create(payload),
    );
  }

  async update(
    id: string,
    payload: Partial<HoaDon>,
  ) {
    const hoaDon = await this.repository.findOne({
      where: { id },
    });

    if (!hoaDon) {
      throw new NotFoundException(
        'Không tìm thấy hóa đơn',
      );
    }

    const tienPhong = Number(
      payload.tienPhong ??
        hoaDon.tienPhong ??
        0,
    );

    const tienDien = Number(
      payload.tienDien ??
        hoaDon.tienDien ??
        0,
    );

    const tienNuoc = Number(
      payload.tienNuoc ??
        hoaDon.tienNuoc ??
        0,
    );

    const tienDichVuKhac = Number(
      payload.tienDichVuKhac ??
        hoaDon.tienDichVuKhac ??
        0,
    );

    payload.tienPhong = tienPhong;
    payload.tienDien = tienDien;
    payload.tienNuoc = tienNuoc;
    payload.tienDichVuKhac =
      tienDichVuKhac;

    payload.tongTien =
      tienPhong +
      tienDien +
      tienNuoc +
      tienDichVuKhac;

    if (
      payload.trangThai ===
        'da_thanh_toan' &&
      hoaDon.trangThai !==
        'da_thanh_toan'
    ) {
      payload.ngayNop = new Date();
    }

    if (
      payload.trangThai ===
      'chua_thanh_toan'
    ) {
      payload.ngayNop = null;
    }

    await this.repository.update(
      id,
      payload,
    );

    return this.findOne(id);
  }

  /**
   * Tạo hóa đơn cho tất cả các giường
   * đang có người thuê và chưa có hóa đơn
   * trong tháng được chọn.
   */
  async createForAllBeds(
    thangThanhToan: string,
  ) {
    if (!thangThanhToan) {
      throw new BadRequestException(
        'Vui lòng chọn tháng thanh toán',
      );
    }

    /*
     * Chuẩn hóa tháng.
     *
     * Frontend gửi:
     * 2026-08-01
     *
     * Chỉ sử dụng YYYY-MM để kiểm tra.
     */
    const monthKey =
      this.normalizeMonth(thangThanhToan);

    if (!monthKey) {
      throw new BadRequestException(
        'Tháng thanh toán không hợp lệ',
      );
    }

    /*
     * Lấy các hợp đồng đang active.
     *
     * Quan hệ:
     *
     * HopDong
     *   ├── giuong
     *   │    └── phong
     *   │         └── nhaTro
     *   │
     *   ├── nguoiThue
     *   │
     *   └── hoaDons
     */
    const hopDongs =
      await this.hopDongRepository.find({
        where: {
          trangThai: 'active',
        },
        relations: {
          giuong: {
            phong: {
              nhaTro: true,
            },
          },
          nguoiThue: true,
          hoaDons: true,
        },
      });

    /*
     * Chỉ những hợp đồng:
     *
     * - active
     * - có giường
     * - có người thuê
     *
     * mới được tạo hóa đơn.
     */
    const hopDongCoNguoiThue =
      hopDongs.filter(
        (hopDong) =>
          !!hopDong.giuong &&
          !!hopDong.nguoiThue,
      );

    const hoaDonsMoi: HoaDon[] = [];

    let daBoQua = 0;

    for (const hopDong of hopDongCoNguoiThue) {
      /*
       * Kiểm tra hóa đơn tháng hiện tại.
       */
      const daCoHoaDon =
        (hopDong.hoaDons ?? []).some(
          (hoaDon) => {
            if (!hoaDon.thangThanhToan) {
              return false;
            }

            return (
              this.normalizeMonth(
                hoaDon.thangThanhToan,
              ) === monthKey
            );
          },
        );

      if (daCoHoaDon) {
        daBoQua++;
        continue;
      }

      /*
       * Mã hóa đơn.
       *
       * Dạng:
       * HD-202608-<8 ký tự>
       */
      const maHoaDon =
  await this.generateMaHoaDon(
    hopDong.maHopDong,
    monthKey,
    hoaDonsMoi,
  );

      /*
       * Lấy tiền phòng từ giường.
       *
       * Nếu giường không có giá thì lấy
       * tiền thuê trong hợp đồng.
       */
      const tienPhong = Number(
        hopDong.giuong.giaGiuong ??
          hopDong.tienThue ??
          0,
      );

      const tienDien = Number(
        hopDong.tienDien ?? 0,
      );

      const tienNuoc = Number(
        hopDong.tienNuoc ?? 0,
      );

      const tienDichVuKhac = Number(
        hopDong.tienDichVu ?? 0,
      );

      const tongTien =
        tienPhong +
        tienDien +
        tienNuoc +
        tienDichVuKhac;

      const hoaDon =
        this.repository.create({
          maHoaDon,
          thangThanhToan:
            this.toDate(monthKey),
          tienPhong,
          tienDien,
          tienNuoc,
          tienDichVuKhac,
          tongTien,
          trangThai:
            'chua_thanh_toan',
          ngayNop: null,
          hopDong,
        });

      hoaDonsMoi.push(hoaDon);
    }

    if (hoaDonsMoi.length > 0) {
      await this.repository.save(
        hoaDonsMoi,
      );
    }

    return {
      message:
        hoaDonsMoi.length > 0
          ? 'Tạo hóa đơn thành công'
          : 'Không có giường nào cần tạo hóa đơn',
      thangThanhToan:
        `${monthKey}-01`,
      daTao: hoaDonsMoi.length,
      daBoQua,
      tongSoHopDong:
        hopDongCoNguoiThue.length,
      hoaDons: hoaDonsMoi.map(
        (hoaDon) => ({
          id: hoaDon.id,
          maHoaDon:
            hoaDon.maHoaDon,
          thangThanhToan:
            hoaDon.thangThanhToan,
          tongTien:
            hoaDon.tongTien,
          hopDongId:
            hoaDon.hopDong?.id,
          giuongId:
            hoaDon.hopDong?.giuong?.id,
          maGiuong:
            hoaDon.hopDong?.giuong
              ?.maGiuong,
          nguoiThue:
            hoaDon.hopDong?.nguoiThue
              ?.hoTen,
        }),
      ),
    };
  }

  /**
   * YYYY-MM hoặc Date -> YYYY-MM
   */
  private normalizeMonth(
    value: string | Date,
  ): string | null {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return null;
      }

      return `${value.getFullYear()}-${String(
        value.getMonth() + 1,
      ).padStart(2, '0')}`;
    }

    const match = String(value).match(
      /^(\d{4})-(\d{2})/,
    );

    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);

    if (
      month < 1 ||
      month > 12
    ) {
      return null;
    }

    return `${year}-${String(
      month,
    ).padStart(2, '0')}`;
  }

  /**
   * Chuyển YYYY-MM thành Date
   */
  private toDate(
    monthKey: string,
  ): Date {
    return new Date(
      `${monthKey}-01T00:00:00`,
    );
  }

  /**
   * Sinh mã hóa đơn duy nhất.
   */
private async generateMaHoaDon(
  maHopDong: string,
  monthKey: string,
  hoaDonsMoi: HoaDon[] = [],
): Promise<string> {
  const [year, month] = monthKey.split('-');

  const thangNam = `${Number(month)}/${year}`;

  // Lấy các hóa đơn đã tồn tại của hợp đồng
  const hoaDonsDaCo =
    await this.repository.find({
      where: {
        hopDong: {
          maHopDong,
        },
      },
    });

  // Lấy các số thứ tự đã sử dụng
  const soThuTuDaCo = [
    ...hoaDonsDaCo,
    ...hoaDonsMoi,
  ]
    .map((hoaDon) => {
      const match = hoaDon.maHoaDon?.match(
        new RegExp(
          `^${maHopDong}_TH${thangNam.replace(
            '/',
            '\\/',
          )}_(\\d+)$`,
        ),
      );

      return match
        ? Number(match[1])
        : null;
    })
    .filter(
      (value): value is number =>
        value !== null,
    );

  let soThuTu = 1;

  if (soThuTuDaCo.length > 0) {
    soThuTu =
      Math.max(...soThuTuDaCo) + 1;
  }

  let maHoaDon = '';

  while (true) {
    maHoaDon =
      `${maHopDong}_TH${thangNam}_${String(
        soThuTu,
      ).padStart(2, '0')}`;

    const exists =
      await this.repository.exists({
        where: {
          maHoaDon,
        },
      });

    if (!exists) {
      return maHoaDon;
    }

    soThuTu++;
  }
}

  async remove(id: string) {
    const result =
      await this.repository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(
        'Không tìm thấy hóa đơn để xóa',
      );
    }

    return {
      message:
        'Xóa hóa đơn thành công',
      id,
    };
  }
}