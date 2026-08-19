import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Giuong } from '../../entities/giuong.entity'
import { Phong } from '../../entities/phong.entity'

import { GiuongController } from './giuong.controller'
import { GiuongService } from './giuong.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Giuong,
      Phong,
    ]),
  ],
  controllers: [GiuongController],
  providers: [GiuongService],
})
export class GiuongModule {}