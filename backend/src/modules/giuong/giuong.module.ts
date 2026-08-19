import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Giuong } from '../../entities/giuong.entity';
import { GiuongController } from './giuong.controller';
import { GiuongService } from './giuong.service';

@Module({
  imports: [TypeOrmModule.forFeature([Giuong])],
  controllers: [GiuongController],
  providers: [GiuongService],
  exports: [GiuongService],
})
export class GiuongModule {}
