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
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

import { TaiKhoanService } from './tai-khoan.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
const storageDir = process.env.STORAGE_DIR || join(process.cwd(), 'uploads');

const taiKhoanUploadDir = join(storageDir, 'tai-khoan');

mkdirSync(taiKhoanUploadDir, {
  recursive: true,
});
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
        destination: taiKhoanUploadDir,

        filename: (_req, file, cb) => {
          const extension = extname(file.originalname);

          cb(null, `${randomUUID()}${extension}`);
        },
      }),

      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Chi cho phep upload file anh'), false);
        }

        cb(null, true);
      },

      limits: {
        fileSize: 5 * 1024 * 1024,
      },
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

  @Get('admin/users')
  findAllUsersForAdmin(@CurrentUser() user: JwtPayload) {
    return this.taiKhoanService.findAllUsersForAdmin(user.sub);
  }

  @Delete('admin/users/:id')
  removeUserForAdmin(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.taiKhoanService.removeUserForAdmin(user.sub, id);
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
