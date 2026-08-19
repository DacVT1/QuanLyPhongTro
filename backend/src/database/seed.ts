import { DataSource } from 'typeorm';
import { Giuong } from '../entities/giuong.entity';
import { HoaDon } from '../entities/hoa-don.entity';
import { HopDong } from '../entities/hop-dong.entity';
import { NhaTro } from '../entities/nha-tro.entity';
import { NguoiThue } from '../entities/nguoi-thue.entity';
import { Phong } from '../entities/phong.entity';
import { TaiKhoan } from '../entities/tai-khoan.entity';

export async function seedDatabase(dataSource: DataSource) {
  const taiKhoanRepository = dataSource.getRepository(TaiKhoan);
  const nhaTroRepository = dataSource.getRepository(NhaTro);
  const phongRepository = dataSource.getRepository(Phong);
  const giuongRepository = dataSource.getRepository(Giuong);
  const nguoiThueRepository = dataSource.getRepository(NguoiThue);
  const hopDongRepository = dataSource.getRepository(HopDong);
  const hoaDonRepository = dataSource.getRepository(HoaDon);

  const taiKhoanCount = await taiKhoanRepository.count();
  if (taiKhoanCount > 0) {
    return;
  }

  const taiKhoan = await taiKhoanRepository.save({
    username: 'admin',
    passwordHash: 'hashed-password',
    tenHienThi: 'Quản trị viên',
    email: 'admin@nhatro.vn',
    role: 'admin',
  });

  const nhaTro = await nhaTroRepository.save({
    tenNhaTro: 'Nhà trọ A',
    diaChi: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    soTang: 3,
    moTa: 'Nhà trọ cho sinh viên và người lao động',
    taiKhoan,
  });

  const phong = await phongRepository.save({
    maPhong: 'P101',
    soGiuongToiDa: 8,
    loaiPhong: 'phong_tieu_chuan',
    dienTich: 25,
    nhaTro,
  });

  const giuong = await giuongRepository.save({
    maGiuong: 'G1',
    trangThai: 'da_thue',
    phong,
  });

  const nguoiThue = await nguoiThueRepository.save({
    hoTen: 'Nguyễn Văn A',
    cccd: '012345678901',
    sdt: '0909123456',
    email: 'nguyenvana@email.com',
    diaChi: 'Hà Nội',
    ngaySinh: new Date('1999-05-15'),
  });

  const hopDong = await hopDongRepository.save({
    maHopDong: 'HD001',
    ngayBatDau: new Date('2026-08-01'),
    tienThue: 3500000,
    tienDien: 350000,
    tienNuoc: 120000,
    tienDichVu: 200000,
    trangThai: 'active',
    giuong,
    nguoiThue,
    ghiChu: 'Hợp đồng theo tháng, giá thuê trọn gói',
  });

  await hoaDonRepository.save({
    maHoaDon: 'HD-2026-08-001',
    thangThanhToan: new Date('2026-08-01'),
    tongTien: 3500000,
    tienDien: 0,
    tienNuoc: 0,
    tienDichVu: 0,
    trangThai: 'da_thanh_toan',
    hopDong,
    ghiChu: 'Hóa đơn tháng 2026-08',
  });
}
