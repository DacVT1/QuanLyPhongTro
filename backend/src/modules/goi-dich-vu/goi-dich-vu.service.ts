import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { GoiDichVu } from '../../entities/goi-dich-vu.entity';

@Injectable()
export class GoiDichVuService {
  constructor(
    @InjectRepository(GoiDichVu)
    private readonly repository: Repository<GoiDichVu>,
  ) {}

  async findAll() {
    return this.repository.find({
      where: {
        trangThai: 'active',
      },
      order: {
        gia: 'ASC',
      },
    });
  }

  async findById(id: string) {
    const goi = await this.repository.findOne({
      where: { id },
    });

    if (!goi) {
      throw new NotFoundException('Không tìm thấy gói dịch vụ');
    }

    return goi;
  }
}
