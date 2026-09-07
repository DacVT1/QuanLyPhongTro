import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Tenant } from './tenant.entity';
import { GoiDichVu } from './goi-dich-vu.entity';

@Entity({ name: 'subscription' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.subscriptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'tenant_id',
  })
  tenant: Tenant;

  @ManyToOne(() => GoiDichVu, (goiDichVu) => goiDichVu.subscriptions, {
    nullable: false,
  })
  @JoinColumn({
    name: 'goi_dich_vu_id',
  })
  goiDichVu: GoiDichVu;

  @Column({
    type: 'timestamp',
  })
  ngayBatDau: Date;

  @Column({
    type: 'timestamp',
  })
  ngayKetThuc: Date;

  @Column({
    default: 'active',
  })
  trangThai: string;

  @Column({
    default: false,
  })
  autoRenew: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
