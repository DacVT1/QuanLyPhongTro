import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PhongService } from './phong.service';

@Controller('phong')
export class PhongController {
  constructor(private readonly phongService: PhongService) {}

  @Get()
  findAll() {
    return this.phongService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.phongService.findOne(id);
  }

  @Post()
  create(@Body() payload: any) {
    return this.phongService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: any) {
    return this.phongService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.phongService.remove(id);
  }
}
