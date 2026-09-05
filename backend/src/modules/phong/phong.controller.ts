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

import { PhongService } from './phong.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('phong')
@UseGuards(JwtAuthGuard)
export class PhongController {
  constructor(private readonly phongService: PhongService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.phongService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.phongService.findOne(id, user.tenantId);
  }

  @Post()
  create(
    @Body() payload: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.phongService.create(payload, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.phongService.update(
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
    return this.phongService.remove(id, user.tenantId);
  }
}