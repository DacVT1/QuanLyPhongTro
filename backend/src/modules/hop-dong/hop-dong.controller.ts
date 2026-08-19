import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { HopDongService } from './hop-dong.service';

@Controller('hop-dong')
export class HopDongController {
  constructor(private readonly hopDongService: HopDongService) {}

  @Get()
  findAll() {
    return this.hopDongService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hopDongService.findOne(id);
  }

  @Post()
  create(@Body() payload: any) {
    return this.hopDongService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: any) {
    return this.hopDongService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hopDongService.remove(id);
  }
}
