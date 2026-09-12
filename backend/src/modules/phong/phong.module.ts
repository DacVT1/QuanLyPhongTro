import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Phong } from '../../entities/phong.entity'
import { NhaTro } from '../../entities/nha-tro.entity'

import { PhongController } from './phong.controller'
import { PhongService } from './phong.service'
import { Tenant } from 'src/entities/tenant.entity'
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
  TypeOrmModule.forFeature([
    Phong,
    NhaTro,
    Tenant,
  ]),
  AuthModule,
],
  controllers: [
    PhongController,
  ],
  providers: [
    PhongService,
  ],
})
export class PhongModule {}