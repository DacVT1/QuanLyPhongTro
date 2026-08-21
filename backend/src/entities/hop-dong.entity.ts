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
import { Giuong } from './giuong.entity';
import { HoaDon } from './hoa-don.entity';
import { NguoiThue } from './nguoi-thue.entity';

@Entity({ name: 'hop_dong' })
export class HopDong {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  maHopDong: string;

  @Column({ type: 'date' })
  ngayBatDau: Date;

  @Column({ type: 'date', nullable: true })
  ngayKetThuc?: Date;

  @Column({ type: 'float', default: 0 })
  tienThue: number;

  @Column({ type: 'integer', default: 1 })
  chuKyThanhToan: number;

  @Column({ type: 'float', default: 0 })
  tienDatCoc: number;

  @Column({ type: 'float', default: 0 })
  tienDien: number;

  @Column({ type: 'float', default: 0 })
  tienNuoc: number;

  @Column({ type: 'float', default: 0 })
  tienDichVu: number;

  @Column({ default: 'active' })
  trangThai: string;

  @Column({ nullable: true })
  ghiChu?: string;

  @ManyToOne(() => Giuong, (giuong) => giuong.hopDongs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'giuong_id' })
  giuong: Giuong;

  @ManyToOne(() => NguoiThue, (nguoiThue) => nguoiThue.hopDongs, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'nguoi_thue_id' })
  nguoiThue: NguoiThue;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => HoaDon, (hoaDon) => hoaDon.hopDong)
  hoaDons: HoaDon[];
}
