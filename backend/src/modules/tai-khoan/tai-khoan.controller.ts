import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { TaiKhoanService } from './tai-khoan.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tai-khoan')
@UseGuards(JwtAuthGuard)
export class TaiKhoanController {
  constructor(private readonly taiKhoanService: TaiKhoanService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.taiKhoanService.getMe(user.sub, user.tenantId);
  }

  @Patch('me')
  @UseInterceptors(
    FileInterceptor('maQrThanhToan', {
      storage: diskStorage({
        destination: './uploads/tai-khoan',
        filename: (_req, file, callback) => {
          const uniqueName =
            `qr-${Date.now()}-${Math.round(Math.random() * 1e9)}` +
            extname(file.originalname);

          callback(null, uniqueName);
        },
      }),
    }),
  )
  updateMe(
    @Body() payload: any,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.taiKhoanService.updateMe(
      user.sub,
      user.tenantId,
      payload,
      file,
    );
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.taiKhoanService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.taiKhoanService.findOne(id, user.tenantId);
  }

  @Post()
  create(@Body() payload: any, @CurrentUser() user: JwtPayload) {
    return this.taiKhoanService.create(payload, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.taiKhoanService.update(id, payload, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.taiKhoanService.remove(id, user.tenantId);
  }
}
