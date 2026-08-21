import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.repository.find({
      relations: {
        hopDong: {
          nguoiThue: true,
        },
      },
    });
  }

  async findOne(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: {
        hopDong: {
          nguoiThue: true,
        },
      },
    });
  }

async create(payload: Partial<HoaDon>) {
  if (payload.trangThai === 'da_thanh_toan') {
    payload.ngayNop = new Date();
  } else {
    payload.ngayNop = null;
  }

  return this.repository.save(
    this.repository.create(payload),
  );
}

async update(id: string, payload: Partial<HoaDon>) {
  const hoaDon = await this.repository.findOne({
    where: { id },
  });

  if (!hoaDon) {
    throw new NotFoundException('Không tìm thấy hóa đơn');
  }

  // Chỉ xử lý ngày nộp khi thực sự thay đổi trạng thái
  if (
    payload.trangThai === 'da_thanh_toan' &&
    hoaDon.trangThai !== 'da_thanh_toan'
  ) {
    payload.ngayNop = new Date();
  }

  if (payload.trangThai === 'chua_thanh_toan') {
    payload.ngayNop = null;
  }

  await this.repository.update(id, payload);

  return this.findOne(id);
}
  async remove(id: string) {
    const result = await this.repository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Không tìm thấy hóa đơn để xóa');
    }

    return {
      message: 'Xóa hóa đơn thành công',
      id,
    };
  }
}
