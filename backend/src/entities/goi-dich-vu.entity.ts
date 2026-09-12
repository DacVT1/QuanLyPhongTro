import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Subscription } from './subscription.entity';

@Entity({ name: 'goi_dich_vu' })
export class GoiDichVu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  maGoi: string;

  @Column()
  ten: string;

  @Column({
    type: 'numeric',
    default: 0,
  })
  gia: number;

  @Column({
    default: 'MONTHLY',
  })
  chuKy: string;

  @Column({
    default: 5,
  })
  soPhongToiDa: number;

  @Column({
    default: 1,
  })
  soNguoiDungToiDa: number;

  @Column({
    default: 'active',
  })
  trangThai: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.goiDichVu)
  subscriptions: Subscription[];
}
