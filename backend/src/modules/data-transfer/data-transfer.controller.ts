import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { DataTransferService } from './data-transfer.service';

@Controller('data-transfer')
@UseGuards(JwtAuthGuard)
export class DataTransferController {
  constructor(private readonly service: DataTransferService) {}

  @Get('export')
  async exportData(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    if (!user.tenantId) {
      throw new BadRequestException('Không xác định được tenant đăng nhập.');
    }

    const buffer = await this.service.exportTenant(user.tenantId);

    const filename = `quan-ly-nha-tro-${new Date()
      .toISOString()
      .slice(0, 10)}.zip`;

    res.setHeader('Content-Type', 'application/zip');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  }

  // API nhập dữ liệu sẽ được bổ sung ở bước 8.
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 300 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async importData(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Không xác định được tenant đăng nhập.');
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException('Vui lòng chọn file ZIP hợp lệ.');
    }

    return this.service.importTenant(user.tenantId, file.buffer);
  }
}
