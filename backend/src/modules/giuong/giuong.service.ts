import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Giuong } from '../../entities/giuong.entity';

@Injectable()
export class GiuongService {
  constructor(
    @InjectRepository(Giuong)
    private readonly repository: Repository<Giuong>,
  ) {}

  async findAll() {
    return this.repository.find({ relations: { phong: true, hopDongs: true } });
  }

  async findOne(id: string) {
    return this.repository.findOne({ where: { id }, relations: { phong: true, hopDongs: true } });
  }

  async create(payload: Partial<Giuong>) {
    return this.repository.save(this.repository.create(payload));
  }

  async update(id: string, payload: Partial<Giuong>) {
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
