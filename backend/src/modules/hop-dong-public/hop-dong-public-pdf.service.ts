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
    maQrThanhToan: Buffer | null;
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
  cccdMatTruoc: Buffer | null;
  cccdMatSau: Buffer | null;

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

      const qrPath = path.resolve(process.cwd(), 'assets', 'images', 'QR.png');

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

      // Hiển thị nhiều trường trên cùng một dòng để giảm chiều dài PDF.
      const addInlineFields = (
        fields: Array<{
          label: string;
          value: string | number | undefined | null;
        }>,
      ) => {
        const line = fields
          .map(({ label, value }) => `${label}: ${value ?? ''}`)
          .join('   |   ');

        doc.font('Vietnamese').fontSize(9.5).text(line, {
          width: 495,
          lineGap: 2,
          align: 'left',
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

      addInlineFields([
        { label: 'CCCD số', value: data.benA.cccd },
        { label: 'Ngày cấp', value: formatDate(data.benA.ngayCap) },
        { label: 'Nơi cấp', value: data.benA.noiCap },
      ]);

      addLabelValue('Điện thoại', data.benA.sdt);

      addInlineFields([
        { label: 'Ngân hàng', value: data.benA.nganHang },
        { label: 'Số tài khoản', value: data.benA.soTaiKhoan },
        { label: 'Chủ tài khoản', value: data.benA.chuTaiKhoan },
      ]);

      addLabelValue('Địa chỉ thường trú', data.benA.diaChi);

      doc.moveDown(0.5);
      // =====================================================
      // MÃ QR THANH TOÁN BÊN A
      // =====================================================

      const qrTitleY = doc.y;

      doc
        .font('Vietnamese')
        .fontSize(11)
        .text('MÃ QR THANH TOÁN', 50, qrTitleY, {
          width: 495,
          align: 'center',
        });

      doc.moveDown(0.5);

      if (data.benA.maQrThanhToan) {
        const qrSize = 150;

        // Căn QR chính giữa vùng nội dung PDF
        const qrX = 50 + (495 - qrSize) / 2;
        const qrY = doc.y;

        doc.image(data.benA.maQrThanhToan, qrX, qrY, {
          fit: [qrSize, qrSize],
        });

        // Đẩy nội dung tiếp theo xuống dưới QR
        doc.y = qrY + qrSize + 12;
      } else {
        doc
          .font('Vietnamese')
          .fontSize(9)
          .text('Chưa cập nhật mã QR thanh toán', {
            width: 495,
            align: 'center',
          });

        doc.moveDown(0.8);
      }

      // =====================================================
      // BÊN B
      // =====================================================

      addSectionTitle('BÊN THUÊ (BÊN B)');

      addLabelValue('Họ và tên', data.hoTen);

      addInlineFields([{ label: 'CCCD số', value: data.cccd }]);

      addLabelValue('Ngày sinh', formatDate(data.ngaySinh));

      addInlineFields([
        { label: 'Điện thoại', value: data.sdt },
        { label: 'Email', value: data.email },
      ]);

      addLabelValue('Địa chỉ', data.diaChi);

      addLabelValue('Biển số xe', data.bienSoXe);

      doc.moveDown(0.5);

      // =====================================================
      // CCCD BÊN B
      // =====================================================

      addSectionTitle('ẢNH CCCD BÊN THUÊ');

      // =====================================================
      // CẤU HÌNH VÙNG ẢNH
      // =====================================================

      const pageLeft = 50;
      const pageRight = 545;

      const imageGap = 20;

      // Chiều rộng vùng hiển thị mỗi ảnh
      const imageWidth = (pageRight - pageLeft - imageGap) / 2;

      // Chiều cao tối đa của ảnh
      const imageHeight = 140;

      // Khoảng cách từ tiêu đề đến ảnh
      const imageTopGap = 20;

      // Khoảng cách an toàn phía dưới ảnh
      const bottomSafeGap = 45;

      // Vị trí footer hiện tại của PDF:
      // source đang đặt số trang tại y = 810
      const footerY = 810;

      // =====================================================
      // KIỂM TRA TRƯỚC KHI ĐẶT ẢNH
      // =====================================================

      const currentY = doc.y;

      // Chiều cao thực tế cần cho:
      // tiêu đề + khoảng cách + ảnh + khoảng cách an toàn
      const requiredHeight = imageTopGap + imageHeight + bottomSafeGap;

      // Nếu không đủ chỗ trên trang hiện tại
      // thì chuyển toàn bộ phần CCCD sang trang mới.
      if (currentY + requiredHeight > footerY) {
        doc.addPage();

        doc.font('Vietnamese').fontSize(11).fillColor('#000000');
      }

      // =====================================================
      // VỊ TRÍ HIỂN THỊ ẢNH
      // =====================================================

      const imageTitleY = doc.y;

      const imageStartY = imageTitleY + imageTopGap;

      // =====================================================
      // MẶT TRƯỚC CCCD
      // =====================================================

      doc
        .font('Vietnamese')
        .fontSize(10)
        .fillColor('#000000')
        .text('Mặt trước CCCD', pageLeft, imageTitleY, {
          width: imageWidth,
          align: 'center',
        });

      if (data.cccdMatTruoc) {
        doc.image(data.cccdMatTruoc, pageLeft, imageStartY, {
          fit: [imageWidth, imageHeight],
          align: 'center',
          valign: 'center',
        });
      } else {
        doc
          .font('Vietnamese')
          .fontSize(9)
          .text('Không có ảnh', pageLeft, imageStartY + 60, {
            width: imageWidth,
            align: 'center',
          });
      }

      // =====================================================
      // MẶT SAU CCCD
      // =====================================================

      const imageBackX = pageLeft + imageWidth + imageGap;

      doc
        .font('Vietnamese')
        .fontSize(10)
        .fillColor('#000000')
        .text('Mặt sau CCCD', imageBackX, imageTitleY, {
          width: imageWidth,
          align: 'center',
        });

      if (data.cccdMatSau) {
        doc.image(data.cccdMatSau, imageBackX, imageStartY, {
          fit: [imageWidth, imageHeight],
          align: 'center',
          valign: 'center',
        });
      } else {
        doc
          .font('Vietnamese')
          .fontSize(9)
          .text('Không có ảnh', imageBackX, imageStartY + 60, {
            width: imageWidth,
            align: 'center',
          });
      }

      // =====================================================
      // ĐẨY NỘI DUNG TIẾP THEO XUỐNG DƯỚI ẢNH
      // =====================================================

      doc.y = imageStartY + imageHeight + 30;

      doc.font('Vietnamese').fontSize(11).fillColor('#000000');

      doc
        .font('Vietnamese')
        .fontSize(11)
        .text('Hai bên thống nhất các điều khoản sau:', 50, doc.y, {
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

      const maPhong = String(data.maPhong ?? '').trim();

      let phongSo = maPhong;

      // Nếu mã phòng là dạng số có từ 3 chữ số,
      // lấy 2 chữ số cuối làm số phòng.
      if (/^\d{3,}$/.test(maPhong)) {
        phongSo = maPhong.slice(-2).replace(/^0+/, '') || '0';
      }

      addLabelValue(
        'Phòng số',
        phongSo?.match(/_T\d+(\d{2})$/)?.[1]?.replace(/^0+/, '') || '',
      );

      addLabelValue('Giường số', data.giuongSo);

      doc.moveDown(0.5);

      // =====================================================
      // ĐIỀU 2
      // =====================================================

      addSectionTitle('ĐIỀU 2. GIÁ THUÊ, TIỀN ĐẶT CỌC VÀ THANH TOÁN');

      addLabelValue('1. Giá thuê', `${formatMoney(data.tienThue)} đồng/tháng`);

      addLabelValue('2. Tiền đặt cọc', `${formatMoney(data.tienDatCoc)} đồng`);

      addParagraph(
        '3. Giá thuê đã bao gồm các dịch vụ đi kèm theo thỏa thuận của hai bên.',
      );
      addParagraph(
        '4. Bên B có trách nhiệm thanh toán tiền thuê vào ngày mùng 1 hằng tháng bằng hình thức chuyển khoản.',
      );
      addParagraph(
        '5. Các khoản tiền và nghĩa vụ thanh toán khác, nếu có, được thực hiện theo thỏa thuận cụ thể giữa hai bên.',
      );

      // =====================================================
      // ĐIỀU 3
      // =====================================================

      addSectionTitle('ĐIỀU 3. THỜI HẠN THUÊ VÀ GIAO NHẬN');

      addParagraph(
        '1. Thời hạn thuê tối thiểu là 03 tháng. Hai bên thống nhất thời gian thuê như sau:',
      );

      addLabelValue('Ngày bắt đầu', formatDate(data.ngayBatDau));

      addLabelValue('Ngày kết thúc', formatDate(data.ngayKetThuc));
      addParagraph(
        '2. Bên A có trách nhiệm bàn giao chỗ thuê cho Bên B theo đúng thời gian và hiện trạng đã thỏa thuận.',
      );

      // =====================================================
      // ĐIỀU 4
      // =====================================================

      addSectionTitle('ĐIỀU 4. QUYỀN VÀ NGHĨA VỤ CỦA HAI BÊN');

      addParagraph('4.1. Bên A:');
      addParagraph(
        '- Giao chỗ thuê đúng hiện trạng và thời gian đã thỏa thuận.',
      );
      addParagraph(
        '- Đảm bảo cho Bên B được sử dụng ổn định chỗ thuê trong thời hạn hợp đồng, trừ các trường hợp được phép theo thỏa thuận và quy định pháp luật.',
      );
      addParagraph(
        '- Thực hiện sửa chữa các hư hỏng không do lỗi của Bên B theo trách nhiệm của Bên A.',
      );
      addParagraph(
        '- Tôn trọng quyền và lợi ích hợp pháp của Bên B theo hợp đồng và quy định pháp luật.',
      );

      addParagraph('4.2. Bên B:');
      addParagraph(
        '- Thanh toán tiền thuê và các khoản chi phí theo đúng thời hạn đã thỏa thuận.',
      );
      addParagraph(
        '- Sử dụng chỗ thuê đúng mục đích; giữ gìn tài sản; không tự ý sửa chữa, cải tạo hoặc cho thuê lại khi chưa được Bên A đồng ý.',
      );
      addParagraph(
        '- Tuân thủ nội quy nhà trọ, quy định về phòng cháy, chữa cháy và thực hiện đăng ký, khai báo tạm trú theo quy định pháp luật.',
      );
      addParagraph(
        '- Khi chấm dứt hợp đồng, bàn giao lại chỗ thuê và tài sản theo hiện trạng ban đầu, ngoại trừ hao mòn tự nhiên và các trường hợp khác được hai bên thống nhất.',
      );

      // =====================================================
      // ĐIỀU 5
      // =====================================================

      addSectionTitle('ĐIỀU 5. CHẤM DỨT HỢP ĐỒNG');

      addParagraph(
        '1. Hợp đồng chấm dứt khi hết thời hạn thuê hoặc theo thỏa thuận của hai bên, hoặc các trường hợp khác theo quy định pháp luật.',
      );
      addParagraph(
        '2. Thời hạn thuê tối thiểu là 03 tháng. Trường hợp một bên muốn chấm dứt hợp đồng trước thời hạn, bên đó phải thông báo cho bên còn lại trước ít nhất 30 ngày, trừ trường hợp hai bên có thỏa thuận khác hoặc pháp luật có quy định khác.',
      );
      addParagraph(
        '3. Bên vi phạm nghĩa vụ dẫn đến việc chấm dứt hợp đồng phải chịu trách nhiệm bồi thường thiệt hại theo thỏa thuận hợp pháp của hai bên và quy định pháp luật.',
      );
      addParagraph(
        '4. Tiền đặt cọc được hoàn trả hoặc khấu trừ các khoản nghĩa vụ còn thiếu, chi phí khắc phục hư hỏng do lỗi của Bên B và các khoản khác theo thỏa thuận hợp pháp của hai bên.',
      );

      // =====================================================
      // ĐIỀU 6
      // =====================================================

      addSectionTitle('ĐIỀU 6. CAM KẾT CHUNG');

      addParagraph(
        '1. Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận trong hợp đồng.',
      );
      addParagraph(
        '2. Mọi tranh chấp phát sinh trong quá trình thực hiện hợp đồng trước hết được hai bên ưu tiên giải quyết thông qua thương lượng.',
      );
      addParagraph(
        '3. Trường hợp thương lượng không thành công, tranh chấp được giải quyết tại Tòa án nhân dân có thẩm quyền theo quy định pháp luật.',
      );
      // =====================================================
      // ĐIỀU 7
      // =====================================================
      addSectionTitle(
        'ĐIỀU 7. CAM KẾT VỀ TÍNH CHÍNH XÁC CỦA THÔNG TIN, DỮ LIỆU',
      );

      addParagraph(
        '1. Bên B cam kết các thông tin, dữ liệu, giấy tờ và tài liệu do mình cung cấp để lập, xác nhận và thực hiện hợp đồng, bao gồm nhưng không giới hạn ở họ tên, ngày tháng năm sinh, số định danh cá nhân hoặc căn cước công dân, địa chỉ, số điện thoại, email và các thông tin liên quan khác, là đầy đủ, chính xác, trung thực và thuộc quyền cung cấp, sử dụng hợp pháp của Bên B.',
      );
      addParagraph(
        '2. Bên B chịu trách nhiệm về tính chính xác, trung thực và hợp pháp của các thông tin, dữ liệu do mình cung cấp; có trách nhiệm thông báo và phối hợp cập nhật kịp thời khi phát hiện thông tin sai lệch, thiếu sót hoặc có thay đổi ảnh hưởng đến việc thực hiện hợp đồng.',
      );
      addParagraph(
        '3. Trường hợp Bên B cung cấp thông tin sai sự thật, giả mạo giấy tờ, sử dụng thông tin của người khác trái phép hoặc có hành vi gian dối làm ảnh hưởng đến quyền, lợi ích hợp pháp của Bên A hoặc bên thứ ba, Bên B phải chịu trách nhiệm đối với hành vi của mình và bồi thường thiệt hại thực tế phát sinh theo quy định pháp luật. Việc xử lý vi phạm hoặc chấm dứt hợp đồng phải tuân thủ các điều khoản hợp đồng và quy định pháp luật có liên quan.',
      );
      addParagraph(
        '4. Bên A có trách nhiệm sử dụng, lưu trữ và bảo vệ thông tin, dữ liệu cá nhân của Bên B theo mục đích hợp pháp, phạm vi cần thiết để lập, quản lý và thực hiện hợp đồng, đồng thời tuân thủ quy định pháp luật về bảo vệ dữ liệu cá nhân. Việc cung cấp thông tin cho bên thứ ba chỉ được thực hiện khi có căn cứ pháp luật hoặc sự đồng ý hợp lệ của chủ thể dữ liệu, tùy từng trường hợp.',
      );

      // =====================================================
      // ĐIỀU 8
      // =====================================================
      addSectionTitle('ĐIỀU 8. HIỆU LỰC PHÁP LÝ CỦA HỢP ĐỒNG ĐIỆN TỬ');

      addParagraph(
        '1. Hai bên thống nhất xác lập và xác nhận hợp đồng thông qua hệ thống điện tử của nền tảng quản lý nhà trọ. Hợp đồng cùng các dữ liệu điện tử ghi nhận quá trình tạo lập, hiển thị, xác nhận và lưu trữ hợp đồng được sử dụng làm căn cứ xác định nội dung thỏa thuận và việc xác nhận của các bên theo quy định pháp luật.',
      );
      addParagraph(
        '2. Bên A xác nhận việc đồng ý giao kết hợp đồng thông qua thao tác xác nhận điện tử hoặc phương thức xác nhận được hệ thống ghi nhận. Bên B xác nhận đã đọc, hiểu, có cơ hội xem xét nội dung hợp đồng, tự nguyện đồng ý với toàn bộ điều khoản và thực hiện thao tác xác nhận điện tử theo hướng dẫn của hệ thống.',
      );
      addParagraph(
        '3. Các bên thống nhất rằng việc xác nhận điện tử có thể được sử dụng làm căn cứ chứng minh ý chí giao kết hợp đồng. Giá trị pháp lý của hợp đồng điện tử, dữ liệu điện tử và phương thức xác nhận được xác định theo quy định pháp luật hiện hành; việc xác nhận điện tử không mặc nhiên thay thế chữ ký hoặc hình thức bắt buộc khác trong trường hợp pháp luật yêu cầu.',
      );
      addParagraph(
        '4. Hợp đồng có hiệu lực kể từ thời điểm hai bên hoàn tất việc xác nhận giao kết theo phương thức đã thỏa thuận, trừ khi hai bên có thỏa thuận khác hoặc pháp luật có quy định khác. Hợp đồng chấm dứt theo Điều 5 của hợp đồng và các quy định pháp luật có liên quan.',
      );
      addParagraph(
        '5. Hệ thống có thể lưu trữ các thông tin phục vụ việc chứng minh giao kết hợp đồng như nội dung hợp đồng tại thời điểm xác nhận, thời gian xác nhận, tài khoản thực hiện và lịch sử thao tác liên quan. Việc thu thập, lưu trữ và sử dụng các thông tin này phải tuân thủ quy định pháp luật về bảo vệ dữ liệu cá nhân và các quy định pháp luật có liên quan.',
      );
      addParagraph(
        '6. Hợp đồng điện tử được lưu trữ trên hệ thống để các bên có thể xem lại và đối chiếu khi cần thiết. Mỗi bên có trách nhiệm giữ gìn thông tin đăng nhập và không để người khác sử dụng tài khoản của mình để xác nhận hợp đồng trái phép.',
      );
      // =====================================================
      // ĐIỀU 9
      // =====================================================
      addSectionTitle('ĐIỀU 9. ĐIỀU KHOẢN CUỐI CÙNG');

      addParagraph(
        'Hai bên xác nhận đã đọc, hiểu và tự nguyện đồng ý với toàn bộ nội dung hợp đồng. Những vấn đề chưa được quy định trong hợp đồng này được thực hiện theo thỏa thuận hợp pháp của hai bên và quy định pháp luật hiện hành.',
      );
      addParagraph(
        'Hợp đồng được lập và lưu trữ dưới dạng điện tử trên hệ thống. Dữ liệu xác nhận của các bên được lưu giữ cùng hợp đồng nhằm phục vụ việc tra cứu, đối chiếu và giải quyết tranh chấp khi cần thiết.',
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
          data.benBDaKy
            ? 'Đã đồng ý và xác nhận đã ký'
            : 'Không đồng ý và không ký',
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
