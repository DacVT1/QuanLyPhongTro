import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HopDong } from '../../entities/hop-dong.entity';

@Injectable()
export class HopDongService {
  constructor(
    @InjectRepository(HopDong)
    private readonly repository: Repository<HopDong>,
  ) {}

  async findAll() {
  return this.repository.find({
    relations: {
      giuong: {
        phong: {
          nhaTro: true,
        },
      },
      nguoiThue: true,
      hoaDons: true,
    },
  });
}

  async findOne(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: {
        giuong: {
          phong: {
            nhaTro: true,
          },
        },
        nguoiThue: true,
        hoaDons: true,
      },
    });
  }

  async create(payload: Partial<HopDong>) {
    return this.repository.save(this.repository.create(payload));
  }

  async update(id: string, payload: Partial<HopDong>) {
    await this.repository.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    if (!item) return null;
    await this.repository.remove(item);
    return item;
  }
}
