import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaiKhoan } from '../../entities/tai-khoan.entity';
import { NhaTro } from '../../entities/nha-tro.entity';
import { Phong } from '../../entities/phong.entity';
import { Giuong } from '../../entities/giuong.entity';

import { HopDongPublicController } from './hop-dong-public.controller';
import { HopDongPublicService } from './hop-dong-public.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaiKhoan, NhaTro, Phong, Giuong])],

  controllers: [HopDongPublicController],

  providers: [HopDongPublicService],
})
export class HopDongPublicModule {}
