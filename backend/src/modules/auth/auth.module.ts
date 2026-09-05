import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaiKhoan } from '../../entities/tai-khoan.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Tenant } from 'src/entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaiKhoan,Tenant,]),

    JwtModule.register({
  secret: process.env.JWT_SECRET || 'quan-ly-phong-tro-secret-key',
  signOptions: {
    expiresIn: '1d',
  },
}),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    JwtAuthGuard,
    AuthService,
  ],

  exports: [
    AuthService,
    JwtModule,
  ],
})
export class AuthModule {}