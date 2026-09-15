import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HopDong } from '../../entities/hop-dong.entity';
import { HopDongController } from './hop-dong.controller';
import { HopDongService } from './hop-dong.service';
import { Giuong } from '../../entities/giuong.entity';
import { AuthModule } from '../auth/auth.module';
import { Tenant } from '../../entities/tenant.entity';
import { NguoiThue } from 'src/entities/nguoi-thue.entity';
import { HopDongPublicPdfService } from '../hop-dong-public/hop-dong-public-pdf.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([HopDong, Giuong, NguoiThue, Tenant]),
  ],
  controllers: [HopDongController],
  providers: [HopDongService, HopDongPublicPdfService],
  exports: [HopDongService],
})
export class HopDongModule {}
