import { Injectable, NotFoundException } from '@nestjs/common'
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

  async create(payload: Partial<Phong>) {
    return this.repository.save(
      this.repository.create(payload),
    )
  }

  async update(
    id: string,
    payload: Partial<Phong> & {
      nhaTro?: { id: string }
      nhaTroId?: string
    },
  ) {
    const phong = await this.repository.findOne({
      where: { id },
    })

    if (!phong) {
      throw new NotFoundException('Không tìm thấy phòng')
    }

    phong.maPhong =
      payload.maPhong ?? phong.maPhong

    phong.soGiuongToiDa =
      payload.soGiuongToiDa ?? phong.soGiuongToiDa

    phong.loaiPhong =
      payload.loaiPhong ?? phong.loaiPhong

    phong.dienTich =
      payload.dienTich ?? phong.dienTich

    const nhaTroId =
      payload.nhaTro?.id ??
      payload.nhaTroId

    if (nhaTroId) {
      const nhaTro =
        await this.nhaTroRepository.findOne({
          where: {
            id: nhaTroId,
          },
        })

      if (!nhaTro) {
        throw new NotFoundException(
          'Không tìm thấy nhà trọ',
        )
      }

      phong.nhaTro = nhaTro
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