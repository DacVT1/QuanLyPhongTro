import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HopDong } from '../../entities/hop-dong.entity';
import { HopDongController } from './hop-dong.controller';
import { HopDongService } from './hop-dong.service';

@Module({
  imports: [TypeOrmModule.forFeature([HopDong])],
  controllers: [HopDongController],
  providers: [HopDongService],
  exports: [HopDongService],
})
export class HopDongModule {}
