import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { NhaTroService } from './nha-tro.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Tenant } from '../../entities/tenant.entity';

@Controller('nha-tro')
@UseGuards(JwtAuthGuard)
export class NhaTroController {
  constructor(
    private readonly nhaTroService: NhaTroService,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user;

    return this.nhaTroService.findAll(
      user.tenantId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    return this.nhaTroService.findOne(
      id,
      user.tenantId,
    );
  }

  @Post()
  create(
    @Body() payload: any,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    return this.nhaTroService.create(
      payload,
      user.tenantId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: any,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    return this.nhaTroService.update(
      id,
      payload,
      user.tenantId,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    return this.nhaTroService.remove(
      id,
      user.tenantId,
    );
  }
}