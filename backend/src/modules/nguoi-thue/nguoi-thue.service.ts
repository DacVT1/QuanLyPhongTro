import { Injectable, ConflictException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NguoiThue } from '../../entities/nguoi-thue.entity';
import { HopDong } from '../../entities/hop-dong.entity';

@Injectable()
export class NguoiThueService {
  constructor(
    @InjectRepository(NguoiThue)
    private readonly repository: Repository<NguoiThue>,

    @InjectRepository(HopDong)
    private readonly hopDongRepository: Repository<HopDong>,
  ) {}

  async findAll() {
    return this.repository.find({ relations: { hopDongs: true } });
  }

  async findOne(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: { hopDongs: true },
    });
  }

  async create(payload: Partial<NguoiThue>) {
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

    const hopDongCount = await this.hopDongRepository.count({
      where: {
        nguoiThue: {
          id,
        },
      },
    });

    if (hopDongCount > 0) {
      throw new ConflictException(
        'Không thể xóa người thuê vì người thuê đang có hợp đồng. Vui lòng xóa hợp đồng trước khi xóa người thuê.',
      );
    }

    await this.repository.remove(item);

    return item;
  }
}
