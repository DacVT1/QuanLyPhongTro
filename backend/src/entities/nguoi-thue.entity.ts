import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HopDong } from './hop-dong.entity';

@Entity({ name: 'nguoi_thue' })
export class NguoiThue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  hoTen: string;

  @Column({ nullable: true })
  cccd?: string;

  @Column({ nullable: true })
  sdt?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  diaChi?: string;

  @Column({ type: 'date', nullable: true })
  ngaySinh?: Date;
  
@Column({ nullable: true })
bienSoXe?: string;

@Column({ nullable: true })
cccdMatTruoc?: string;

@Column({ nullable: true })
cccdMatSau?: string;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => HopDong, (hopDong) => hopDong.nguoiThue)
  hopDongs: HopDong[];
}
