import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phong } from '../../entities/phong.entity';
import { PhongController } from './phong.controller';
import { PhongService } from './phong.service';

@Module({
  imports: [TypeOrmModule.forFeature([Phong])],
  controllers: [PhongController],
  providers: [PhongService],
  exports: [PhongService],
})
export class PhongModule {}
