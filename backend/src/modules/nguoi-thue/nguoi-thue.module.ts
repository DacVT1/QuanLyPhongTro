import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NguoiThue } from '../../entities/nguoi-thue.entity';
import { NguoiThueController } from './nguoi-thue.controller';
import { NguoiThueService } from './nguoi-thue.service';
import { HopDong } from '../../entities/hop-dong.entity';
import { AuthModule } from '../auth/auth.module';
import { Tenant } from '../../entities/tenant.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([NguoiThue, HopDong, Tenant])],
  controllers: [NguoiThueController],
  providers: [NguoiThueService],
  exports: [NguoiThueService],
})
export class NguoiThueModule {}
