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
import { TaiKhoan } from './tai-khoan.entity';
import { Phong } from './phong.entity';

@Entity({ name: 'nha_tro' })
export class NhaTro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
}
