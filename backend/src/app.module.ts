import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Giuong } from './entities/giuong.entity';
import { HoaDon } from './entities/hoa-don.entity';
import { HopDong } from './entities/hop-dong.entity';
import { NhaTro } from './entities/nha-tro.entity';
import { NguoiThue } from './entities/nguoi-thue.entity';
import { Phong } from './entities/phong.entity';
import { TaiKhoan } from './entities/tai-khoan.entity';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { GiuongModule } from './modules/giuong/giuong.module';
import { HoaDonModule } from './modules/hoa-don/hoa-don.module';
import { HopDongModule } from './modules/hop-dong/hop-dong.module';
import { NhaTroModule } from './modules/nha-tro/nha-tro.module';
import { NguoiThueModule } from './modules/nguoi-thue/nguoi-thue.module';
import { PhongModule } from './modules/phong/phong.module';
import { TaiKhoanModule } from './modules/tai-khoan/tai-khoan.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'database.sqlite',
      entities: [TaiKhoan, NhaTro, Phong, Giuong, NguoiThue, HopDong, HoaDon],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    TaiKhoanModule,
    NhaTroModule,
    PhongModule,
    GiuongModule,
    NguoiThueModule,
    HopDongModule,
    HoaDonModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
