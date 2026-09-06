import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaiKhoan } from '../../entities/tai-khoan.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TaiKhoanService {
  constructor(
    @InjectRepository(TaiKhoan)
    private readonly repository: Repository<TaiKhoan>,
  ) {}

  async findAll(tenantId: string) {
    return this.repository.find({
      where: {
        tenant: {
          id: tenantId,
        },
      },
      relations: { nhaTros: true },
    });
  }

  async findOne(id: string,tenantId: string) {
    return this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
      relations: { nhaTros: true },
    });
  }

  async create(payload: Partial<TaiKhoan>, tenantId: string) {
  const data = { ...payload };

  if (data.passwordHash) {
    data.passwordHash = await bcrypt.hash(
      data.passwordHash,
      10,
    );
  }

  return this.repository.save(
    this.repository.create(data),
  );
}

  async update(id: string, payload: Partial<TaiKhoan>, tenantId: string) {
    await this.repository.update(id, payload);
    return this.findOne(id,tenantId);
  }

  async remove(id: string, tenantId: string) {
    const item = await this.findOne(id, tenantId);
    if (!item) return null;
    await this.repository.remove(item);
    return item;
  }
}
