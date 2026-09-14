import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('hop_dong_xac_nhan')
export class HopDongXacNhan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  hoTen: string;

  @Column({ type: 'varchar', length: 255 })
  verificationCode: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'integer', default: 0 })
  attemptCount: number;

  @Column({ type: 'jsonb' })
  contractData: Record<string, any>;

  @Column({ type: 'bytea' })
  cccdMatTruoc: Buffer;

  @Column({ type: 'bytea' })
  cccdMatSau: Buffer;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cccdMatTruocMimeType: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cccdMatSauMimeType: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
