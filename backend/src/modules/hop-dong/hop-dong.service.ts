import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HopDong } from '../../entities/hop-dong.entity';
import { Giuong } from '../../entities/giuong.entity';

@Injectable()
export class HopDongService {
  constructor(
    @InjectRepository(HopDong)
    private readonly repository: Repository<HopDong>,

    @InjectRepository(Giuong)
    private readonly giuongRepository: Repository<Giuong>,
  ) {}

  async findAll() {
    return this.repository.find({
      relations: {
        giuong: {
          phong: {
            nhaTro: true,
          },
        },
        nguoiThue: true,
        hoaDons: true,
      },
    });
  }

  async findOne(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: {
        giuong: {
          phong: {
            nhaTro: true,
          },
        },
        nguoiThue: true,
        hoaDons: true,
      },
    });
  }

  /**
   * Cập nhật trạng thái giường theo các hợp đồng của giường.
   *
   * active              -> da_thue
   * sap_het_hieu_luc    -> sap_tra_tro
   * Không còn HĐ hiệu lực -> trong
   */
  private async capNhatTrangThaiGiuong(
    giuongId: string,
  ) {
    const giuong =
      await this.giuongRepository.findOne({
        where: {
          id: giuongId,
        },
        relations: {
          hopDongs: true,
        },
      });

    if (!giuong) {
      return;
    }

    const hopDongs = giuong.hopDongs ?? [];

    // Có hợp đồng đang có hiệu lực
    const coHopDongHieuLuc =
      hopDongs.some(
        (hopDong) =>
          hopDong.trangThai === 'active',
      );

    if (coHopDongHieuLuc) {
      giuong.trangThai = 'da_thue';

      await this.giuongRepository.save(
        giuong,
      );

      return;
    }

    // Không còn hợp đồng có hiệu lực,
    // kiểm tra hợp đồng sắp hết hiệu lực
    const coHopDongSapHetHieuLuc =
      hopDongs.some(
        (hopDong) =>
          hopDong.trangThai ===
          'sap_het_hieu_luc',
      );

    if (coHopDongSapHetHieuLuc) {
      giuong.trangThai = 'sap_tra_tro';

      await this.giuongRepository.save(
        giuong,
      );

      return;
    }

    // Không có hợp đồng hiệu lực
    // hoặc tất cả hợp đồng đã hết hiệu lực
    giuong.trangThai = 'trong';

    await this.giuongRepository.save(
      giuong,
    );
  }

  async create(payload: Partial<HopDong>) {
    const hopDong =
      this.repository.create(payload);

    const savedHopDong =
      await this.repository.save(hopDong);

    // Khi tạo HĐ mới có hiệu lực,
    // cập nhật giường thành Đã thuê.
    if (
      savedHopDong.giuong?.id &&
      savedHopDong.trangThai === 'active'
    ) {
      await this.capNhatTrangThaiGiuong(
        savedHopDong.giuong.id,
      );
    }

    return this.findOne(savedHopDong.id);
  }

  async update(
    id: string,
    payload: Partial<HopDong>,
  ) {
    const hopDong =
      await this.repository.findOne({
        where: { id },
        relations: {
          giuong: true,
        },
      });

    if (!hopDong) {
      throw new NotFoundException(
        'Không tìm thấy hợp đồng.',
      );
    }

    const giuongCuId =
      hopDong.giuong?.id;

    Object.assign(
      hopDong,
      payload,
    );

    const savedHopDong =
      await this.repository.save(
        hopDong,
      );

    // Nếu thay đổi giường của hợp đồng,
    // cập nhật lại giường cũ.
    if (
      giuongCuId &&
      savedHopDong.giuong?.id !== giuongCuId
    ) {
      await this.capNhatTrangThaiGiuong(
        giuongCuId,
      );
    }

    // Cập nhật giường mới.
    if (savedHopDong.giuong?.id) {
      await this.capNhatTrangThaiGiuong(
        savedHopDong.giuong.id,
      );
    }

    return this.findOne(
      savedHopDong.id,
    );
  }

async remove(id: string) {
  const hopDong =
    await this.repository.findOne({
      where: { id },
      relations: {
        giuong: true,
        hoaDons: true,
      },
    });

  if (!hopDong) {
    return null;
  }

  const giuongId =
    hopDong.giuong?.id;

  await this.repository.remove(
    hopDong,
  );

  if (giuongId) {
    await this.capNhatTrangThaiGiuong(
      giuongId,
    );
  }

  return hopDong;
}
}