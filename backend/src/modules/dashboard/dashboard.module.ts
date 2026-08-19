import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Giuong } from '../../entities/giuong.entity';
import { HoaDon } from '../../entities/hoa-don.entity';
import { HopDong } from '../../entities/hop-dong.entity';
import { NhaTro } from '../../entities/nha-tro.entity';
import { Phong } from '../../entities/phong.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([NhaTro, Phong, Giuong, HopDong, HoaDon])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
