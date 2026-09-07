import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaiKhoan } from '../../entities/tai-khoan.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Tenant } from '../../entities/tenant.entity';
import { GoiDichVu } from 'src/entities/goi-dich-vu.entity';
import { Subscription } from 'src/entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaiKhoan, Tenant, GoiDichVu, Subscription]),

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'quan-ly-phong-tro-secret-key',
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],

  controllers: [AuthController],

  providers: [JwtAuthGuard, AuthService],

  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
