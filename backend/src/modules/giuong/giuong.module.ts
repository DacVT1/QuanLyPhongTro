import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Giuong } from '../../entities/giuong.entity'
import { Phong } from '../../entities/phong.entity'

import { GiuongController } from './giuong.controller'
import { GiuongService } from './giuong.service'
import { Tenant } from '../../entities/tenant.entity';
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Giuong,
      Phong,
      Tenant,
    ]),
    AuthModule,
  ],
  controllers: [GiuongController],
  providers: [GiuongService],
})
export class GiuongModule {}