import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaiKhoan } from './tai-khoan.entity';
import { Subscription } from './subscription.entity';

@Entity({ name: 'tenant' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  maTenant: string;

  @Column()
  ten: string;

  @Column({ default: 'active' })
  trangThai: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TaiKhoan, (taiKhoan: TaiKhoan) => taiKhoan.tenant)
  taiKhoans: TaiKhoan[];

  @OneToMany(
    () => Subscription,
    (subscription: Subscription) => subscription.tenant,
  )
  subscriptions: Subscription[];
}
