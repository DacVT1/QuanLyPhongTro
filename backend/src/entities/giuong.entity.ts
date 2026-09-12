import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HopDong } from './hop-dong.entity';
import { Phong } from './phong.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'giuong' })
export class Giuong {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  maGiuong: string;

  @Column({ default: 1 })
  giuongSo: number;

  @Column({
  default: false,
})
datCocSom: boolean;

  @Column({ type: 'integer', default: 0 })
  giaGiuong: number;

  @Column({ default: 'Trống' })
  trangThai: string;

  @ManyToOne(() => Phong, (phong) => phong.giuongs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phong_id' })
  phong: Phong;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => HopDong, (hopDong) => hopDong.giuong)
  hopDongs: HopDong[];

  @ManyToOne(() => Tenant, { nullable: false })
@JoinColumn({ name: 'tenant_id' })
tenant: Tenant;
}
