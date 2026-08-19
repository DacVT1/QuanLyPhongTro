import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HoaDon } from '../../entities/hoa-don.entity';

@Injectable()
export class HoaDonService {
  constructor(
    @InjectRepository(HoaDon)
    private readonly repository: Repository<HoaDon>,
  ) {}

  async findAll() {
    return this.repository.find({ relations: { hopDong: true } });
  }

  async findOne(id: string) {
    return this.repository.findOne({ where: { id }, relations: { hopDong: true } });
  }

  async create(payload: Partial<HoaDon>) {
    return this.repository.save(this.repository.create(payload));
  }

  async update(id: string, payload: Partial<HoaDon>) {
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
