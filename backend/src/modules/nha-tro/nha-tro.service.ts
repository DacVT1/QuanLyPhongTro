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

@Injectable()
export class NhaTroService {
  constructor(
    @InjectRepository(NhaTro)
    private readonly repository: Repository<NhaTro>,
  ) {}

  async findAll() {
    return this.repository.find({
      relations: {
        taiKhoan: true,
        phongs: true,
      },
    });
  }

  async findOne(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: {
        taiKhoan: true,
        phongs: true,
      },
    });
  }

  async create(payload: Partial<NhaTro>) {
    return this.repository.save(this.repository.create(payload));
  }

  async update(id: string, payload: Partial<NhaTro>) {
    await this.repository.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: string) {
    // 1. Kiểm tra nhà trọ có tồn tại không
    const item = await this.findOne(id);

    if (!item) {
      throw new NotFoundException('Khong tim thay nha tro');
    }

    // Lấy các Repository thông qua EntityManager hiện tại.
    // Không cần thêm các Repository này vào NhaTroModule.
    const phongRepository = this.repository.manager.getRepository(Phong);
    const giuongRepository = this.repository.manager.getRepository(Giuong);
    const hopDongRepository = this.repository.manager.getRepository(HopDong);
    const hoaDonRepository = this.repository.manager.getRepository(HoaDon);

    // 2. Đếm số phòng thuộc nhà trọ
    const soPhong = await phongRepository
      .createQueryBuilder('phong')
      .where('phong.nha_tro_id = :nhaTroId', {
        nhaTroId: id,
      })
      .getCount();

    // Nếu không có phòng thì các dữ liệu bên dưới cũng không thể
    // liên kết trực tiếp với nhà trọ thông qua cấu trúc hiện tại.
    if (soPhong === 0) {
      await this.repository.remove(item);

      return {
        success: true,
        message: 'Xoa nha tro thanh cong',
        data: item,
      };
    }

    // 3. Lấy danh sách ID phòng thuộc nhà trọ
    const phongIds = await phongRepository
      .createQueryBuilder('phong')
      .select('phong.id', 'id')
      .where('phong.nha_tro_id = :nhaTroId', {
        nhaTroId: id,
      })
      .getRawMany<{ id: string }>();

    const danhSachPhongId = phongIds.map((phong) => phong.id);

    // 4. Đếm số giường thuộc các phòng
    const soGiuong = await giuongRepository
      .createQueryBuilder('giuong')
      .where('giuong.phong_id IN (:...phongIds)', {
        phongIds: danhSachPhongId,
      })
      .getCount();

    // 5. Lấy danh sách ID giường
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

    // 6. Đếm số hợp đồng
    let soHopDong = 0;

    if (danhSachGiuongId.length > 0) {
      soHopDong = await hopDongRepository
        .createQueryBuilder('hopDong')
        .where('hopDong.giuong_id IN (:...giuongIds)', {
          giuongIds: danhSachGiuongId,
        })
        .getCount();
    }

    // 7. Lấy danh sách ID hợp đồng
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

    // 8. Đếm số hóa đơn
    let soHoaDon = 0;

    if (danhSachHopDongId.length > 0) {
      soHoaDon = await hoaDonRepository
        .createQueryBuilder('hoaDon')
        .where('hoaDon.hop_dong_id IN (:...hopDongIds)', {
          hopDongIds: danhSachHopDongId,
        })
        .getCount();
    }

    // 9. Không cho phép xóa nếu còn dữ liệu liên quan
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