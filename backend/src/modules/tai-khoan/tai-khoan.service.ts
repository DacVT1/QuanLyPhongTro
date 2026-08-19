import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaiKhoan } from '../../entities/tai-khoan.entity';

@Injectable()
export class TaiKhoanService {
  constructor(
    @InjectRepository(TaiKhoan)
    private readonly repository: Repository<TaiKhoan>,
  ) {}

  async findAll() {
    return this.repository.find({ relations: { nhaTros: true } });
  }

  async findOne(id: string) {
    return this.repository.findOne({ where: { id }, relations: { nhaTros: true } });
  }

  async create(payload: Partial<TaiKhoan>) {
    return this.repository.save(this.repository.create(payload));
  }

  async update(id: string, payload: Partial<TaiKhoan>) {
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
