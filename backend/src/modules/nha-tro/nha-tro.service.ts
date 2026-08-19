import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NhaTro } from '../../entities/nha-tro.entity';

@Injectable()
export class NhaTroService {
  constructor(
    @InjectRepository(NhaTro)
    private readonly repository: Repository<NhaTro>,
  ) {}

  async findAll() {
    return this.repository.find({ relations: { taiKhoan: true, phongs: true } });
  }

  async findOne(id: string) {
    return this.repository.findOne({ where: { id }, relations: { taiKhoan: true, phongs: true } });
  }

  async create(payload: Partial<NhaTro>) {
    return this.repository.save(this.repository.create(payload));
  }

  async update(id: string, payload: Partial<NhaTro>) {
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
