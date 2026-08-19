import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Phong } from '../../entities/phong.entity'
import { NhaTro } from '../../entities/nha-tro.entity'

@Injectable()
export class PhongService {
  constructor(
    @InjectRepository(Phong)
    private readonly repository: Repository<Phong>,

    @InjectRepository(NhaTro)
    private readonly nhaTroRepository: Repository<NhaTro>,
  ) {}

  async findAll() {
    return this.repository.find({
      relations: {
        nhaTro: true,
        giuongs: true,
      },
    })
  }

  async findOne(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: {
        nhaTro: true,
        giuongs: true,
      },
    })
  }

  private normalizeFloor(value: unknown): string {
    const floor = String(value ?? '').trim()
    if (!/^\d+$/.test(floor) || Number(floor) < 1) {
      throw new ConflictException('Tầng số phải là số nguyên lớn hơn hoặc bằng 1')
    }
    return floor
  }

  private buildRoomCode(maNhaTro: string, floor: unknown): string {
    return `${maNhaTro.trim()}_T${this.normalizeFloor(floor)}`
  }

  async create(payload: Partial<Phong> & { nhaTro?: { id: string }; nhaTroId?: string; tangSo?: string | number }) {
    const nhaTroId = payload.nhaTro?.id ?? payload.nhaTroId

    if (!nhaTroId) {
      throw new NotFoundException('Vui lòng chọn nhà trọ')
    }

    const nhaTro = await this.nhaTroRepository.findOne({
      where: { id: nhaTroId },
    })

    if (!nhaTro) {
      throw new NotFoundException('Không tìm thấy nhà trọ')
    }

    const floor = payload.tangSo ?? payload.maPhong
    const maPhong = this.buildRoomCode(nhaTro.maNhaTro, floor)

    const existing = await this.repository.findOne({
      where: { maPhong },
    })

    if (existing) {
      throw new ConflictException(`Phòng ${maPhong} đã tồn tại`)
    }

    const phong = this.repository.create({
      maPhong,
      soGiuongToiDa: payload.soGiuongToiDa,
      loaiPhong: payload.loaiPhong,
      dienTich: payload.dienTich,
      nhaTro,
    })

    return this.repository.save(phong)
  }

  async update(
    id: string,
    payload: Partial<Phong> & {
      nhaTro?: { id: string }
      nhaTroId?: string
      tangSo?: string | number
    },
  ) {
    const phong = await this.repository.findOne({
      where: { id },
      relations: { nhaTro: true },
    })

    if (!phong) {
      throw new NotFoundException('Không tìm thấy phòng')
    }

    phong.soGiuongToiDa =
      payload.soGiuongToiDa ?? phong.soGiuongToiDa

    phong.loaiPhong =
      payload.loaiPhong ?? phong.loaiPhong

    phong.dienTich =
      payload.dienTich ?? phong.dienTich

    const nhaTroId = payload.nhaTro?.id ?? payload.nhaTroId

    if (nhaTroId) {
      const nhaTro = await this.nhaTroRepository.findOne({
        where: { id: nhaTroId },
      })

      if (!nhaTro) {
        throw new NotFoundException('Không tìm thấy nhà trọ')
      }

      phong.nhaTro = nhaTro
    }

    const floor = payload.tangSo ?? payload.maPhong
    if (floor !== undefined && floor !== null && String(floor).trim() !== '') {
      phong.maPhong = this.buildRoomCode(phong.nhaTro.maNhaTro, floor)
    }

    const duplicate = await this.repository.findOne({
      where: { maPhong: phong.maPhong },
    })

    if (duplicate && duplicate.id !== id) {
      throw new ConflictException(`Phòng ${phong.maPhong} đã tồn tại`)
    }

    await this.repository.save(phong)

    return this.findOne(id)
  }

  async remove(id: string) {
    const item = await this.findOne(id)

    if (!item) {
      return null
    }

    await this.repository.remove(item)

    return item
  }
}
