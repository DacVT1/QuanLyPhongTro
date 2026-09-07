import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { TaiKhoan } from '../../entities/tai-khoan.entity';
import { Tenant } from '../../entities/tenant.entity';
import { GoiDichVu } from '../../entities/goi-dich-vu.entity';
import { Subscription } from '../../entities/subscription.entity';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyRegisterDto } from './dto/verify-register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TaiKhoan)
    private readonly taiKhoanRepository: Repository<TaiKhoan>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(GoiDichVu)
    private readonly goiDichVuRepository: Repository<GoiDichVu>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    private readonly jwtService: JwtService,
  ) {}

  /**
   * Lưu thông tin đăng ký đang chờ xác thực OTP.
   *
   * Key:
   *   email
   *
   * Value:
   *   passwordHash
   *   tenHienThi
   *   otp
   *   expiresAt
   *
   * OTP có hiệu lực 5 phút.
   */
  private readonly pendingRegistrations = new Map<
    string,
    {
      passwordHash: string;
      tenHienThi: string;
      otp: string;
      expiresAt: number;
    }
  >();

  /**
   * Đăng ký tài khoản.
   *
   * Luồng:
   * 1. Kiểm tra email đã tồn tại chưa.
   * 2. Kiểm tra email hợp lệ.
   * 3. Hash mật khẩu.
   * 4. Sinh OTP 6 số.
   * 5. Lưu đăng ký tạm thời.
   * 6. Gửi OTP về email.
   *
   * Chưa tạo TaiKhoan/Tenant tại bước này.
   */
  async register(dto: RegisterDto) {
    const username = dto.username.trim().toLowerCase();

    // Hiện tại chức năng xác thực OTP qua email.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(username)) {
      throw new BadRequestException('Vui lòng nhập email hợp lệ để đăng ký');
    }

    // Kiểm tra tài khoản đã tồn tại.
    const existingAccount = await this.taiKhoanRepository.findOne({
      where: {
        username,
      },
    });

    if (existingAccount) {
      throw new ConflictException('Email đã được đăng ký');
    }

    // Nếu email đang có một phiên đăng ký OTP trước đó,
    // xóa phiên cũ để tạo OTP mới.
    this.pendingRegistrations.delete(username);

    // Hash mật khẩu trước khi lưu tạm.
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Sinh OTP 6 số.
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP có hiệu lực 5 phút.
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Lưu thông tin đăng ký tạm.
    this.pendingRegistrations.set(username, {
      passwordHash,
      tenHienThi: dto.tenHienThi.trim(),
      otp,
      expiresAt,
    });

    try {
      // Gửi OTP qua email.
      await this.sendRegistrationOtpEmail(username, otp);
    } catch (error) {
      // Nếu gửi email thất bại thì xóa đăng ký tạm.
      this.pendingRegistrations.delete(username);

      console.error('Gửi email OTP thất bại:', error);

      throw new InternalServerErrorException(
        'Không thể gửi mã xác thực về email. Vui lòng kiểm tra cấu hình email.',
      );
    }

    return {
      message: 'Mã xác thực đã được gửi về email',
    };
  }

  /**
   * Gửi OTP đăng ký qua Resend.
   */
  private async sendRegistrationOtpEmail(email: string, otp: string) {
    const apiKey = process.env.RESEND_API_KEY;

    const mailFrom = process.env.MAIL_FROM;

    if (!apiKey) {
      throw new Error('Thiếu biến môi trường RESEND_API_KEY');
    }

    if (!mailFrom) {
      throw new Error('Thiếu biến môi trường MAIL_FROM');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        from: mailFrom,

        to: [email],

        subject: 'Mã xác thực đăng ký tài khoản - Quản lý phòng trọ',

        html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8" />
                <title>Mã xác thực đăng ký</title>
              </head>

              <body
                style="
                  margin: 0;
                  padding: 0;
                  background: #f1f5f9;
                  font-family: Arial, sans-serif;
                "
              >
                <div
                  style="
                    max-width: 600px;
                    margin: 30px auto;
                    background: #ffffff;
                    padding: 30px;
                    border-radius: 12px;
                  "
                >
                  <h2
                    style="
                      text-align: center;
                      margin-bottom: 20px;
                    "
                  >
                    Xác thực đăng ký tài khoản
                  </h2>

                  <p>
                    Xin chào,
                  </p>

                  <p>
                    Bạn vừa thực hiện đăng ký tài khoản
                    trên hệ thống Quản lý phòng trọ.
                  </p>

                  <p>
                    Mã xác thực của bạn là:
                  </p>

                  <div
                    style="
                      text-align: center;
                      margin: 25px 0;
                    "
                  >
                    <span
                      style="
                        display: inline-block;
                        padding: 15px 25px;
                        background: #f1f5f9;
                        border-radius: 10px;
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                      "
                    >
                      ${otp}
                    </span>
                  </div>

                  <p>
                    Mã xác thực có hiệu lực trong
                    <strong>5 phút</strong>.
                  </p>

                  <p>
                    Không cung cấp mã này cho người khác.
                  </p>

                  <p>
                    Nếu bạn không thực hiện đăng ký,
                    vui lòng bỏ qua email này.
                  </p>

                  <hr />

                  <p
                    style="
                      color: #64748b;
                      font-size: 13px;
                      text-align: center;
                    "
                  >
                    Quản lý phòng trọ
                  </p>
                </div>
              </body>
            </html>
          `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(`Resend API error: ${response.status} ${errorText}`);
    }
  }

  /**
   * Xác thực OTP đăng ký.
   *
   * Đúng OTP:
   *   -> Tạo Tenant
   *   -> Tạo Subscription
   *   -> Tạo TaiKhoan
   *   -> Xóa OTP
   *
   * Sai OTP:
   *   -> Không tạo tài khoản
   *   -> Trả lỗi cho frontend
   */
  async verifyRegister(dto: VerifyRegisterDto) {
    const username = dto.identifier.trim().toLowerCase();

    const otp = dto.otp.trim();

    // Lấy thông tin đăng ký tạm.
    const pending = this.pendingRegistrations.get(username);

    if (!pending) {
      throw new BadRequestException(
        'Không tìm thấy thông tin đăng ký hoặc mã xác thực đã hết hạn',
      );
    }

    // Kiểm tra hết hạn.
    if (Date.now() > pending.expiresAt) {
      this.pendingRegistrations.delete(username);

      throw new BadRequestException(
        'Mã xác thực đã hết hạn. Vui lòng đăng ký lại.',
      );
    }

    // Kiểm tra OTP.
    if (pending.otp !== otp) {
      throw new BadRequestException('Mã xác thực không đúng');
    }

    // Kiểm tra lại tài khoản.
    const existingAccount = await this.taiKhoanRepository.findOne({
      where: {
        username,
      },
    });

    if (existingAccount) {
      this.pendingRegistrations.delete(username);

      throw new ConflictException('Email đã được đăng ký');
    }

    // =====================================================
    // 1. TẠO TENANT
    // =====================================================

    const tenant = this.tenantRepository.create({
      maTenant: `TENANT-${Date.now()}`,
      ten: pending.tenHienThi,
      trangThai: 'active',
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // =====================================================
    // 2. LẤY GÓI FREE
    // =====================================================

    const goiFree = await this.goiDichVuRepository.findOne({
      where: {
        maGoi: 'FREE',
        trangThai: 'active',
      },
    });

    if (!goiFree) {
      throw new ConflictException('Chưa cấu hình gói FREE');
    }

    // =====================================================
    // 3. TẠO SUBSCRIPTION
    // =====================================================

    const ngayBatDau = new Date();

    const ngayKetThuc = new Date(ngayBatDau);

    ngayKetThuc.setMonth(ngayKetThuc.getMonth() + 1);

    const subscription = this.subscriptionRepository.create({
      tenant: savedTenant,
      goiDichVu: goiFree,
      ngayBatDau,
      ngayKetThuc,
      trangThai: 'active',
      autoRenew: false,
    });

    await this.subscriptionRepository.save(subscription);

    // =====================================================
    // 4. TẠO TÀI KHOẢN
    // =====================================================

    const taiKhoan = this.taiKhoanRepository.create({
      username,
      passwordHash: pending.passwordHash,
      tenHienThi: pending.tenHienThi,
      email: username,
      role: 'admin',
      tenant: savedTenant,
    });

    const saved = await this.taiKhoanRepository.save(taiKhoan);

    // =====================================================
    // 5. XÓA OTP
    // =====================================================

    this.pendingRegistrations.delete(username);

    return {
      message: 'Xác thực đăng ký thành công',

      account: {
        id: saved.id,
        username: saved.username,
        tenHienThi: saved.tenHienThi,
        email: saved.email,
        role: saved.role,
        tenantId: savedTenant.id,
      },
    };
  }

  /**
   * Đăng nhập.
   *
   * username hiện chứa email.
   */
  async login(dto: LoginDto) {
    const username = dto.username.trim().toLowerCase();

    const taiKhoan = await this.taiKhoanRepository.findOne({
      where: {
        username,
      },

      relations: {
        tenant: true,
      },
    });

    if (!taiKhoan) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      taiKhoan.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // JWT payload.
    const payload = {
      sub: taiKhoan.id,
      username: taiKhoan.username,
      role: taiKhoan.role,
      tenantId: taiKhoan.tenant.id,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Đăng nhập thành công',

      accessToken,

      user: {
        id: taiKhoan.id,
        username: taiKhoan.username,
        tenHienThi: taiKhoan.tenHienThi,
        email: taiKhoan.email,
        role: taiKhoan.role,
      },
    };
  }
}
