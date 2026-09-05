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

import { GiuongService } from './giuong.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('giuong')
@UseGuards(JwtAuthGuard)
export class GiuongController {
  constructor(private readonly giuongService: GiuongService) {}

  @Get()
findAll(@CurrentUser() user: JwtPayload) {
  return this.giuongService.findAll(
    user.tenantId,
  );
}

  @Get(':id')
findOne(
  @Param('id') id: string,
  @CurrentUser() user: JwtPayload,
) {
  return this.giuongService.findOne(
    id,
    user.tenantId,
  );
}
  @Post()
create(
  @Body() payload: any,
  @CurrentUser() user: any,
) {
  return this.giuongService.create(
    payload,
    user.tenantId,
  );
}

  @Patch(':id')
update(
  @Param('id') id: string,
  @Body() payload: any,
  @CurrentUser() user: any,
) {
  return this.giuongService.update(
    id,
    payload,
    user.tenantId,
  );
}

  @Delete(':id')
remove(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.giuongService.remove(
    id,
    user.tenantId,
  );
}
}
