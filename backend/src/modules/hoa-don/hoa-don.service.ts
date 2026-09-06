import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HoaDon } from '../../entities/hoa-don.entity';
import { HopDong } from '../../entities/hop-dong.entity';
import { Tenant } from '../../entities/tenant.entity';

@Injectable()
export class HoaDonService {
  constructor(
    @InjectRepository(HoaDon)
    private readonly repository: Repository<HoaDon>,

    @InjectRepository(HopDong)
    private readonly hopDongRepository: Repository<HopDong>,

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

  async findOne(id: string, tenantId: string) {
    return this.repository.findOne({
      where: { id, tenant: { id: tenantId } },
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

  async create(
  payload: Partial<HoaDon>,
  tenantId: string,
) {
  if (!tenantId) {
    throw new BadRequestException(
      'Không xác định được tenant của tài khoản.',
    );
  }

  const tenant =
    await this.tenantRepository.findOne({
      where: {
        id: tenantId,
      },
    });

  if (!tenant) {
    throw new NotFoundException(
      'Không tìm thấy tenant.',
    );
  }

  const hopDongId =
    payload.hopDong?.id ??
    (payload as Partial<HoaDon> & {
      hopDongId?: string;
    }).hopDongId;

  if (!hopDongId) {
    throw new BadRequestException(
      'Vui lòng chọn hợp đồng cho hóa đơn.',
    );
  }

  const hopDong =
    await this.hopDongRepository.findOne({
      where: {
        id: hopDongId,
        tenant: {
          id: tenantId,
        },
      },
    });

  if (!hopDong) {
    throw new NotFoundException(
      'Không tìm thấy hợp đồng thuộc tenant hiện tại.',
    );
  }

  const tienPhong =
    Number(payload.tienPhong ?? 0);

  const tienDien =
    Number(payload.tienDien ?? 0);

  const tienNuoc =
    Number(payload.tienNuoc ?? 0);

  const tienDichVuKhac =
    Number(payload.tienDichVuKhac ?? 0);

  const tongTien =
    tienPhong +
    tienDien +
    tienNuoc +
    tienDichVuKhac;

  const hoaDon = new HoaDon();

  Object.assign(hoaDon, payload);

  // Quan trọng:
  // tenant lấy từ JWT, không lấy từ frontend
  hoaDon.tenant = tenant;

  // Hợp đồng cũng phải thuộc tenant hiện tại
  hoaDon.hopDong = hopDong;

  hoaDon.tienPhong = tienPhong;
  hoaDon.tienDien = tienDien;
  hoaDon.tienNuoc = tienNuoc;
  hoaDon.tienDichVuKhac =
    tienDichVuKhac;

  hoaDon.tongTien = tongTien;

  if (
    hoaDon.trangThai ===
    'da_thanh_toan'
  ) {
    hoaDon.ngayNop = new Date();
  } else {
    hoaDon.ngayNop = null;
  }

  const savedHoaDon =
    await this.repository.save(
      hoaDon,
    );

  const result =
    await this.findOne(
      savedHoaDon.id,
      tenantId,
    );

  if (!result) {
    throw new NotFoundException(
      'Không thể tải lại hóa đơn vừa tạo.',
    );
  }

  return result;
}

  async update(
    id: string,
    payload: Partial<HoaDon>,
    tenantId: string,
  ) {
    const hoaDon = await this.repository.findOne({
      where: {
      id,
      tenant: {
        id: tenantId,
      },
    },
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

    return this.findOne(id, tenantId);
  }

  /**
   * Tạo hóa đơn cho tất cả các giường
   * đang có người thuê và chưa có hóa đơn
   * trong tháng được chọn.
   */
  async createForAllBeds(
  thangThanhToan: string,
  tenantId: string,
) {
  if (!tenantId) {
    throw new BadRequestException(
      'Không xác định được tenant của tài khoản.',
    );
  }

  if (!thangThanhToan) {
    throw new BadRequestException(
      'Vui lòng chọn tháng thanh toán',
    );
  }

  const tenant =
    await this.tenantRepository.findOne({
      where: {
        id: tenantId,
      },
    });

  if (!tenant) {
    throw new NotFoundException(
      'Không tìm thấy tenant.',
    );
  }

  const monthKey =
    this.normalizeMonth(thangThanhToan);

  if (!monthKey) {
    throw new BadRequestException(
      'Tháng thanh toán không hợp lệ',
    );
  }

  const hopDongs =
    await this.hopDongRepository.find({
      where: {
        trangThai: 'active',
        tenant: {
          id: tenantId,
        },
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

  const hopDongCoNguoiThue =
    hopDongs.filter(
      (hopDong) =>
        !!hopDong.giuong &&
        !!hopDong.nguoiThue,
    );

  const hoaDonsMoi: HoaDon[] = [];

  let daBoQua = 0;

  for (
    const hopDong of hopDongCoNguoiThue
  ) {
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

    const maHoaDon =
      await this.generateMaHoaDon(
        hopDong.maHopDong,
        monthKey,
        hoaDonsMoi,
        tenantId,
      );

    const tienPhong =
      Number(
        hopDong.giuong.giaGiuong ??
          hopDong.tienThue ??
          0,
      );

    const tienDien =
      Number(
        hopDong.tienDien ?? 0,
      );

    const tienNuoc =
      Number(
        hopDong.tienNuoc ?? 0,
      );

    const tienDichVuKhac =
      Number(
        hopDong.tienDichVu ?? 0,
      );

    const tongTien =
      tienPhong +
      tienDien +
      tienNuoc +
      tienDichVuKhac;

    const hoaDon = new HoaDon();

    hoaDon.maHoaDon =
      maHoaDon;

    hoaDon.thangThanhToan =
      this.toDate(monthKey);

    hoaDon.tienPhong =
      tienPhong;

    hoaDon.tienDien =
      tienDien;

    hoaDon.tienNuoc =
      tienNuoc;

    hoaDon.tienDichVuKhac =
      tienDichVuKhac;

    hoaDon.tongTien =
      tongTien;

    hoaDon.trangThai =
      'chua_thanh_toan';

    hoaDon.ngayNop =
      null;

    hoaDon.hopDong =
      hopDong;

    // QUAN TRỌNG
    hoaDon.tenant =
      tenant;

    hoaDonsMoi.push(
      hoaDon,
    );
  }

  if (
    hoaDonsMoi.length > 0
  ) {
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

    daTao:
      hoaDonsMoi.length,

    daBoQua,

    tongSoHopDong:
      hopDongCoNguoiThue.length,

    hoaDons:
      hoaDonsMoi.map(
        (hoaDon) => ({
          id:
            hoaDon.id,

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
  tenantId: string,
): Promise<string> {
  const [year, month] = monthKey.split('-');

  const thangNam = `${Number(month)}/${year}`;

  // Mã hợp đồng:
  // CG_T1_G1
  //
  // Mã hóa đơn:
  // CG_T1_G1_TH8/2026_01
  //
  // Không được lấy maHopDong đã có _TH8/2026
  // rồi nối thêm _TH8/2026 lần nữa.

  const maHopDongCoSo =
  maHopDong.replace(
    /_TH\d{1,2}\/\d{4}(?:_\d+)?$/,
    '',
  );

  const prefix =
    `${maHopDongCoSo}_TH${thangNam}`;

  // Lấy các hóa đơn đã tồn tại
  const hoaDonsDaCo =
  await this.repository.find({
    where: {
      tenant: {
        id: tenantId,
      },
      hopDong: {
        maHopDong,
      },
    },
  });

  
  // Lấy các hóa đơn vừa tạo trong
  // cùng request.
  const tatCaHoaDons = [
    ...hoaDonsDaCo,
    ...hoaDonsMoi,
  ];

  const soThuTuDaCo =
    tatCaHoaDons
      .map((hoaDon) => {
        const match =
          hoaDon.maHoaDon?.match(
            new RegExp(
              `^${prefix.replace(
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
      Math.max(
        ...soThuTuDaCo,
      ) + 1;
  }

  while (true) {
    const maHoaDon =
      `${prefix}_${String(
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

  async remove(
  id: string,
  tenantId: string,
) {
  const hoaDon =
    await this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
    });

  if (!hoaDon) {
    throw new NotFoundException(
      'Không tìm thấy hóa đơn để xóa',
    );
  }

  await this.repository.remove(
    hoaDon,
  );

  return {
    message:
      'Xóa hóa đơn thành công',
    id,
  };
}
}