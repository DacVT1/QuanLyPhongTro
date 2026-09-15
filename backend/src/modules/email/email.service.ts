import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY chưa được cấu hình.');
    }

    this.resend = new Resend(apiKey);
  }

  async sendContractPdf(
    recipientEmails: string[],
    fileName: string,
    pdfBuffer: Buffer,
    tenantName: string,
  ) {
    const from =
      process.env.MAIL_FROM || 'HỢP ĐỒNG THUÊ TRỌ <onboarding@resend.dev>';

    const { data, error } = await this.resend.emails.send({
      from,
      to: recipientEmails,
      subject: `Hợp đồng thuê trọ - ${tenantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>HỢP ĐỒNG THUÊ TRỌ</h2>

          <p>Xin chào <strong>${tenantName}</strong>,</p>

          <p>
            Hợp đồng thuê trọ của bạn đã được tạo thành công.
          </p>

          <p>
            Vui lòng xem file PDF hợp đồng được đính kèm trong email này.
          </p>

          <p>
            Trân trọng.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);

      throw new InternalServerErrorException('Không thể gửi email hợp đồng.');
    }

    return data;
  }

  async sendContractVerificationCode(
    recipientEmail: string,
    tenantName: string,
    code: string,
    signed: boolean,
  ) {
    const from =
      process.env.MAIL_FROM || 'HỢP ĐỒNG THUÊ TRỌ <onboarding@resend.dev>';

    const signingMessage = signed
      ? 'Bạn đã đồng ý ký hợp đồng.'
      : 'Bạn đã không đồng ý ký hợp đồng.';

    const { data, error } = await this.resend.emails.send({
      from,
      to: [recipientEmail],
      subject: 'Mã xác nhận hợp đồng thuê trọ',
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>HỢP ĐỒNG THUÊ TRỌ</h2>

        <p>Xin chào <strong>${tenantName}</strong>,</p>

        <p>${signingMessage}</p>

        <p>Mã xác nhận của bạn là:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          margin: 20px 0;
        ">
          ${code}
        </div>

        <p>
          Mã xác nhận có hiệu lực trong
          <strong>10 phút</strong>.
        </p>

        <p>
          Vui lòng nhập mã này trên Form HỢP ĐỒNG THUÊ TRỌ
          để hoàn tất xác nhận.
        </p>

        <p>Trân trọng.</p>
      </div>
    `,
    });

    if (error) {
      console.error('Resend verification error:', error);

      throw new InternalServerErrorException(
        'Không thể gửi mã xác nhận qua email.',
      );
    }

    return data;
  }

  async sendInvoiceEmail(
    recipientEmails: string[],
    subject: string,
    html: string,
    tenantName: string,
    qrBuffer?: Buffer,
  ) {
    const from =
      process.env.MAIL_FROM || 'HÓA ĐƠN TIỀN PHÒNG <onboarding@resend.dev>';

    const attachments = qrBuffer
      ? [
          {
            filename: 'QR.png',
            content: qrBuffer,
            contentId: 'payment-qr',
          },
        ]
      : undefined;

    const { data, error } = await this.resend.emails.send({
      from,
      to: recipientEmails,
      subject,
      html,
      attachments,
    });

    if (error) {
      console.error('Resend invoice error:', error);

      throw new InternalServerErrorException('Không thể gửi email hóa đơn.');
    }

    return data;
  }
}
