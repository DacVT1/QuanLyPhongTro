import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NguoiThue } from '../../entities/nguoi-thue.entity';
import { NguoiThueController } from './nguoi-thue.controller';
import { NguoiThueService } from './nguoi-thue.service';

@Module({
  imports: [TypeOrmModule.forFeature([NguoiThue])],
  controllers: [NguoiThueController],
  providers: [NguoiThueService],
  exports: [NguoiThueService],
})
export class NguoiThueModule {}
