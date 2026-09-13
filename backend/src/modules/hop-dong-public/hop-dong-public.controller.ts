import { Controller, Get } from '@nestjs/common';

import { HopDongPublicService } from './hop-dong-public.service';

@Controller('public/hop-dong')
export class HopDongPublicController {
  constructor(private readonly hopDongPublicService: HopDongPublicService) {}

  /**
   * Public API.
   *
   * Không yêu cầu đăng nhập.
   *
   * GET /api/public/hop-dong/data
   */
  @Get('data')
  getData() {
    return this.hopDongPublicService.getData();
  }
}
