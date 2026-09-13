import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { TaiKhoan } from './tai-khoan.entity';
import { Phong } from './phong.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'nha_tro' })
@Unique('UQ_nha_tro_ma_tenant', ['maNhaTro', 'tenant'])
export class NhaTro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  maNhaTro: string;

  @Column()
  tenNhaTro: string;

  @Column()
  diaChi: string;

  @Column({ default: 1 })
  soTang: number;

  @Column({ nullable: true })
  moTa?: string;

  @ManyToOne(() => TaiKhoan, (taiKhoan) => taiKhoan.nhaTros, { nullable: true })
  @JoinColumn({ name: 'tai_khoan_id' })
  taiKhoan: TaiKhoan | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Phong, (phong) => phong.nhaTro)
  phongs: Phong[];

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
