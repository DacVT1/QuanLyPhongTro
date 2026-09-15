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
import { NhaTro } from './nha-tro.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'tai_khoan' })
export class TaiKhoan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column()
  tenHienThi: string;

  // =========================
  // THÔNG TIN TÀI KHOẢN
  // =========================

  @Column({ nullable: true })
  hoTen?: string;

  @Column({ nullable: true })
  soCccd?: string;

  @Column({ type: 'date', nullable: true })
  ngayCap?: string;

  @Column({ nullable: true })
  noiCap?: string;

  @Column({ nullable: true })
  diaChiThuongTru?: string;

  // Gmail
  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  dienThoai?: string;

  @Column({ nullable: true })
  nganHang?: string;

  @Column({ nullable: true })
  soTaiKhoan?: string;

  @Column({ nullable: true })
  chuTaiKhoan?: string;

  // Đường dẫn ảnh QR thanh toán
  @Column({ nullable: true })
  maQrThanhToan?: string;

  @Column({ default: 'admin' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => NhaTro, (nhaTro) => nhaTro.taiKhoan)
  nhaTros: NhaTro[];

  @ManyToOne(() => Tenant, (tenant: Tenant) => tenant.taiKhoans, {
    nullable: false,
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
