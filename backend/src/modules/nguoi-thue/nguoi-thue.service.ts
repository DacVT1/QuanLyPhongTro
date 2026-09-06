import { Injectable, ConflictException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NguoiThue } from '../../entities/nguoi-thue.entity';
import { HopDong } from '../../entities/hop-dong.entity';
import { Tenant } from 'src/entities/tenant.entity';

@Injectable()
export class NguoiThueService {
  constructor(
    @InjectRepository(NguoiThue)
    private readonly repository: Repository<NguoiThue>,

    @InjectRepository(HopDong)
    private readonly hopDongRepository: Repository<HopDong>,

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
      relations: { hopDongs: true },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.repository.findOne({
      where: {
      tenant: {
        id: tenantId,
      },
    },
      relations: { hopDongs: true },
    });
  }

  async create(payload: Partial<NguoiThue>,tenantId: string,) {
    
    return this.repository.save(this.repository.create(payload));
  }

  async update(id: string, payload: Partial<NguoiThue>) {
    await this.repository.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: string) {
  const item = await this.repository.findOne({
    where: { id },
  });

  if (!item) {
    return null;
  }

  const hopDongCount = await this.hopDongRepository
    .createQueryBuilder('hopDong')
    .innerJoin('hopDong.nguoiThue', 'nguoiThue')
    .where('nguoiThue.id = :id', { id })
    .getCount();

  if (hopDongCount > 0) {
    throw new ConflictException(
      'Không thể xóa người thuê vì người thuê đang có hợp đồng. Vui lòng xóa hợp đồng trước khi xóa người thuê.',
    );
  }

  await this.repository.remove(item);

  return item;
}
}
