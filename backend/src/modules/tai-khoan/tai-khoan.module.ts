import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaiKhoan } from '../../entities/tai-khoan.entity';
import { TaiKhoanController } from './tai-khoan.controller';
import { TaiKhoanService } from './tai-khoan.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaiKhoan])],
  controllers: [TaiKhoanController],
  providers: [TaiKhoanService],
  exports: [TaiKhoanService],
})
export class TaiKhoanModule {}
