import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as path from 'path';

interface ContractPdfData {
  // =========================
  // BÊN A
  // =========================
  benA: {
    hoTen: string;
    cccd: string;
    ngayCap: string;
    noiCap: string;
    sdt: string;
    nganHang: string;
    soTaiKhoan: string;
    chuTaiKhoan: string;
    diaChi: string;
  };

  // =========================
  // BÊN B
  // =========================
  hoTen: string;
  cccd: string;
  sdt: string;
  email: string;
  ngaySinh: string;
  diaChi: string;
  bienSoXe: string;
  cccdMatTruoc: Buffer;
  cccdMatSau: Buffer;

  // =========================
  // ĐIỀU 1
  // =========================
  tenNhaTro: string;
  diaChiNhaTro: string;
  tangSo: number | string;
  maPhong: string;
  giuongSo: number | string;

  // =========================
  // ĐIỀU 2
  // =========================
  tienDatCoc: number;
  tienThue: number;

  // =========================
  // ĐIỀU 3
  // =========================
  ngayBatDau: string;
  ngayKetThuc: string;

  // =========================
  // XÁC NHẬN
  // =========================
  benBDaKy: boolean;
  dongYHopDong: boolean;
}

@Injectable()
export class HopDongPublicPdfService {
  async generate(data: ContractPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const fontPath = path.resolve(
        process.cwd(),
        'assets',
        'fonts',
        'DejaVuSans.ttf',
      );

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: {
          Title: 'HỢP ĐỒNG THUÊ TRỌ',
          Author: data.benA.hoTen,
          Subject: 'Hợp đồng thuê trọ',
        },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      // Font Unicode hỗ trợ đầy đủ tiếng Việt
      doc.registerFont('Vietnamese', fontPath);
      doc.font('Vietnamese');

      // =====================================================
      // HELPER
      // =====================================================

      const formatMoney = (value: number) => {
        return Number(value || 0).toLocaleString('en-US');
      };

      const formatDate = (value: string) => {
        if (!value) {
          return '';
        }

        const date = new Date(`${value}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
          return value;
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
      };

      const addPageNumber = () => {
        const range = doc.bufferedPageRange();

        for (
          let pageIndex = range.start;
          pageIndex < range.start + range.count;
          pageIndex++
        ) {
          doc.switchToPage(pageIndex);

          doc
            .font('Vietnamese')
            .fontSize(8)
            .fillColor('#666666')
            .text(`Trang ${pageIndex + 1}/${range.count}`, 50, 810, {
              width: 495,
              align: 'center',
            });
        }

        doc.fillColor('#000000');
      };

      const addSectionTitle = (title: string) => {
        doc.font('Vietnamese').fontSize(12).text(title, {
          align: 'left',
        });

        doc.moveDown(0.5);

        doc.font('Vietnamese').fontSize(11);
      };

      const addParagraph = (
        text: string,
        options?: {
          indent?: number;
          align?: 'left' | 'center' | 'right' | 'justify';
        },
      ) => {
        doc
          .font('Vietnamese')
          .fontSize(11)
          .text(text, {
            width: 495,
            indent: options?.indent ?? 0,
            align: options?.align ?? 'justify',
            lineGap: 3,
          });

        doc.moveDown(0.4);
      };

      const addLabelValue = (
        label: string,
        value: string | number | undefined,
      ) => {
        doc
          .font('Vietnamese')
          .fontSize(11)
          .text(`${label}: ${value ?? ''}`, {
            width: 495,
            lineGap: 2,
          });

        doc.moveDown(0.2);
      };

      // =====================================================
      // HEADER
      // =====================================================

      doc
        .font('Vietnamese')
        .fontSize(13)
        .text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', {
          align: 'center',
        });

      doc.moveDown(0.2);

      doc.font('Vietnamese').fontSize(12).text('Độc lập - Tự do - Hạnh phúc', {
        align: 'center',
      });

      doc.moveDown(0.2);

      doc
        .font('Vietnamese')
        .fontSize(10)
        .text('----------------------------------------', {
          align: 'center',
        });

      doc.moveDown(1);

      doc.font('Vietnamese').fontSize(17).text('HỢP ĐỒNG THUÊ TRỌ', {
        align: 'center',
      });

      doc.moveDown(0.8);

      addParagraph(
        'Căn cứ Bộ luật Dân sự 2015 và Luật Nhà ở 2023, hai bên tự nguyện thỏa thuận các điều khoản của hợp đồng như sau:',
      );

      // =====================================================
      // BÊN A
      // =====================================================

      addSectionTitle('BÊN CHO THUÊ (BÊN A)');

      addLabelValue('Họ và tên', data.benA.hoTen);

      addLabelValue('CCCD số', data.benA.cccd);

      addLabelValue('Ngày cấp', data.benA.ngayCap);

      addLabelValue('Nơi cấp', data.benA.noiCap);

      addLabelValue('Điện thoại', data.benA.sdt);

      addLabelValue('Ngân hàng', data.benA.nganHang);

      addLabelValue('Số tài khoản', data.benA.soTaiKhoan);

      addLabelValue('Chủ tài khoản', data.benA.chuTaiKhoan);

      addLabelValue('Địa chỉ thường trú', data.benA.diaChi);

      doc.moveDown(0.5);

      // =====================================================
      // BÊN B
      // =====================================================

      addSectionTitle('BÊN THUÊ (BÊN B)');

      addLabelValue('Họ và tên', data.hoTen);

      addLabelValue('CCCD', data.cccd);

      addLabelValue('Số điện thoại', data.sdt);

      addLabelValue('Gmail', data.email);

      addLabelValue('Ngày sinh', formatDate(data.ngaySinh));

      addLabelValue('Địa chỉ', data.diaChi);

      addLabelValue('Biển số xe', data.bienSoXe);

      doc.moveDown(0.5);

      // =====================================================
      // CCCD BÊN B
      // =====================================================

      addSectionTitle('ẢNH CCCD BÊN THUÊ');

      const imageWidth = 220;
      const imageHeight = 140;
      const imageGap = 30;

      const imageStartX = 50;
      const imageStartY = doc.y;

      // Mặt trước
      doc
        .font('Vietnamese')
        .fontSize(10)
        .text('Mặt trước CCCD', imageStartX, imageStartY, {
          width: imageWidth,
          align: 'center',
        });

      doc.image(data.cccdMatTruoc, imageStartX, imageStartY + 20, {
        fit: [imageWidth, imageHeight],
        align: 'center',
        valign: 'center',
      });

      // Mặt sau
      const imageBackX = imageStartX + imageWidth + imageGap;

      doc
        .font('Vietnamese')
        .fontSize(10)
        .text('Mặt sau CCCD', imageBackX, imageStartY, {
          width: imageWidth,
          align: 'center',
        });

      doc.image(data.cccdMatSau, imageBackX, imageStartY + 20, {
        fit: [imageWidth, imageHeight],
        align: 'center',
        valign: 'center',
      });

      doc.y = imageStartY + imageHeight + 40;

      doc
        .font('Vietnamese')
        .fontSize(11)
        .text('Hai bên thống nhất các điều khoản sau:', {
          width: 495,
          align: 'left',
          lineGap: 3,
        });

      doc.moveDown(0.4);

      // =====================================================
      // ĐIỀU 1
      // =====================================================

      addSectionTitle('ĐIỀU 1. ĐỊA CHỈ NHÀ TRỌ CHO THUÊ');

      addLabelValue('Nhà trọ', data.tenNhaTro);

      addLabelValue('Địa chỉ nhà trọ', data.diaChiNhaTro);

      addLabelValue('Tầng số', data.tangSo);

      addLabelValue('Phòng số', data.maPhong);

      addLabelValue('Giường số', data.giuongSo);

      doc.moveDown(0.5);

      // =====================================================
      // ĐIỀU 2
      // =====================================================

      addSectionTitle('ĐIỀU 2. GIÁ THUÊ, TIỀN ĐẶT CỌC VÀ THANH TOÁN');

      addLabelValue('Giá thuê', `${formatMoney(data.tienThue)} đồng/tháng`);

      addLabelValue('Tiền đặt cọc', `${formatMoney(data.tienDatCoc)} đồng`);

      addParagraph(
        'Giá thuê đã bao gồm tất cả các dịch vụ đi kèm theo thỏa thuận của hai bên.',
      );

      addParagraph(
        'Bên B thanh toán tiền thuê vào ngày mùng 1 hằng tháng bằng hình thức chuyển khoản.',
      );

      addParagraph(`Số tiền thuê: ${formatMoney(data.tienThue)} đồng/tháng.`);

      // =====================================================
      // ĐIỀU 3
      // =====================================================

      addSectionTitle('ĐIỀU 3. THỜI HẠN THUÊ VÀ GIAO NHẬN');

      addParagraph(
        'Thời hạn thuê tối thiểu là 03 tháng. Hai bên thống nhất thời gian thuê như sau:',
      );

      addLabelValue('Ngày bắt đầu', formatDate(data.ngayBatDau));

      addLabelValue('Ngày kết thúc', formatDate(data.ngayKetThuc));

      // =====================================================
      // ĐIỀU 4
      // =====================================================

      addSectionTitle('ĐIỀU 4. QUYỀN VÀ NGHĨA VỤ CỦA HAI BÊN');

      addParagraph(
        '4.1. Bên A: Giao nhà đúng hiện trạng và đúng thời gian đã thỏa thuận; đảm bảo cho Bên B được sử dụng ổn định trong thời hạn thuê; thực hiện sửa chữa các hư hỏng không do lỗi của Bên B.',
      );

      addParagraph(
        '4.2. Bên B: Thanh toán tiền thuê và các khoản chi phí đúng thời hạn; sử dụng nhà đúng mục đích; giữ gìn tài sản; không tự ý sửa chữa, cải tạo hoặc cho thuê lại khi chưa được Bên A đồng ý.',
      );

      addParagraph(
        'Bên B có trách nhiệm tuân thủ các quy định của nhà trọ, quy định về phòng cháy chữa cháy và đăng ký tạm trú theo quy định.',
      );

      addParagraph(
        'Khi chấm dứt hợp đồng, Bên B có trách nhiệm bàn giao lại phòng và tài sản theo đúng hiện trạng ban đầu, ngoại trừ hao mòn tự nhiên.',
      );

      // =====================================================
      // ĐIỀU 5
      // =====================================================

      addSectionTitle('ĐIỀU 5. CHẤM DỨT HỢP ĐỒNG');

      addParagraph(
        'Hợp đồng chấm dứt khi hết thời hạn thuê hoặc theo thỏa thuận của hai bên.',
      );

      addParagraph(
        'Thời hạn thuê tối thiểu là 03 tháng. Trường hợp một bên muốn chấm dứt hợp đồng trước thời hạn phải thông báo cho bên còn lại trước ít nhất 30 ngày.',
      );

      addParagraph(
        'Bên vi phạm nghĩa vụ dẫn đến việc chấm dứt hợp đồng phải chịu trách nhiệm bồi thường theo thỏa thuận giữa hai bên.',
      );

      addParagraph(
        'Tiền đặt cọc được hoàn trả hoặc khấu trừ các khoản nghĩa vụ còn thiếu, hư hỏng tài sản hoặc các khoản chi phí khác theo thỏa thuận.',
      );

      // =====================================================
      // ĐIỀU 6
      // =====================================================

      addSectionTitle('ĐIỀU 6. CAM KẾT CHUNG');

      addParagraph(
        'Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận trong hợp đồng.',
      );

      addParagraph(
        'Mọi tranh chấp phát sinh trong quá trình thực hiện hợp đồng trước hết sẽ được hai bên ưu tiên giải quyết bằng thương lượng.',
      );

      addParagraph(
        'Trường hợp thương lượng không thành công, tranh chấp sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền.',
      );

      // =====================================================
      // XÁC NHẬN
      // =====================================================

      doc.moveDown(0.5);

      addParagraph(
        'Nội dung bên trên sẽ được coi như một bản hợp đồng giữa hai bên. Bên A mặc định đã ký. Bên B xác nhận đã đọc, hiểu và đồng ý với toàn bộ nội dung hợp đồng.',
      );

      // =====================================================
      // CHỮ KÝ
      // =====================================================

      doc.moveDown(1);

      const signatureY = doc.y;

      doc.font('Vietnamese').fontSize(11).text('BÊN CHO THUÊ', 50, signatureY, {
        width: 220,
        align: 'center',
      });

      doc.font('Vietnamese').fontSize(11).text('BÊN THUÊ', 325, signatureY, {
        width: 220,
        align: 'center',
      });

      doc
        .font('Vietnamese')
        .fontSize(10)
        .text('(BÊN A)', 50, signatureY + 18, {
          width: 220,
          align: 'center',
        });

      doc
        .font('Vietnamese')
        .fontSize(10)
        .text('(BÊN B)', 325, signatureY + 18, {
          width: 220,
          align: 'center',
        });

      doc
        .font('Vietnamese')
        .fontSize(9)
        .text('(Xác nhận ký, ghi rõ họ tên)', 50, signatureY + 35, {
          width: 220,
          align: 'center',
        });

      doc
        .font('Vietnamese')
        .fontSize(9)
        .text('(Xác nhận ký, ghi rõ họ tên)', 325, signatureY + 35, {
          width: 220,
          align: 'center',
        });

      // Khoảng trống ký tên
      doc
        .font(fontPath)
        .fontSize(10)
        .text('', 50, signatureY + 55, {
          width: 220,
          height: 70,
        });

      doc
        .font(fontPath)
        .fontSize(10)
        .text('', 325, signatureY + 55, {
          width: 220,
          height: 70,
        });

      // =========================
      // TRẠNG THÁI KÝ
      // =========================

      doc
        .font('Vietnamese')
        .fontSize(9)
        .text('Đã ký', 50, signatureY + 125, {
          width: 220,
          align: 'center',
        });

      doc
        .font('Vietnamese')
        .fontSize(9)
        .text(
          data.benBDaKy ? 'Tôi xác nhận đã ký' : 'Chưa xác nhận ký',
          325,
          signatureY + 125,
          {
            width: 220,
            align: 'center',
          },
        );

      // =========================
      // HỌ VÀ TÊN
      // =========================

      doc
        .font('Vietnamese')
        .fontSize(10)
        .text(data.benA.hoTen || 'Bên A', 50, signatureY + 145, {
          width: 220,
          align: 'center',
        });

      doc
        .font('Vietnamese')
        .fontSize(10)
        .text(data.hoTen || '........................', 325, signatureY + 145, {
          width: 220,
          align: 'center',
        });

      // =====================================================
      // FOOTER PAGE NUMBER
      // =====================================================

      addPageNumber();

      doc.end();
    });
  }
}
