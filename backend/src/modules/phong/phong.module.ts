import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Phong } from '../../entities/phong.entity'
import { NhaTro } from '../../entities/nha-tro.entity'

import { PhongController } from './phong.controller'
import { PhongService } from './phong.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Phong,
      NhaTro,
    ]),
  ],
  controllers: [
    PhongController,
  ],
  providers: [
    PhongService,
  ],
})
export class PhongModule {}