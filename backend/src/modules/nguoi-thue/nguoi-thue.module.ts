import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NguoiThue } from '../../entities/nguoi-thue.entity';
import { NguoiThueController } from './nguoi-thue.controller';
import { NguoiThueService } from './nguoi-thue.service';
import { HopDong } from '../../entities/hop-dong.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NguoiThue, HopDong])],
  controllers: [NguoiThueController],
  providers: [NguoiThueService],
  exports: [NguoiThueService],
})
export class NguoiThueModule {}
