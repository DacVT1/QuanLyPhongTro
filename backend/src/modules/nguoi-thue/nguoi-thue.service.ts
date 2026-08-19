import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NguoiThue } from '../../entities/nguoi-thue.entity';

@Injectable()
export class NguoiThueService {
  constructor(
    @InjectRepository(NguoiThue)
    private readonly repository: Repository<NguoiThue>,
  ) {}

  async findAll() {
    return this.repository.find({ relations: { hopDongs: true } });
  }

  async findOne(id: string) {
    return this.repository.findOne({ where: { id }, relations: { hopDongs: true } });
  }

  async create(payload: Partial<NguoiThue>) {
    return this.repository.save(this.repository.create(payload));
  }

  async update(id: string, payload: Partial<NguoiThue>) {
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
