import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { basename, join } from 'path';
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
    if (!tenantId) {
      throw new BadRequestException('Không xác định được tenant.');
    }

    return this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
      relations: {
        hopDongs: true,
      },
    });
  }

  async create(payload: Partial<NguoiThue>, tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException(
        'Không xác định được tenant từ tài khoản đăng nhập.',
      );
    }

    const tenant = await this.tenantRepository.findOne({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Không tìm thấy tenant.');
    }

    const { tenant: _ignoredTenant, id: _ignoredId, ...data } = payload as any;

    if (!data.hoTen?.trim()) {
      throw new BadRequestException('Họ tên là bắt buộc.');
    }

    const nguoiThue = this.repository.create({
      ...data,
      tenant,
    });

    return this.repository.save(nguoiThue);
  }

  async update(id: string, payload: Partial<NguoiThue>, tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException(
        'Không xác định được tenant từ tài khoản đăng nhập.',
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
      throw new NotFoundException('Không tìm thấy người thuê.');
    }

    // Không cho phép thay đổi tenant hoặc id từ frontend
    const { tenant: _ignoredTenant, id: _ignoredId, ...data } = payload as any;

    Object.assign(item, data);

    return this.repository.save(item);
  }

  async remove(id: string, tenantId: string) {
    const item = await this.repository.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
    });

    if (!item) {
      return null;
    }

    const hopDongCount = await this.hopDongRepository
      .createQueryBuilder('hopDong')
      .innerJoin('hopDong.nguoiThue', 'nguoiThue')
      .where('nguoiThue.id = :id', { id })
      .andWhere('hopDong.tenant_id = :tenantId', { tenantId })
      .getCount();

    if (hopDongCount > 0) {
      throw new ConflictException(
        'Không thể xóa người thuê vì người thuê đang có hợp đồng. Vui lòng xóa hợp đồng trước khi xóa người thuê.',
      );
    }

    // Lưu lại đường dẫn ảnh trước khi xóa bản ghi
    const cccdMatTruoc = item.cccdMatTruoc;
    const cccdMatSau = item.cccdMatSau;

    // Xóa người thuê trong database trước
    await this.repository.remove(item);

    // Xóa ảnh CCCD tương ứng
    const storageDir =
      process.env.STORAGE_DIR || join(process.cwd(), 'uploads');

    const nguoiThueUploadDir = join(storageDir, 'nguoi-thue');

    const deleteImage = async (imagePath?: string | null) => {
      if (!imagePath) {
        return;
      }

      try {
        const fileName = basename(imagePath);

        const filePath = join(nguoiThueUploadDir, fileName);

        await unlink(filePath);

        console.log(`Đã xóa ảnh CCCD: ${filePath}`);
      } catch (error: any) {
        // File không tồn tại thì không cần báo lỗi
        if (error?.code === 'ENOENT') {
          return;
        }

        console.error(`Không thể xóa ảnh CCCD: ${imagePath}`, error);
      }
    };

    await deleteImage(cccdMatTruoc);
    await deleteImage(cccdMatSau);

    return item;
  }
}
