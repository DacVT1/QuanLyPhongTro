import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HoaDon } from '../../entities/hoa-don.entity';
import { HopDong } from '../../entities/hop-dong.entity';
import { Tenant } from '../../entities/tenant.entity';

import { HoaDonController } from './hoa-don.controller';
import { HoaDonService } from './hoa-don.service';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HoaDon, HopDong, Tenant]),
    AuthModule,
    EmailModule,
  ],
  controllers: [HoaDonController],
  providers: [HoaDonService],
  exports: [HoaDonService],
})
export class HoaDonModule {}
