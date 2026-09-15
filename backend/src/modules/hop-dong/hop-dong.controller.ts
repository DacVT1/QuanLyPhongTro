import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HopDongService } from './hop-dong.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('hop-dong')
@UseGuards(JwtAuthGuard)
export class HopDongController {
  constructor(private readonly hopDongService: HopDongService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.hopDongService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.hopDongService.findOne(id, user.tenantId);
  }

  @Get(':id/pdf')
  async getPdf(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.hopDongService.generatePdf(id, user.tenantId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Post(':id/send-email')
  async sendEmail(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.hopDongService.sendContractEmail(id, user.tenantId);
  }

  @Post()
  create(@Body() payload: any, @CurrentUser() user: JwtPayload) {
    return this.hopDongService.create(payload, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hopDongService.update(id, payload, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.hopDongService.remove(id, user.tenantId);
  }
}
