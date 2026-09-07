import { DataSource } from 'typeorm';
import { Giuong } from './entities/giuong.entity';
import { HoaDon } from './entities/hoa-don.entity';
import { HopDong } from './entities/hop-dong.entity';
import { NhaTro } from './entities/nha-tro.entity';
import { NguoiThue } from './entities/nguoi-thue.entity';
import { Phong } from './entities/phong.entity';
import { TaiKhoan } from './entities/tai-khoan.entity';
import { Tenant } from './entities/tenant.entity';
import { GoiDichVu } from './entities/goi-dich-vu.entity';
import { Subscription } from './entities/subscription.entity';

export async function seedDatabase(dataSource: DataSource) {
  const taiKhoanRepository = dataSource.getRepository(TaiKhoan);
  const nhaTroRepository = dataSource.getRepository(NhaTro);
  const phongRepository = dataSource.getRepository(Phong);
  const giuongRepository = dataSource.getRepository(Giuong);
  const nguoiThueRepository = dataSource.getRepository(NguoiThue);
  const hopDongRepository = dataSource.getRepository(HopDong);
  const hoaDonRepository = dataSource.getRepository(HoaDon);
  const tenantRepository = dataSource.getRepository(Tenant);
  const goiDichVuRepository = dataSource.getRepository(GoiDichVu);
  const subscriptionRepository = dataSource.getRepository(Subscription);
  const getOrCreatePlan = async (maGoi: string, data: Partial<GoiDichVu>) => {
    let plan = await goiDichVuRepository.findOne({
      where: { maGoi },
    });

    if (!plan) {
      plan = await goiDichVuRepository.save({
        maGoi,
        ...data,
      });
    }

    return plan;
  };

  const freePlan = await getOrCreatePlan('FREE', {
    ten: 'Miễn phí',
    gia: 0,
    chuKy: 'MONTHLY',
    soPhongToiDa: 5,
    soNguoiDungToiDa: 1,
    trangThai: 'active',
  });

  await getOrCreatePlan('BASIC', {
    ten: 'Cơ bản',
    gia: 99000,
    chuKy: 'MONTHLY',
    soPhongToiDa: 20,
    soNguoiDungToiDa: 3,
    trangThai: 'active',
  });

  await getOrCreatePlan('PRO', {
    ten: 'Chuyên nghiệp',
    gia: 199000,
    chuKy: 'MONTHLY',
    soPhongToiDa: 100,
    soNguoiDungToiDa: 10,
    trangThai: 'active',
  });

  if (!freePlan) {
    throw new Error('Không tạo được gói FREE');
  }
  const taiKhoanCount = await taiKhoanRepository.count();
  if (taiKhoanCount > 0) {
    return;
  }
  const tenant = await tenantRepository.save({
    maTenant: 'TENANT-DEMO',
    ten: 'Nhà trọ Demo',
    trangThai: 'active',
  });
  const taiKhoan = await taiKhoanRepository.save({
    username: 'admin',
    passwordHash: 'hashed-password',
    tenHienThi: 'Quản trị viên',
    email: 'admin@nhatro.vn',
    role: 'admin',
    tenant,
  });

  const ngayBatDau = new Date();

  const ngayKetThuc = new Date(ngayBatDau);
  ngayKetThuc.setMonth(ngayKetThuc.getMonth() + 1);

  let subscription = await subscriptionRepository.findOne({
    where: {
      tenant: {
        id: tenant.id,
      },
      trangThai: 'active',
    },
  });

  if (!subscription) {
    const ngayBatDau = new Date();
    const ngayKetThuc = new Date(ngayBatDau);

    ngayKetThuc.setMonth(ngayKetThuc.getMonth() + 1);

    subscription = await subscriptionRepository.save({
      tenant,
      goiDichVu: freePlan,
      ngayBatDau,
      ngayKetThuc,
      trangThai: 'active',
      autoRenew: false,
    });
  }
  const nhaTro = await nhaTroRepository.save({
    tenNhaTro: 'Nhà trọ A',
    diaChi: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    soTang: 3,
    moTa: 'Nhà trọ cho sinh viên và người lao động',
    taiKhoan,
    tenant,
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
