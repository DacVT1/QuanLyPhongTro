import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HopDong } from '../../entities/hop-dong.entity';
import { HopDongController } from './hop-dong.controller';
import { HopDongService } from './hop-dong.service';
import { Giuong } from '../../entities/giuong.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HopDong,Giuong])],
  controllers: [HopDongController],
  providers: [HopDongService],
  exports: [HopDongService],
})
export class HopDongModule {}
