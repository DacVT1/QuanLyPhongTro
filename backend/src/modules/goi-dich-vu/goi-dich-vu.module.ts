import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GoiDichVu } from '../../entities/goi-dich-vu.entity';
import { GoiDichVuController } from './goi-dich-vu.controller';
import { GoiDichVuService } from './goi-dich-vu.service';

@Module({
  imports: [TypeOrmModule.forFeature([GoiDichVu])],
  controllers: [GoiDichVuController],
  providers: [GoiDichVuService],
  exports: [GoiDichVuService],
})
export class GoiDichVuModule {}
