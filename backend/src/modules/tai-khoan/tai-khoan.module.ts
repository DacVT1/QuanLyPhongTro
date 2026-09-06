import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaiKhoan } from '../../entities/tai-khoan.entity';
import { TaiKhoanController } from './tai-khoan.controller';
import { TaiKhoanService } from './tai-khoan.service';
import { AuthModule } from '../auth/auth.module';
import { Tenant } from '../../entities/tenant.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      TaiKhoan,
      Tenant,
    ]),
  ],
  controllers: [TaiKhoanController],
  providers: [TaiKhoanService],
  exports: [TaiKhoanService],
})
export class TaiKhoanModule {}