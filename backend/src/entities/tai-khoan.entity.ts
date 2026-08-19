import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NhaTro } from './nha-tro.entity';

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

  @Column({ nullable: true })
  email?: string;

  @Column({ default: 'admin' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => NhaTro, (nhaTro) => nhaTro.taiKhoan)
  nhaTros: NhaTro[];
}
