import {
  BadRequestException,
  Injectable,
  NotFoundException,
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

  async findAll() {
    return this.repository.find({
      relations: {
        phong: {
          nhaTro: true,
        },
        hopDongs: true,
      },
    })
  }

  async findOne(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: {
        phong: {
          nhaTro: true,
        },
        hopDongs: true,
      },
    })
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
  trangThai: payload.trangThai ?? 'trong',
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
      item.trangThai = payload.trangThai
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
    const item = await this.findOne(id)

    if (!item) {
      throw new NotFoundException('Không tìm thấy giường.')
    }

    await this.repository.remove(item)

    return item
  }
}