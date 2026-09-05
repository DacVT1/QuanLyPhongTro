import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NhaTro } from '../../entities/nha-tro.entity';
import { Phong } from '../../entities/phong.entity';
import { Giuong } from '../../entities/giuong.entity';
import { HopDong } from '../../entities/hop-dong.entity';
import { HoaDon } from '../../entities/hoa-don.entity';
import { Tenant } from '../../entities/tenant.entity';

@Injectable()
export class NhaTroService {
  constructor(
    @InjectRepository(NhaTro)
    private readonly repository: Repository<NhaTro>,
  ) {}

  async findAll(tenantId: string) {
  return this.repository.find({
    where: {
      tenant: {
        id: tenantId,
      },
    },
    relations: {
      taiKhoan: true,
      phongs: true,
    },
  });
}

 async findOne(
  id: string,
  tenantId: string,
) {
  return this.repository.findOne({
    where: {
      id,
      tenant: {
        id: tenantId,
      },
    },
    relations: {
      taiKhoan: true,
      phongs: true,
    },
  });
}

  async create(
  payload: Partial<NhaTro>,
  tenantId: string,
) {
    const maNhaTro = String(payload.maNhaTro ?? '').trim();

    if (!maNhaTro) {
      throw new ConflictException('Mã nhà trọ là bắt buộc');
    }

    const existing = await this.repository.findOne({
      where: { maNhaTro },
    });

    if (existing) {
      throw new ConflictException(`Mã nhà trọ ${maNhaTro} đã tồn tại`);
    }

    const tenant = await this.repository.manager
  .getRepository(Tenant)
  .findOne({
    where: { id: tenantId },
  });

if (!tenant) {
  throw new NotFoundException(
    'Khong tim thay tenant',
  );
}

return this.repository.save(
  this.repository.create({
    ...payload,
    maNhaTro,
    tenant,
  }),
);
  }

  async update(id: string, payload: Partial<NhaTro>, tenantId: string) {
    const item = await this.findOne(
  id,
  tenantId,
);

    if (!item) {
      throw new NotFoundException('Khong tim thay nha tro');
    }

    if (payload.maNhaTro !== undefined) {
      const maNhaTro = String(payload.maNhaTro).trim();

      if (!maNhaTro) {
        throw new ConflictException('Mã nhà trọ là bắt buộc');
      }

      const existing = await this.repository.findOne({
        where: { maNhaTro },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Mã nhà trọ ${maNhaTro} đã tồn tại`);
      }

      payload.maNhaTro = maNhaTro;
    }

    await this.repository.update(id, payload);
    return this.findOne(id,tenantId);
  }

  async remove(id: string, tenantId: string) {
    const item = await this.findOne(id, tenantId);

    if (!item) {
      throw new NotFoundException('Khong tim thay nha tro');
    }

    const phongRepository = this.repository.manager.getRepository(Phong);
    const giuongRepository = this.repository.manager.getRepository(Giuong);
    const hopDongRepository = this.repository.manager.getRepository(HopDong);
    const hoaDonRepository = this.repository.manager.getRepository(HoaDon);

    const soPhong = await phongRepository
      .createQueryBuilder('phong')
      .where('phong.nha_tro_id = :nhaTroId', {
        nhaTroId: id,
      })
      .getCount();

    if (soPhong === 0) {
      await this.repository.remove(item);

      return {
        success: true,
        message: 'Xoa nha tro thanh cong',
        data: item,
      };
    }

    const phongIds = await phongRepository
      .createQueryBuilder('phong')
      .select('phong.id', 'id')
      .where('phong.nha_tro_id = :nhaTroId', {
        nhaTroId: id,
      })
      .getRawMany<{ id: string }>();

    const danhSachPhongId = phongIds.map((phong) => phong.id);

    const soGiuong = await giuongRepository
      .createQueryBuilder('giuong')
      .where('giuong.phong_id IN (:...phongIds)', {
        phongIds: danhSachPhongId,
      })
      .getCount();

    let danhSachGiuongId: string[] = [];

    if (soGiuong > 0) {
      const giuongIds = await giuongRepository
        .createQueryBuilder('giuong')
        .select('giuong.id', 'id')
        .where('giuong.phong_id IN (:...phongIds)', {
          phongIds: danhSachPhongId,
        })
        .getRawMany<{ id: string }>();

      danhSachGiuongId = giuongIds.map((giuong) => giuong.id);
    }

    let soHopDong = 0;

    if (danhSachGiuongId.length > 0) {
      soHopDong = await hopDongRepository
        .createQueryBuilder('hopDong')
        .where('hopDong.giuong_id IN (:...giuongIds)', {
          giuongIds: danhSachGiuongId,
        })
        .getCount();
    }

    let danhSachHopDongId: string[] = [];

    if (soHopDong > 0) {
      const hopDongIds = await hopDongRepository
        .createQueryBuilder('hopDong')
        .select('hopDong.id', 'id')
        .where('hopDong.giuong_id IN (:...giuongIds)', {
          giuongIds: danhSachGiuongId,
        })
        .getRawMany<{ id: string }>();

      danhSachHopDongId = hopDongIds.map((hopDong) => hopDong.id);
    }

    let soHoaDon = 0;

    if (danhSachHopDongId.length > 0) {
      soHoaDon = await hoaDonRepository
        .createQueryBuilder('hoaDon')
        .where('hoaDon.hop_dong_id IN (:...hopDongIds)', {
          hopDongIds: danhSachHopDongId,
        })
        .getCount();
    }

    throw new ConflictException({
      success: false,
      code: 'NHA_TRO_HAS_DATA',
      message: 'Khong the xoa nha tro vi dang co du lieu lien quan',
      data: {
        nhaTroId: id,
        tenNhaTro: item.tenNhaTro,
        soPhong,
        soGiuong,
        soHopDong,
        soHoaDon,
      },
    });
  }
}
