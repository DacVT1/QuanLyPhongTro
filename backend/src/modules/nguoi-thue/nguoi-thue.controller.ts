import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileFieldsInterceptor,
} from '@nestjs/platform-express';

import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
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
