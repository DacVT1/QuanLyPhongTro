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
import { TaiKhoanService } from './tai-khoan.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tai-khoan')
@UseGuards(JwtAuthGuard)
export class TaiKhoanController {
  constructor(private readonly taiKhoanService: TaiKhoanService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.taiKhoanService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.taiKhoanService.findOne(id, user.tenantId);
  }

  @Post()
  create(
    @Body() payload: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.taiKhoanService.create(payload, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.taiKhoanService.update(
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
    return this.taiKhoanService.remove(
      id,
      user.tenantId,
    );
  }
}