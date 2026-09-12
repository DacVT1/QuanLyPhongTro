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

import { HoaDonService } from './hoa-don.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('hoa-don')
@UseGuards(JwtAuthGuard)
export class HoaDonController {
  constructor(
    private readonly hoaDonService: HoaDonService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hoaDonService.findAll(
      user.tenantId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hoaDonService.findOne(
      id,
      user.tenantId,
    );
  }

  @Post()
  create(
    @Body() payload: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hoaDonService.create(
      payload,
      user.tenantId,
    );
  }

  @Post('tao-cho-cac-giuong')
  createForAllBeds(
    @Body()
    payload: {
      thangThanhToan?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hoaDonService.createForAllBeds(
      payload.thangThanhToan ?? '',
      user.tenantId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hoaDonService.update(
      id,
      payload,
      user.tenantId,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hoaDonService.remove(
      id,
      user.tenantId,
    );
  }
}