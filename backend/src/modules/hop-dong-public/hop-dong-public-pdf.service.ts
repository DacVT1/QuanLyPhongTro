import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

interface ContractPdfData {
  hoTen: string;
  cccd: string;
  sdt: string;
  email: string;
  ngaySinh: string;
  diaChi: string;
  bienSoXe: string;

  tenNhaTro: string;
  tangSo: number | string;
  maPhong: string;
  giuongSo: number | string;

  tienDatCoc: number;
  tienThue: number;

  ngayBatDau: string;
  ngayKetThuc: string;
}

@Injectable()
export class HopDongPublicPdfService {
  async generate(data: ContractPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      // Nếu dùng font Unicode:
      // doc.font('backend/assets/fonts/DejaVuSans.ttf');

      doc.fontSize(16).text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', {
        align: 'center',
      });

      doc.moveDown();

      doc.fontSize(18).text('HỢP ĐỒNG THUÊ TRỌ', {
        align: 'center',
      });

      doc.moveDown(2);

      doc.fontSize(12);

      doc.text(`BÊN B: ${data.hoTen}`);

      doc.text(`CCCD: ${data.cccd}`);

      doc.text(`Số điện thoại: ${data.sdt}`);

      doc.text(`Email: ${data.email}`);

      doc.text(`Ngày sinh: ${data.ngaySinh}`);

      doc.text(`Địa chỉ: ${data.diaChi}`);

      doc.text(`Biển số xe: ${data.bienSoXe}`);

      doc.moveDown();

      doc.text('THÔNG TIN PHÒNG THUÊ');

      doc.text(`Nhà trọ: ${data.tenNhaTro}`);

      doc.text(`Tầng: ${data.tangSo}`);

      doc.text(`Phòng: ${data.maPhong}`);

      doc.text(`Giường: ${data.giuongSo}`);

      doc.moveDown();

      doc.text('THÔNG TIN THANH TOÁN');

      doc.text(
        `Tiền thuê: ${data.tienThue.toLocaleString('en-US')} đồng/tháng`,
      );

      doc.text(`Tiền đặt cọc: ${data.tienDatCoc.toLocaleString('en-US')} đồng`);

      doc.moveDown();

      doc.text('THỜI HẠN HỢP ĐỒNG');

      doc.text(`Ngày bắt đầu: ${data.ngayBatDau}`);

      doc.text(`Ngày kết thúc: ${data.ngayKetThuc}`);

      doc.moveDown(2);

      doc.text('Hai bên xác nhận đồng ý với toàn bộ nội dung hợp đồng.');

      doc.end();
    });
  }
}
