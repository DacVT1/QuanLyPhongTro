import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HopDong } from '../../entities/hop-dong.entity';
import { Giuong } from '../../entities/giuong.entity';
import { Tenant } from 'src/entities/tenant.entity';
import { NguoiThue } from '../../entities/nguoi-thue.entity';

@Injectable()
export class HopDongService {
  constructor(
    @InjectRepository(HopDong)
    private readonly repository: Repository<HopDong>,

    @InjectRepository(Giuong)
    private readonly giuongRepository: Repository<Giuong>,

    @InjectRepository(NguoiThue)
    private readonly nguoiThueRepository: Repository<NguoiThue>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async findAll(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException(
        'Không xác định được tenant.',
      );
    }
    return this.repository.find({
      where: {
        tenant: {
          id: tenantId,
        },
      },
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

  async findOne(id: string, tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException(
        'Không xác định được tenant.',
      );
    }
    return this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
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
    tenantId: string,
  ) {
    const giuong =
      await this.giuongRepository.findOne({
        where: {
          id: giuongId,
          tenant: {
            id: tenantId,
          },
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

  async create(payload: Partial<HopDong>,tenantId: string,) {
    if (!tenantId) {
      throw new BadRequestException(
        'Không xác định được tenant từ tài khoản đăng nhập.',
      );
    }

    const tenant =
      await this.tenantRepository.findOne({
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
      giuong: payloadGiuong,
      nguoiThue: payloadNguoiThue,
      ...data
    } = payload as any;

    /**
     * 3. Bắt buộc phải chọn giường
     */
    if (!payloadGiuong?.id) {
      throw new BadRequestException(
        'Vui lòng chọn giường.',
      );
    }
/**
     * 4. Bắt buộc phải chọn người thuê
     */
    if (!payloadNguoiThue?.id) {
      throw new BadRequestException(
        'Vui lòng chọn người thuê.',
      );
    }


    const giuong =
      await this.giuongRepository.findOne({
        where: {
          id: payloadGiuong.id,
          tenant: {
            id: tenantId,
          },
        },
        relations: {
          hopDongs: true,
        },
      });

    if (!giuong) {
      throw new NotFoundException(
        'Không tìm thấy giường hoặc giường không thuộc nhà trọ của bạn.',
      );
    }
    /**
     * 6. Tìm người thuê thuộc tenant hiện tại
     */
    const nguoiThue =
      await this.nguoiThueRepository.findOne({
        where: {
          id: payloadNguoiThue.id,
          tenant: {
            id: tenantId,
          },
        },
      });

    if (!nguoiThue) {
      throw new NotFoundException(
        'Không tìm thấy người thuê hoặc người thuê không thuộc nhà trọ của bạn.',
      );
    }

    /**
     * 7. Không cho phép một giường
     *    có nhiều hợp đồng active
     */
    const coHopDongActive =
      (giuong.hopDongs ?? []).some(
        (hopDong) =>
          hopDong.trangThai === 'active',
      );

    if (coHopDongActive) {
      throw new ConflictException(
        'Giường này đang có hợp đồng còn hiệu lực.',
      );
    }
    /**
     * 8. Tạo hợp đồng
     *
     * QUAN TRỌNG:
     * tenant, giuong, nguoiThue
     * được gán từ backend.
     *
     * Không sử dụng payload trực tiếp.
     */
    const hopDong =
      this.repository.create({
        ...data,
        tenant,
        giuong,
        nguoiThue,
      });

    /**
     * 9. Lưu database
     */

    const savedHopDong =
      await this.repository.save(hopDong);
    /**
     * 10. Cập nhật trạng thái giường
     */
    await this.capNhatTrangThaiGiuong(
      giuong.id,
      tenantId,
    );
    // Khi tạo HĐ mới có hiệu lực,
    // cập nhật giường thành Đã thuê.
    await this.capNhatTrangThaiGiuong(
      giuong.id,
      tenantId,
    );

    return this.findOne(savedHopDong.id, tenantId);
  }

  async update(
    id: string,
    payload: Partial<HopDong>,
    tenantId: string,
  ) {
    const hopDong =
      await this.repository.findOne({
        where: {
          id,
          tenant: {
            id: tenantId,
          },
        },
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
        tenantId
      );
    }

    // Cập nhật giường mới.
    if (savedHopDong.giuong?.id) {
      await this.capNhatTrangThaiGiuong(
        savedHopDong.giuong.id,
        tenantId
      );
    }

    return this.findOne(
      savedHopDong.id,
      tenantId
    );
  }

async remove(id: string, tenantId: string) {
  const hopDong =
    await this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
      relations: {
        giuong: true,
        hoaDons: true,
      },
    });

  if (!hopDong) {
    throw new NotFoundException(
      'Không tìm thấy hợp đồng.',
    );
  }

  // Kiểm tra Hợp đồng có đang được Hóa đơn sử dụng hay không
  if (
  hopDong.hoaDons &&
  hopDong.hoaDons.length > 0
) {
  const maHoaDon = hopDong.hoaDons
    .map((hoaDon) => hoaDon.maHoaDon)
    .filter(Boolean)
    .join(', ');

  throw new BadRequestException(
    `Hợp đồng đang nằm trong hóa đơn ${maHoaDon} và không thể xóa được`,
  );
}

  const giuongId =
    hopDong.giuong?.id;

  await this.repository.remove(
    hopDong,
  );

  // Sau khi xóa Hợp đồng,
  // cập nhật lại trạng thái Giường.
  if (giuongId) {
    await this.capNhatTrangThaiGiuong(
      giuongId,
      tenantId
    );
  }

  return hopDong;
}
}