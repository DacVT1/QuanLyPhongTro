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
}
