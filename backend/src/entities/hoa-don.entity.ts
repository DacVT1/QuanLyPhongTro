import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HopDong } from './hop-dong.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'hoa_don' })
export class HoaDon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  maHoaDon: string;

  @Column({ type: 'date', nullable: true })
  thangThanhToan?: Date;

@Column({
  type: 'decimal',
  precision: 15,
  scale: 2,
  default: 0,
})
tienPhong: number;

@Column({
  type: 'decimal',
  precision: 15,
  scale: 2,
  default: 0,
})
tienDien: number;

@Column({
  type: 'decimal',
  precision: 15,
  scale: 2,
  default: 0,
})
tienNuoc: number;

@Column({
  type: 'decimal',
  precision: 15,
  scale: 2,
  default: 0,
})
tienDichVuKhac: number;
  
@Column({
  type: 'decimal',
  precision: 15,
  scale: 2,
  default: 0,
})
tongTien: number;


  @Column({ default: 'chua_thanh_toan' })
  trangThai: string;

  @Column({ type: 'date', nullable: true })
  ngayNop: Date | null;

  @Column({ nullable: true })
  ghiChu?: string;

  @ManyToOne(() => HopDong, (hopDong) => hopDong.hoaDons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hop_dong_id' })
  hopDong: HopDong;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Tenant, { nullable: false })
@JoinColumn({ name: 'tenant_id' })
tenant: Tenant;
}
