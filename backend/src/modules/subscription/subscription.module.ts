import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Subscription } from '../../entities/subscription.entity';
import { GoiDichVu } from '../../entities/goi-dich-vu.entity';
import { Tenant } from '../../entities/tenant.entity';

import { AuthModule } from '../auth/auth.module';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Subscription, GoiDichVu, Tenant]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
