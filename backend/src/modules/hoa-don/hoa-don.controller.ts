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
  constructor(private readonly hoaDonService: HoaDonService) {}

  @Get()
  findAll() {
    return this.hoaDonService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hoaDonService.findOne(id);
  }

  @Post()
  create(@Body() payload: any) {
    return this.hoaDonService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: any) {
    return this.hoaDonService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hoaDonService.remove(id);
  }
}
