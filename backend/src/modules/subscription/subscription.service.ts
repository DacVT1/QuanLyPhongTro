import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Subscription } from '../../entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  /**
   * Lấy subscription hiện tại của Tenant
   */
  async getCurrentSubscription(tenantId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        tenant: {
          id: tenantId,
        },
        trangThai: 'active',
      },
      relations: {
        goiDichVu: true,
      },
      order: {
        ngayKetThuc: 'DESC',
      },
    });

    if (!subscription) {
      throw new NotFoundException('Tenant chưa có gói dịch vụ đang hoạt động');
    }

    return subscription;
  }
}
