import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { HoaDon } from '../../entities/hoa-don.entity';
import { HopDong } from '../../entities/hop-dong.entity';
import { Tenant } from '../../entities/tenant.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class HoaDonService {
  constructor(
    @InjectRepository(HoaDon)
    private readonly repository: Repository<HoaDon>,

    @InjectRepository(HopDong)
    private readonly hopDongRepository: Repository<HopDong>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    private readonly emailService: EmailService,
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

  async create(payload: Partial<HoaDon>, tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException(
        'Không xác định được tenant của tài khoản.',
      );
    }

    const tenant = await this.tenantRepository.findOne({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Không tìm thấy tenant.');
    }

    const hopDongId =
      payload.hopDong?.id ??
      (
        payload as Partial<HoaDon> & {
          hopDongId?: string;
        }
      ).hopDongId;

    if (!hopDongId) {
      throw new BadRequestException('Vui lòng chọn hợp đồng cho hóa đơn.');
    }

    const hopDong = await this.hopDongRepository.findOne({
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

    const tienPhong = Number(payload.tienPhong ?? 0);

    const tienDien = Number(payload.tienDien ?? 0);

    const tienNuoc = Number(payload.tienNuoc ?? 0);

    const tienDichVuKhac = Number(payload.tienDichVuKhac ?? 0);

    const tongTien = tienPhong + tienDien + tienNuoc + tienDichVuKhac;

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
    hoaDon.tienDichVuKhac = tienDichVuKhac;

    hoaDon.tongTien = tongTien;

    if (hoaDon.trangThai === 'da_thanh_toan') {
      hoaDon.ngayNop = new Date();
    } else {
      hoaDon.ngayNop = null;
    }

    const savedHoaDon = await this.repository.save(hoaDon);

    const result = await this.findOne(savedHoaDon.id, tenantId);

    if (!result) {
      throw new NotFoundException('Không thể tải lại hóa đơn vừa tạo.');
    }

    return result;
  }

  async update(id: string, payload: Partial<HoaDon>, tenantId: string) {
    const hoaDon = await this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
    });

    if (!hoaDon) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    const tienPhong = Number(payload.tienPhong ?? hoaDon.tienPhong ?? 0);

    const tienDien = Number(payload.tienDien ?? hoaDon.tienDien ?? 0);

    const tienNuoc = Number(payload.tienNuoc ?? hoaDon.tienNuoc ?? 0);

    const tienDichVuKhac = Number(
      payload.tienDichVuKhac ?? hoaDon.tienDichVuKhac ?? 0,
    );

    payload.tienPhong = tienPhong;
    payload.tienDien = tienDien;
    payload.tienNuoc = tienNuoc;
    payload.tienDichVuKhac = tienDichVuKhac;

    payload.tongTien = tienPhong + tienDien + tienNuoc + tienDichVuKhac;

    if (
      payload.trangThai === 'da_thanh_toan' &&
      hoaDon.trangThai !== 'da_thanh_toan'
    ) {
      payload.ngayNop = new Date();
    }

    if (payload.trangThai === 'chua_thanh_toan') {
      payload.ngayNop = null;
    }

    Object.assign(hoaDon, {
      tienPhong,
      tienDien,
      tienNuoc,
      tienDichVuKhac,
      tongTien: tienPhong + tienDien + tienNuoc + tienDichVuKhac,
    });

    if (payload.trangThai !== undefined) {
      hoaDon.trangThai = payload.trangThai;
    }

    if (payload.ghiChu !== undefined) {
      hoaDon.ghiChu = payload.ghiChu;
    }

    // Khi chuyển sang "Đã thanh toán"
    // -> tự động ghi ngày nộp là ngày hiện tại.
    if (hoaDon.trangThai === 'da_thanh_toan' && hoaDon.ngayNop == null) {
      hoaDon.ngayNop = new Date();
    }

    // Khi chuyển ngược về "Chưa thanh toán"
    // -> xóa ngày nộp.
    if (hoaDon.trangThai === 'chua_thanh_toan') {
      hoaDon.ngayNop = null;
    }

    await this.repository.save(hoaDon);

    return this.findOne(id, tenantId);
  }

  /**
   * Tạo hóa đơn cho tất cả các giường
   * đang có người thuê và chưa có hóa đơn
   * trong tháng được chọn.
   */
  async createForAllBeds(thangThanhToan: string, tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException(
        'Không xác định được tenant của tài khoản.',
      );
    }

    if (!thangThanhToan) {
      throw new BadRequestException('Vui lòng chọn tháng thanh toán');
    }

    const tenant = await this.tenantRepository.findOne({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Không tìm thấy tenant.');
    }

    const monthKey = this.normalizeMonth(thangThanhToan);

    if (!monthKey) {
      throw new BadRequestException('Tháng thanh toán không hợp lệ');
    }

    const hopDongs = await this.hopDongRepository.find({
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

    const hopDongCoNguoiThue = hopDongs.filter(
      (hopDong) => !!hopDong.giuong && !!hopDong.nguoiThue,
    );

    const hoaDonsMoi: HoaDon[] = [];

    let daBoQua = 0;

    for (const hopDong of hopDongCoNguoiThue) {
      const daCoHoaDon = (hopDong.hoaDons ?? []).some((hoaDon) => {
        if (!hoaDon.thangThanhToan) {
          return false;
        }

        return this.normalizeMonth(hoaDon.thangThanhToan) === monthKey;
      });

      if (daCoHoaDon) {
        daBoQua++;
        continue;
      }

      const maHoaDon = await this.generateMaHoaDon(
        hopDong.maHopDong,
        monthKey,
        hoaDonsMoi,
        tenantId,
      );

      const tienPhong = Number(
        hopDong.giuong.giaGiuong ?? hopDong.tienThue ?? 0,
      );

      const tienDien = Number(hopDong.tienDien ?? 0);

      const tienNuoc = Number(hopDong.tienNuoc ?? 0);

      const tienDichVuKhac = Number(hopDong.tienDichVu ?? 0);

      const tongTien = tienPhong + tienDien + tienNuoc + tienDichVuKhac;

      const hoaDon = new HoaDon();

      hoaDon.maHoaDon = maHoaDon;

      hoaDon.thangThanhToan = this.toDate(monthKey);

      hoaDon.tienPhong = tienPhong;

      hoaDon.tienDien = tienDien;

      hoaDon.tienNuoc = tienNuoc;

      hoaDon.tienDichVuKhac = tienDichVuKhac;

      hoaDon.tongTien = tongTien;

      hoaDon.trangThai = 'chua_thanh_toan';

      hoaDon.ngayNop = null;

      hoaDon.hopDong = hopDong;

      // QUAN TRỌNG
      hoaDon.tenant = tenant;

      hoaDonsMoi.push(hoaDon);
    }

    if (hoaDonsMoi.length > 0) {
      await this.repository.save(hoaDonsMoi);
    }

    return {
      message:
        hoaDonsMoi.length > 0
          ? 'Tạo hóa đơn thành công'
          : 'Không có giường nào cần tạo hóa đơn',

      thangThanhToan: `${monthKey}-01`,

      daTao: hoaDonsMoi.length,

      daBoQua,

      tongSoHopDong: hopDongCoNguoiThue.length,

      hoaDons: hoaDonsMoi.map((hoaDon) => ({
        id: hoaDon.id,

        maHoaDon: hoaDon.maHoaDon,

        thangThanhToan: hoaDon.thangThanhToan,

        tongTien: hoaDon.tongTien,

        hopDongId: hoaDon.hopDong?.id,

        giuongId: hoaDon.hopDong?.giuong?.id,

        maGiuong: hoaDon.hopDong?.giuong?.maGiuong,

        nguoiThue: hoaDon.hopDong?.nguoiThue?.hoTen,
      })),
    };
  }

  /**
   * YYYY-MM hoặc Date -> YYYY-MM
   */
  private normalizeMonth(value: string | Date): string | null {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return null;
      }

      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
        2,
        '0',
      )}`;
    }

    const match = String(value).match(/^(\d{4})-(\d{2})/);

    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);

    if (month < 1 || month > 12) {
      return null;
    }

    return `${year}-${String(month).padStart(2, '0')}`;
  }

  /**
   * Chuyển YYYY-MM thành Date
   */
  private toDate(monthKey: string): Date {
    return new Date(`${monthKey}-01T00:00:00`);
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

    const maHopDongCoSo = maHopDong.replace(/_TH\d{1,2}\/\d{4}(?:_\d+)?$/, '');

    const prefix = `${maHopDongCoSo}_TH${thangNam}`;

    // Lấy các hóa đơn đã tồn tại
    const hoaDonsDaCo = await this.repository.find({
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
    const tatCaHoaDons = [...hoaDonsDaCo, ...hoaDonsMoi];

    const soThuTuDaCo = tatCaHoaDons
      .map((hoaDon) => {
        const match = hoaDon.maHoaDon?.match(
          new RegExp(`^${prefix.replace('/', '\\/')}_(\\d+)$`),
        );

        return match ? Number(match[1]) : null;
      })
      .filter((value): value is number => value !== null);

    let soThuTu = 1;

    if (soThuTuDaCo.length > 0) {
      soThuTu = Math.max(...soThuTuDaCo) + 1;
    }

    while (true) {
      const maHoaDon = `${prefix}_${String(soThuTu).padStart(2, '0')}`;

      const exists = await this.repository.exists({
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

  async remove(id: string, tenantId: string) {
    const hoaDon = await this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
    });

    if (!hoaDon) {
      throw new NotFoundException('Không tìm thấy hóa đơn để xóa');
    }

    await this.repository.remove(hoaDon);

    return {
      message: 'Xóa hóa đơn thành công',
      id,
    };
  }

  async sendInvoiceEmail(
    id: string,
    tenantId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!tenantId) {
      throw new BadRequestException('Không xác định được tenant.');
    }

    const hoaDon = await this.repository.findOne({
      where: {
        id,
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

    if (!hoaDon) {
      throw new NotFoundException('Không tìm thấy hóa đơn.');
    }

    const nguoiThue = hoaDon.hopDong?.nguoiThue;

    if (!nguoiThue) {
      throw new NotFoundException('Không tìm thấy người thuê của hóa đơn.');
    }

    const emailNguoiThue = nguoiThue.email?.trim();

    if (!emailNguoiThue) {
      throw new BadRequestException('Người thuê chưa có email.');
    }

    const nhaTro = hoaDon.hopDong?.giuong?.phong?.nhaTro;

    const phong = hoaDon.hopDong?.giuong?.phong;

    const giuong = hoaDon.hopDong?.giuong;

    /*
     * ==============================
     * HÀM FORMAT
     * ==============================
     */

    const formatMoney = (value: number | string | null | undefined) => {
      return new Intl.NumberFormat('vi-VN').format(Number(value ?? 0));
    };

    const formatDate = (value: string | Date | null | undefined) => {
      if (!value) {
        return '';
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return '';
      }

      return date.toLocaleDateString('vi-VN');
    };

    /*
     * ==============================
     * THÁNG THANH TOÁN
     * ==============================
     */

    const thangThanhToan = hoaDon.thangThanhToan
      ? new Date(hoaDon.thangThanhToan)
      : null;

    const monthText = thangThanhToan
      ? `Tháng ${thangThanhToan.getMonth() + 1}/${thangThanhToan.getFullYear()}`
      : '';

    /*
     * ==============================
     * KỲ TÍNH
     * ==============================
     */

    let kyTinh = '';

    if (thangThanhToan) {
      const year = thangThanhToan.getFullYear();
      const month = thangThanhToan.getMonth();

      const start = new Date(year, month, 1);

      const end = new Date(year, month + 1, 0);

      kyTinh = `${formatDate(start)} – ${formatDate(end)}`;
    }

    /*
     * ==============================
     * PHÒNG
     * ==============================
     *
     * Ví dụ:
     * CG_T102
     * -> Tầng 1
     * -> Phòng 2
     */

    let phongSo = '';

    const maPhong = phong?.maPhong;

    if (maPhong) {
      const match = maPhong.match(/_T\d+(\d{2})$/);

      if (match?.[1]) {
        phongSo = String(Number(match[1]));
      } else {
        phongSo = maPhong;
      }
    }

    /*
     * ==============================
     * HẠN NỘP
     * ==============================
     *
     * Quy ước hiện tại:
     * ngày 05 của tháng tiếp theo.
     */

    let hanNop = '';

    if (thangThanhToan) {
      const nextMonth = new Date(
        thangThanhToan.getFullYear(),
        thangThanhToan.getMonth() + 1,
        5,
      );

      hanNop = formatDate(nextMonth);
    }

    /*
     * ==============================
     * TRẠNG THÁI
     * ==============================
     */

    const trangThai =
      hoaDon.trangThai === 'da_thanh_toan'
        ? 'Đã thanh toán'
        : 'Chưa thanh toán';

    /*
     * ==============================
     * EMAIL HTML
     * ==============================
     */

    const html = `
  <div style="
    font-family: Arial, Helvetica, sans-serif;
    max-width: 760px;
    margin: 0 auto;
    color: #172033;
    background: #ffffff;
  ">

    <!-- HEADER -->

    <div style="
      background: #2345b5;
      color: white;
      padding: 22px;
      text-align: center;
      border-radius: 12px 12px 0 0;
    ">

      <h2 style="
        margin: 0;
        font-size: 22px;
      ">
        HÓA ĐƠN TIỀN PHÒNG
      </h2>

      <div style="
        margin-top: 6px;
        font-size: 14px;
      ">
        ${monthText}
      </div>

    </div>


    <!-- CONTENT -->

    <div style="
      border: 1px solid #e5e7eb;
      border-top: none;
      padding: 24px;
    ">


      <!-- THÔNG TIN CHUNG -->

      <h3 style="
        margin: 0 0 16px;
        color: #334155;
        font-size: 16px;
      ">
        Thông tin chung
      </h3>

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          border-collapse: collapse;
        "
      >

        <tr>

          <td
            width="50%"
            style="
              padding: 8px 12px 12px 0;
              vertical-align: top;
            "
          >

            <div style="
              color: #64748b;
              font-size: 13px;
              margin-bottom: 4px;
            ">
              Nhà trọ
            </div>

            <strong style="
              font-size: 14px;
            ">
              ${nhaTro?.tenNhaTro ?? ''}
            </strong>

            ${
              nhaTro?.diaChi
                ? `
                  <div style="
                    margin-top: 3px;
                    color: #475569;
                    font-size: 13px;
                  ">
                    ${nhaTro.diaChi}
                  </div>
                `
                : ''
            }

          </td>


          <td
            width="50%"
            style="
              padding: 8px 0 12px 12px;
              vertical-align: top;
            "
          >

            <div style="
              color: #64748b;
              font-size: 13px;
              margin-bottom: 4px;
            ">
              Tầng
            </div>

            <strong style="
              font-size: 14px;
            ">
              ${phong?.tangSo ? `Tầng ${phong.tangSo}` : ''}
            </strong>

          </td>

        </tr>


        <tr>

          <td
            style="
              padding: 8px 12px 12px 0;
              vertical-align: top;
            "
          >

            <div style="
              color: #64748b;
              font-size: 13px;
              margin-bottom: 4px;
            ">
              Phòng
            </div>

            <strong style="
              font-size: 14px;
            ">
              ${phongSo ? `Phòng ${phongSo}` : ''}
            </strong>

          </td>


          <td
            style="
              padding: 8px 0 12px 12px;
              vertical-align: top;
            "
          >

            <div style="
              color: #64748b;
              font-size: 13px;
              margin-bottom: 4px;
            ">
              Giường
            </div>

            <strong style="
              font-size: 14px;
            ">
              ${giuong?.giuongSo ? `Giường ${giuong.giuongSo}` : ''}
            </strong>

          </td>

        </tr>


        <tr>

          <td
            style="
              padding: 8px 12px 8px 0;
              vertical-align: top;
            "
          >

            <div style="
              color: #64748b;
              font-size: 13px;
              margin-bottom: 4px;
            ">
              Khách thuê
            </div>

            <strong style="
              font-size: 14px;
            ">
              ${nguoiThue.hoTen ?? ''}
            </strong>

          </td>


          <td
            style="
              padding: 8px 0 8px 12px;
              vertical-align: top;
            "
          >

            <div style="
              color: #64748b;
              font-size: 13px;
              margin-bottom: 4px;
            ">
              Kỳ tính
            </div>

            <strong style="
              font-size: 14px;
            ">
              ${kyTinh}
            </strong>

          </td>

        </tr>

      </table>


      <!-- CHI TIẾT HÓA ĐƠN -->

      <div style="
        margin-top: 20px;
        border-top: 1px solid #e5e7eb;
        padding-top: 18px;
      ">

        <h3 style="
          margin: 0 0 12px;
          color: #334155;
          font-size: 16px;
        ">
          Chi tiết hóa đơn
        </h3>


        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            border-collapse: collapse;
          "
        >

          <thead>

            <tr>

              <th
                align="left"
                style="
                  padding: 10px 0;
                  color: #64748b;
                  font-size: 13px;
                  border-bottom: 1px solid #e5e7eb;
                "
              >
                Khoản mục
              </th>


              <th
                align="center"
                style="
                  padding: 10px;
                  color: #64748b;
                  font-size: 13px;
                  border-bottom: 1px solid #e5e7eb;
                "
              >
                Chi tiết
              </th>


              <th
                align="right"
                style="
                  padding: 10px 0;
                  color: #64748b;
                  font-size: 13px;
                  border-bottom: 1px solid #e5e7eb;
                "
              >
                Thành tiền
              </th>

            </tr>

          </thead>


          <tbody>

            <tr>

              <td style="
                padding: 13px 0;
                border-bottom: 1px solid #f1f5f9;
              ">
                <strong>
                  Tiền thuê phòng
                </strong>
              </td>

              <td
                align="center"
                style="
                  padding: 13px 10px;
                  border-bottom: 1px solid #f1f5f9;
                  font-size: 13px;
                "
              >
                1 tháng
              </td>

              <td
                align="right"
                style="
                  padding: 13px 0;
                  border-bottom: 1px solid #f1f5f9;
                "
              >
                ${formatMoney(hoaDon.tienPhong)} đ
              </td>

            </tr>


            <tr>

              <td style="
                padding: 13px 0;
                border-bottom: 1px solid #f1f5f9;
              ">
                <strong>
                  Tiền điện
                </strong>

                ${
                  hoaDon.ghiChu
                    ? `
                      <div style="
                        margin-top: 4px;
                        color: #94a3b8;
                        font-size: 12px;
                      ">
                        ${hoaDon.ghiChu}
                      </div>
                    `
                    : ''
                }

              </td>

              <td
                align="center"
                style="
                  padding: 13px 10px;
                  border-bottom: 1px solid #f1f5f9;
                  font-size: 13px;
                "
              >
                Tiền điện
              </td>

              <td
                align="right"
                style="
                  padding: 13px 0;
                  border-bottom: 1px solid #f1f5f9;
                "
              >
                ${formatMoney(hoaDon.tienDien)} đ
              </td>

            </tr>


            <tr>

              <td style="
                padding: 13px 0;
                border-bottom: 1px solid #f1f5f9;
              ">
                <strong>
                  Tiền nước
                </strong>
              </td>

              <td
                align="center"
                style="
                  padding: 13px 10px;
                  border-bottom: 1px solid #f1f5f9;
                  font-size: 13px;
                "
              >
                Tiền nước
              </td>

              <td
                align="right"
                style="
                  padding: 13px 0;
                  border-bottom: 1px solid #f1f5f9;
                "
              >
                ${formatMoney(hoaDon.tienNuoc)} đ
              </td>

            </tr>


            <tr>

              <td style="
                padding: 13px 0;
              ">
                <strong>
                  Phí dịch vụ khác
                </strong>
              </td>

              <td
                align="center"
                style="
                  padding: 13px 10px;
                  font-size: 13px;
                "
              >
                Cố định
              </td>

              <td
                align="right"
                style="
                  padding: 13px 0;
                "
              >
                ${formatMoney(hoaDon.tienDichVuKhac)} đ
              </td>

            </tr>

          </tbody>

        </table>


        <!-- TỔNG -->

        <div style="
          border-top: 2px solid #2345b5;
          margin-top: 8px;
          padding-top: 15px;
        ">

          <table width="100%">

            <tr>

              <td>
                <strong>
                  TỔNG CỘNG
                </strong>
              </td>

              <td align="right">

                <strong style="
                  color: #2345b5;
                  font-size: 18px;
                ">
                  ${formatMoney(hoaDon.tongTien)} đ
                </strong>

              </td>

            </tr>

          </table>

        </div>

      </div>


      <!-- THÔNG TIN THANH TOÁN -->

      <div style="
        margin-top: 20px;
        padding: 18px;
        background: #f8fafc;
        border-radius: 10px;
      ">

        <h3 style="
          margin: 0 0 8px;
          color: #334155;
          font-size: 16px;
        ">
          Thông tin thanh toán
        </h3>


        <div style="
          line-height: 1.9;
          font-size: 13px;
        ">

          <div>
            🏦
            Ngân hàng:
            <strong>
              Viettin bank
            </strong>
          </div>


          <div>
            💳
            Số tài khoản:
            <strong>
              09453242344
            </strong>
          </div>


          <div>
            👤
            Chủ tài khoản:
            <strong>
              Nguyễn Thị Chi
            </strong>
          </div>


          <div>
            📌
            Nội dung:
            <strong>
              ${hoaDon.maHoaDon}
              -
              ${nguoiThue.hoTen ?? 'Tên khách'}
            </strong>
          </div>


          <div>
            📅
            Hạn nộp:
            <strong style="
              color: #dc2626;
            ">
              ${hanNop}
            </strong>
          </div>


          <div style="
            margin-top: 6px;
          ">
            Trạng thái:
            <strong>
              ${trangThai}
            </strong>
          </div>


          ${
            hoaDon.ngayNop
              ? `
                <div>
                  Ngày thanh toán:
                  <strong>
                    ${formatDate(hoaDon.ngayNop)}
                  </strong>
                </div>
              `
              : ''
          }

        </div>

      </div>


      <!-- QR -->

      <div style="
        margin-top: 18px;
        text-align: center;
        padding: 16px;
        border-top: 1px solid #e5e7eb;
      ">

        <div style="
          margin-bottom: 8px;
          color: #475569;
          font-size: 13px;
        ">
          Quét mã để thanh toán
        </div>

        <div style="
          font-size: 12px;
          color: #94a3b8;
        ">
          QR thanh toán là ảnh được đính kèm ở trong email này.
        </div>

      </div>

    </div>


    <!-- FOOTER -->

    <div style="
      padding: 18px;
      text-align: center;
      color: #64748b;
      font-size: 13px;
    ">
      Trân trọng.
    </div>

  </div>
  `;

    let qrBuffer: Buffer | undefined;

    const qrPath = path.resolve(process.cwd(), 'assets', 'images', 'QR.png');

    try {
      qrBuffer = await fs.promises.readFile(qrPath);
    } catch (error) {
      console.warn(`Không tìm thấy QR: ${qrPath}`);
    }

    await this.emailService.sendInvoiceEmail(
      [emailNguoiThue],
      `Hóa đơn tiền phòng - ${hoaDon.maHoaDon}`,
      html,
      nguoiThue.hoTen ?? 'Người thuê',
      qrBuffer,
    );

    return {
      success: true,
      message: `Hóa đơn đã được gửi đến ${emailNguoiThue}.`,
    };
  }
}
