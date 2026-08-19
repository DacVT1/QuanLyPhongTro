import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HoaDon } from '../../entities/hoa-don.entity';
import { HoaDonController } from './hoa-don.controller';
import { HoaDonService } from './hoa-don.service';

@Module({
  imports: [TypeOrmModule.forFeature([HoaDon])],
  controllers: [HoaDonController],
  providers: [HoaDonService],
  exports: [HoaDonService],
})
export class HoaDonModule {}
