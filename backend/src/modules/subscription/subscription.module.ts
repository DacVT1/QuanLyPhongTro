import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Subscription } from '../../entities/subscription.entity';
import { GoiDichVu } from '../../entities/goi-dich-vu.entity';
import { Tenant } from '../../entities/tenant.entity';

import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, GoiDichVu, Tenant])],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
