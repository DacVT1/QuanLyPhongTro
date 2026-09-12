import { Controller, Get, Param } from '@nestjs/common';

import { GoiDichVuService } from './goi-dich-vu.service';

@Controller('goi-dich-vu')
export class GoiDichVuController {
  constructor(private readonly service: GoiDichVuService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
