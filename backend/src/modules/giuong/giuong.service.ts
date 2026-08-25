import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Giuong } from '../../entities/giuong.entity'
import { Phong } from '../../entities/phong.entity'

@Injectable()
export class GiuongService {
  constructor(
    @InjectRepository(Giuong)
    private readonly repository: Repository<Giuong>,

    @InjectRepository(Phong)
    private readonly phongRepository: Repository<Phong>,
    
  ) {}
private getTrangThaiTheoHopDong(
  hopDongs: any[] = [],
): 'da_thue' | 'chua_thue' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const coHopDongHieuLuc = hopDongs.some((hopDong) => {
    // Hợp đồng phải đang active
    if (hopDong.trangThai !== 'active') {
      return false;
    }

    if (!hopDong.ngayBatDau) {
      return false;
    }

    const ngayBatDau = new Date(hopDong.ngayBatDau);
    ngayBatDau.setHours(0, 0, 0, 0);

    // Chưa đến ngày bắt đầu
    if (ngayBatDau > today) {
      return false;
    }

    // Không có ngày kết thúc => vẫn đang thuê
    if (!hopDong.ngayKetThuc) {
      return true;
    }

    const ngayKetThuc = new Date(hopDong.ngayKetThuc);
    ngayKetThuc.setHours(0, 0, 0, 0);

    // Ngày hiện tại phải nhỏ hơn ngày kết thúc
    return today < ngayKetThuc;
  });

  return coHopDongHieuLuc ? 'da_thue' : 'chua_thue';
}

private mapTrangThai(giuong: Giuong) {
  const status = this.getTrangThaiTheoHopDong(
    giuong.hopDongs ?? [],
  );

  return {
    ...giuong,
    trangThai: status,
    status,
  };
}

async findAll() {
  const giuongs = await this.repository.find({
    relations: {
      phong: {
        nhaTro: true,
      },
      hopDongs: true,
    },
  });

  return giuongs.map((giuong) =>
    this.mapTrangThai(giuong),
  );
}

async findOne(id: string) {
  const giuong = await this.repository.findOne({
    where: { id },
    relations: {
      phong: {
        nhaTro: true,
      },
      hopDongs: true,
    },
  });

  return giuong
    ? this.mapTrangThai(giuong)
    : null;
}

  async create(payload: Partial<Giuong>) {
    if (!payload.phong?.id) {
      throw new BadRequestException('Phòng là bắt buộc.')
    }

    const phong = await this.phongRepository.findOne({
      where: {
        id: payload.phong.id,
      },
    })

    if (!phong) {
      throw new NotFoundException('Không tìm thấy phòng.')
    }

const giuongSo = Number(payload.giuongSo)

if (!Number.isInteger(giuongSo) || giuongSo < 1) {
  throw new BadRequestException(
    'Giường số phải là số nguyên lớn hơn hoặc bằng 1.',
  )
}

const maGiuong = `${phong.maPhong}_G${giuongSo}`

const giaGiuong = Number(payload.giaGiuong ?? 0)

if (!Number.isInteger(giaGiuong) || giaGiuong < 0) {
  throw new BadRequestException(
    'Giá giường phải là số nguyên lớn hơn hoặc bằng 0.',
  )
}

const giuong = this.repository.create({
  maGiuong,
  giuongSo,
  giaGiuong,
  datCocSom: Boolean(payload.datCocSom),
  trangThai: "trong",
  phong,
})

return this.repository.save(giuong)
  }

  async update(id: string, payload: Partial<Giuong>) {
    const item = await this.repository.findOne({
      where: { id },
      relations: {
        phong: true,
      },
    })

    if (!item) {
      throw new NotFoundException('Không tìm thấy giường.')
    }

if (payload.giuongSo !== undefined) {
  const giuongSo = Number(payload.giuongSo)

  if (!Number.isInteger(giuongSo) || giuongSo < 1) {
    throw new BadRequestException(
      'Giường số phải là số nguyên lớn hơn hoặc bằng 1.',
    )
  }

  item.giuongSo = giuongSo

  if (item.phong) {
    item.maGiuong = `${item.phong.maPhong}_G${giuongSo}`
  }
}

    if (payload.trangThai !== undefined) {
  if (
    !["trong", "da_thue", "sap_tra_tro"].includes(
      payload.trangThai,
    )
  ) {
    throw new BadRequestException(
      "Trạng thái giường không hợp lệ.",
    );
  }

  item.trangThai = payload.trangThai;
}
if (payload.datCocSom !== undefined) {
  item.datCocSom = Boolean(payload.datCocSom);
}
    if (payload.giaGiuong !== undefined) {
  const giaGiuong = Number(payload.giaGiuong)

  if (!Number.isInteger(giaGiuong) || giaGiuong < 0) {
    throw new BadRequestException(
      'Giá giường phải là số nguyên lớn hơn hoặc bằng 0.',
    )
  }

  item.giaGiuong = giaGiuong
}
    if (payload.phong?.id) {
      const phong = await this.phongRepository.findOne({
        where: {
          id: payload.phong.id,
        },
      })

      if (!phong) {
        throw new NotFoundException('Không tìm thấy phòng.')
      }

      if (payload.phong?.id) {
  const phong = await this.phongRepository.findOne({
    where: {
      id: payload.phong.id,
    },
  })

  if (!phong) {
    throw new NotFoundException('Không tìm thấy phòng.')
  }

  item.phong = phong

  item.maGiuong =
    `${phong.maPhong}_G${item.giuongSo}`
}
    }

    return this.repository.save(item)
  }

  async remove(id: string) {
  const item = await this.findOne(id);

  if (!item) {
    throw new NotFoundException('Không tìm thấy giường.');
  }

  const soHopDong = item.hopDongs?.length ?? 0;

  if (soHopDong > 0) {
    throw new ConflictException({
      message: `Không thể xóa giường này! Giường đang được sử dụng trong ${soHopDong} hợp đồng. Vui lòng xóa hoặc xử lý hợp đồng liên quan trước khi xóa giường.`,
      soHopDong,
      maGiuong: item.maGiuong,
      maPhong: item.phong?.maPhong ?? "",
    });
  }

  await this.repository.remove(item);

  return item;
}
}