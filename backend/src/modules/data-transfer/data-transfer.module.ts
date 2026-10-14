import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { DataTransferController } from './data-transfer.controller';
import { DataTransferService } from './data-transfer.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([])],
  controllers: [DataTransferController],
  providers: [DataTransferService],
})
export class DataTransferModule {}
