import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Giuong } from '../../entities/giuong.entity'
import { Phong } from '../../entities/phong.entity'

import { GiuongController } from './giuong.controller'
import { GiuongService } from './giuong.service'
import { Tenant } from '../../entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Giuong,
      Phong,
      Tenant,
    ]),
  ],
  controllers: [GiuongController],
  providers: [GiuongService],
})
export class GiuongModule {}