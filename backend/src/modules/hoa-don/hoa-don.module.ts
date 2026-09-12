import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HoaDon } from '../../entities/hoa-don.entity';
import { HopDong } from '../../entities/hop-dong.entity';
import { Tenant } from '../../entities/tenant.entity';

import { HoaDonController } from './hoa-don.controller';
import { HoaDonService } from './hoa-don.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HoaDon,
      HopDong,
      Tenant,
    ]),
    AuthModule,
  ],
  controllers: [
    HoaDonController,
  ],
  providers: [
    HoaDonService,
  ],
  exports: [
    HoaDonService,
  ],
})
export class HoaDonModule {}