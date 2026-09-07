import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentSubscription(@Req() req: any) {
    return this.subscriptionService.getCurrentSubscription(req.user.tenantId);
  }
}
