import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaiKhoan } from '../../entities/tai-khoan.entity';
import * as bcrypt from 'bcrypt';
import { Tenant } from 'src/entities/tenant.entity';

@Injectable()
export class TaiKhoanService {
  constructor(
    @InjectRepository(TaiKhoan)
    private readonly repository: Repository<TaiKhoan>,

    @InjectRepository(Tenant)
private readonly tenantRepository: Repository<Tenant>,
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

  async create(
  payload: Partial<TaiKhoan>,
  tenantId: string,
) {
  if (!tenantId) {
    throw new BadRequestException(
      'Không xác định được tenant.',
    );
  }

  const tenant = await this.tenantRepository.findOne({
    where: {
      id: tenantId,
    },
  });

  if (!tenant) {
    throw new NotFoundException(
      'Không tìm thấy tenant.',
    );
  }

  const {
    id: _ignoredId,
    tenant: _ignoredTenant,
    ...data
  } = payload as any;

  if (data.passwordHash) {
    data.passwordHash = await bcrypt.hash(
      data.passwordHash,
      10,
    );
  }

  const taiKhoan = this.repository.create({
    ...data,
    tenant,
  });

  return this.repository.save(taiKhoan);
}

  async update(
  id: string,
  payload: Partial<TaiKhoan>,
  tenantId: string,
) {
  if (!tenantId) {
    throw new BadRequestException(
      'Không xác định được tenant.',
    );
  }

  const item = await this.repository.findOne({
    where: {
      id,
      tenant: {
        id: tenantId,
      },
    },
  });

  if (!item) {
    throw new NotFoundException(
      'Không tìm thấy tài khoản.',
    );
  }

  const {
    id: _ignoredId,
    tenant: _ignoredTenant,
    ...data
  } = payload as any;

  Object.assign(item, data);

  return this.repository.save(item);
}

  async remove(id: string, tenantId: string) {
    const item = await this.findOne(id, tenantId);
    if (!item) return null;
    await this.repository.remove(item);
    return item;
  }
}
