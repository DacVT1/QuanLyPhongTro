import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { NhaTroService } from './nha-tro.service';

@Controller('nha-tro')
export class NhaTroController {
  constructor(private readonly nhaTroService: NhaTroService) {}

  @Get()
  findAll() {
    return this.nhaTroService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nhaTroService.findOne(id);
  }

  @Post()
  create(@Body() payload: any) {
    return this.nhaTroService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: any) {
    return this.nhaTroService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nhaTroService.remove(id);
  }
}
