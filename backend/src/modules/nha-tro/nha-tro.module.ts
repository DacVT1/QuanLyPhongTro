import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NhaTro } from '../../entities/nha-tro.entity';
import { NhaTroController } from './nha-tro.controller';
import { NhaTroService } from './nha-tro.service';

@Module({
  imports: [TypeOrmModule.forFeature([NhaTro])],
  controllers: [NhaTroController],
  providers: [NhaTroService],
  exports: [NhaTroService],
})
export class NhaTroModule {}
