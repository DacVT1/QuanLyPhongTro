import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { HoaDonService } from './hoa-don.service';

@Controller('hoa-don')
export class HoaDonController {
  constructor(
    private readonly hoaDonService: HoaDonService,
  ) {}

  @Get()
  findAll() {
    return this.hoaDonService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.hoaDonService.findOne(id);
  }

  @Post()
  create(
    @Body() payload: any,
  ) {
    return this.hoaDonService.create(
      payload,
    );
  }

  /**
   * Tạo hóa đơn cho các giường
   * đang có người thuê.
   *
   * Đặt route này TRƯỚC @Get(':id')
   * và @Post() không ảnh hưởng vì
   * khác HTTP method.
   */
  @Post('tao-cho-cac-giuong')
  createForAllBeds(
    @Body()
    payload: {
      thangThanhToan?: string;
    },
  ) {
    return this.hoaDonService
      .createForAllBeds(
        payload.thangThanhToan ?? '',
      );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: any,
  ) {
    return this.hoaDonService.update(
      id,
      payload,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.hoaDonService.remove(
      id,
    );
  }
}