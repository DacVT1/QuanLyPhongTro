import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'password_reset_otp' })
export class PasswordResetOtp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  email: string;

  @Column()
  otp: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
