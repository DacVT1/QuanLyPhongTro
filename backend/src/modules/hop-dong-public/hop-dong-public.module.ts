import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaiKhoan } from '../../entities/tai-khoan.entity';
import { NhaTro } from '../../entities/nha-tro.entity';
import { Phong } from '../../entities/phong.entity';
import { Giuong } from '../../entities/giuong.entity';
import { NguoiThue } from '../../entities/nguoi-thue.entity';
import { HopDong } from '../../entities/hop-dong.entity';
import { HopDongPublicController } from './hop-dong-public.controller';
import { HopDongPublicService } from './hop-dong-public.service';
import { EmailModule } from '../email/email.module';
import { HopDongPublicPdfService } from './hop-dong-public-pdf.service';
import { HopDongXacNhan } from '../../entities/hop-dong-xac-nhan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaiKhoan,
      NhaTro,
      Phong,
      Giuong,
      HopDongXacNhan,
      NguoiThue,
      HopDong,
    ]),
    EmailModule,
  ],

  controllers: [HopDongPublicController],

  providers: [HopDongPublicService, HopDongPublicPdfService],
})
export class HopDongPublicModule {}
