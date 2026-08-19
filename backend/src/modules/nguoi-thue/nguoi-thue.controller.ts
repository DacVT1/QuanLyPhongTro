import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { NguoiThueService } from './nguoi-thue.service';

@Controller('nguoi-thue')
export class NguoiThueController {
  constructor(private readonly nguoiThueService: NguoiThueService) {}

  @Get()
  findAll() {
    return this.nguoiThueService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nguoiThueService.findOne(id);
  }

  @Post()
  create(@Body() payload: any) {
    return this.nguoiThueService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: any) {
    return this.nguoiThueService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nguoiThueService.remove(id);
  }
}
