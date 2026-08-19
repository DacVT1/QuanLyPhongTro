import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TaiKhoanService } from './tai-khoan.service';

@Controller('tai-khoan')
export class TaiKhoanController {
  constructor(private readonly taiKhoanService: TaiKhoanService) {}

  @Get()
  findAll() {
    return this.taiKhoanService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taiKhoanService.findOne(id);
  }

  @Post()
  create(@Body() payload: any) {
    return this.taiKhoanService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: any) {
    return this.taiKhoanService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taiKhoanService.remove(id);
  }
}
