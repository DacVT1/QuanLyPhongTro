import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { GiuongService } from './giuong.service';

@Controller('giuong')
export class GiuongController {
  constructor(private readonly giuongService: GiuongService) {}

  @Get()
  findAll() {
    return this.giuongService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.giuongService.findOne(id);
  }

  @Post()
  create(@Body() payload: any) {
    return this.giuongService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: any) {
    return this.giuongService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.giuongService.remove(id);
  }
}
