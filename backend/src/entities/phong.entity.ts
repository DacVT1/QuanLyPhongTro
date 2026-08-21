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
import { NhaTro } from './nha-tro.entity';

@Entity({ name: 'phong' })
export class Phong {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  maPhong: string;

  @Column({ default: 1 })
  tangSo: number;

  @Column({ default: 8 })
  soGiuongToiDa: number;

  @Column({ default: 'phong_tieu_chuan' })
  loaiPhong: string;

  @Column({ default: 0 })
  dienTich: number;

  @ManyToOne(() => NhaTro, (nhaTro) => nhaTro.phongs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nha_tro_id' })
  nhaTro: NhaTro;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Giuong, (giuong) => giuong.phong)
  giuongs: Giuong[];
}
