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

@Entity({ name: 'giuong' })
export class Giuong {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  maGiuong: string;

  @Column()
  giuongSo: number;

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
}
