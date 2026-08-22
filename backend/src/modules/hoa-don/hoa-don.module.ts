import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HoaDon } from '../../entities/hoa-don.entity';
import { HoaDonController } from './hoa-don.controller';
import { HoaDonService } from './hoa-don.service';
import { HopDong } from '../../entities/hop-dong.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HoaDon, HopDong])],
  controllers: [HoaDonController],
  providers: [HoaDonService],
  exports: [HoaDonService],
})
export class HoaDonModule {}
