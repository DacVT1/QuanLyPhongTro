import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Giuong } from '../../entities/giuong.entity';
import { HoaDon } from '../../entities/hoa-don.entity';
import { HopDong } from '../../entities/hop-dong.entity';
import { NhaTro } from '../../entities/nha-tro.entity';
import { Phong } from '../../entities/phong.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(NhaTro)
    private readonly nhaTroRepository: Repository<NhaTro>,
    @InjectRepository(Phong)
    private readonly phongRepository: Repository<Phong>,
    @InjectRepository(Giuong)
    private readonly giuongRepository: Repository<Giuong>,
    @InjectRepository(HopDong)
    private readonly hopDongRepository: Repository<HopDong>,
    @InjectRepository(HoaDon)
    private readonly hoaDonRepository: Repository<HoaDon>,
  ) {}

  async getSummary(tenantId: string) {
  if (!tenantId) {
    throw new BadRequestException(
      'Không xác định được tenant.',
    );
  }

  const totalNhaTro =
    await this.nhaTroRepository.count({
      where: {
        tenant: { id: tenantId },
      },
    });

  const totalPhong =
    await this.phongRepository.count({
      where: {
        tenant: { id: tenantId },
      },
    });

  const totalGiuong =
    await this.giuongRepository.count({
      where: {
        tenant: { id: tenantId },
      },
    });

  const totalHopDong =
    await this.hopDongRepository.count({
      where: {
        tenant: { id: tenantId },
      },
    });

  const totalHoaDon =
    await this.hoaDonRepository.count({
      where: {
        tenant: { id: tenantId },
      },
    });

  return {
    totalNhaTro,
    totalPhong,
    totalGiuong,
    totalHopDong,
    totalHoaDon,
    tongSoPhong: totalPhong,
    tongSoGiuong: totalGiuong,
  };
}
}
