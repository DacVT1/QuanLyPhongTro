<script setup lang="ts">
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

import { Doughnut } from "vue-chartjs";
import { computed, onMounted, ref } from "vue";
import api from "./services/api";
import { getImageUrl } from "./utils/image";
import NguoiThueDetail from "./components/nguoi-thue/NguoiThueDetail.vue";
import Login from '@/components/auth/Login.vue'
import Register from './components/auth/Register.vue'
import Footer from "./components/Footer.vue";

ChartJS.register(ArcElement, Tooltip, Legend);
const cccdMatTruocPreviewUrl = ref("");
const cccdMatSauPreviewUrl = ref("");
const showHopDongHoaDonErrorModal = ref(false);
const hopDongHoaDonErrorMessage = ref("");
const tabs = [
  "dashboard",
  "nhaTro",
  "phong",
  "giuong",
  "nguoiThue",
  "hopDong",
  "hoaDon",
];
const currentTab = ref("dashboard");
const isMenuOpen = ref(false);
const soDienThoaiError = ref("");

const authMode = ref<'login' | 'register'>('login')

const accessToken = ref(
  localStorage.getItem('accessToken'),
)

const currentUser = ref<any | null>(
  JSON.parse(
    localStorage.getItem('currentUser') || 'null',
  ),
)

function handleLogin(data: any) {
  accessToken.value = data.accessToken

  currentUser.value = data.user

  localStorage.setItem(
    'accessToken',
    data.accessToken,
  )

  localStorage.setItem(
    'currentUser',
    JSON.stringify(data.user),
  )
}

function logout() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('currentUser')

  accessToken.value = null
  currentUser.value = null
  authMode.value = 'login'
}

const tienDienDisplay = ref("0");
const tienNuocDisplay = ref("0");
const tienDichVuKhacDisplay = ref("0");
const tienDienError = ref("");
const tienNuocError = ref("");
const tienDichVuKhacError = ref("");
const hoaDonThangThanhToanError = ref("");
const showNguoiThueDetail = ref(false);
const selectedNguoiThue = ref<any | null>(null);
function openNguoiThueDetail(item: any) {
  selectedNguoiThue.value = item;
  showNguoiThueDetail.value = true;
}

function closeNguoiThueDetail() {
  showNguoiThueDetail.value = false;
  selectedNguoiThue.value = null;
}
function getPhongChartData(house: any) {
  return {
    labels: ["Phòng có người ở", "Phòng còn trống"],

    datasets: [
      {
        data: [
          house.totalPhongCoNguoi,
          Math.max(house.totalPhong - house.totalPhongCoNguoi, 0),
        ],

        backgroundColor: ["#2563eb", "#e5e7eb"],

        borderWidth: 0,
      },
    ],
  };
}

function getGiuongChartData(house: any) {
  return {
    labels: ["Giường có người ở", "Giường còn trống"],

    datasets: [
      {
        data: [
          house.totalGiuongCoNguoi,
          Math.max(house.totalGiuong - house.totalGiuongCoNguoi, 0),
        ],

        backgroundColor: ["#7c3aed", "#e5e7eb"],

        borderWidth: 0,
      },
    ],
  };
}

function getThanhToanChartData(house: any) {
  return {
    labels: ["Đã thanh toán", "Chưa thanh toán"],

    datasets: [
      {
        data: [
          house.totalGiuongDaThanhToan,
          Math.max(
            house.totalGiuongCoHoaDonThangHienTai -
              house.totalGiuongDaThanhToan,
            0,
          ),
        ],

        backgroundColor: ["#16a34a", "#e5e7eb"],

        borderWidth: 0,
      },
    ],
  };
}

function getTrangThaiHopDongDisplay(ngayBatDau: string, ngayKetThuc: string) {
  if (!ngayBatDau || !ngayKetThuc) {
    return {
      status: "",
      text: "",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(`${ngayBatDau}T00:00:00`);
  const endDate = new Date(`${ngayKetThuc}T00:00:00`);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  // Ngày bắt đầu > ngày hiện tại
  if (startDate > today) {
    return {
      status: "chua_hieu_luc",
      text: "Chưa hiệu lực",
    };
  }

  // Ngày kết thúc <= ngày hiện tại
  if (endDate <= today) {
    return {
      status: "expired",
      text: "Hết hiệu lực",
    };
  }

  // Ngày bắt đầu <= ngày hiện tại < ngày kết thúc
  const daysRemaining = Math.ceil(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Còn <= 30 ngày:
  // Chỉ thay đổi TEXT hiển thị, không thay đổi trạng thái database.
  if (daysRemaining <= 30) {
    return {
      status: "active",
      text: `Còn hiệu lực(${daysRemaining} ngày)`,
    };
  }

  // Còn > 30 ngày
  return {
    status: "active",
    text: "Còn hiệu lực",
  };
}

const doughnutOptions = {
  responsive: true,

  maintainAspectRatio: false,

  cutout: "68%",

  plugins: {
    legend: {
      display: false,
    },

    tooltip: {
      enabled: true,
    },
  },
};

const doughnutCenterTextPlugin = {
  id: "doughnutCenterText",

  afterDraw(chart: any) {
    const { ctx } = chart;

    const dataset = chart.data.datasets[0];

    if (!dataset?.data?.length) {
      return;
    }

    const total = dataset.data.reduce(
      (sum: number, value: number) => sum + Number(value),
      0,
    );

    if (total === 0) {
      return;
    }

    const currentValue = Number(dataset.data[0]);

    const percent = (currentValue / total) * 100;

    const text = `${percent.toFixed(2).replace(/\.00$/, "")}%`;

    const meta = chart.getDatasetMeta(0);

    if (!meta?.data?.length) {
      return;
    }

    const x = meta.data[0].x;
    const y = meta.data[0].y;

    ctx.save();

    ctx.font = "800 28px Arial";

    ctx.fillStyle = "#172033";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(text, x, y);

    ctx.restore();
  },
};

function formatMonthForDisplay(value: string) {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4})-(\d{2})/);

  if (!match) {
    return value;
  }

  return `${match[2]}/${match[1]}`;
}

async function handleThemHoaDonChoCacGiuong() {
  /*
   * Kiểm tra tháng thanh toán
   */
  const thangThanhToan = hoaDonForm.value.thangThanhToan;

  if (!thangThanhToan) {
    hoaDonThangThanhToanError.value =
      "Vui lòng chọn Tháng thanh toán trước khi tạo hóa đơn.";

    return;
  }

  hoaDonThangThanhToanError.value = "";

  /*
   * Xác nhận trước khi tạo hàng loạt.
   */
  const confirmed = window.confirm(
    `Bạn có chắc muốn tạo hóa đơn cho các giường đang có người thuê trong tháng ${formatMonthForDisplay(
      thangThanhToan,
    )} không?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    /*
     * Đảm bảo ngày gửi backend là ngày đầu tháng.
     *
     * input type="month":
     * 2026-08
     *
     * API:
     * 2026-08-01
     */
    const requestMonth = `${thangThanhToan}-01`;

    const response = await api.post("/hoa-don/tao-cho-cac-giuong", {
      thangThanhToan: requestMonth,
    });

    const result = response.data;

    /*
     * Load lại danh sách hóa đơn.
     */
    await loadData();

    /*
     * Nếu source của bạn có hàm
     * loadDashboard() thì gọi lại.
     */
    if (typeof loadData === "function") {
      await loadData();
    }

    const daTao = Number(result?.daTao ?? 0);

    const daBoQua = Number(result?.daBoQua ?? 0);

    /*
     * Hiển thị kết quả.
     */
    alert(
      [
        result?.message ?? "Đã xử lý tạo hóa đơn.",
        `Tháng: ${formatMonthForDisplay(thangThanhToan)}`,
        `Đã tạo: ${daTao} hóa đơn`,
        `Đã bỏ qua: ${daBoQua} giường đã có hóa đơn`,
      ].join("\n"),
    );
  } catch (error: any) {
    console.error("Lỗi tạo hóa đơn cho các giường:", error);

    const message =
      error?.response?.data?.message ?? "Không thể tạo hóa đơn cho các giường.";

    alert(Array.isArray(message) ? message.join("\n") : message);
  }
}

function handleTienDienInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  if (!/^\d*$/.test(value.replace(/,/g, ""))) {
    tienDienError.value = "Tiền điện chỉ được nhập số.";
    return;
  }

  tienDienError.value = "";

  const rawValue = value.replace(/,/g, "");

  hoaDonForm.value.tienDien = Number(rawValue || 0);

  tienDienDisplay.value = rawValue
    ? Number(rawValue).toLocaleString("en-US")
    : "0";

  calculateHoaDonTongTien();
}

function handleTienNuocInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  if (!/^\d*$/.test(value.replace(/,/g, ""))) {
    tienNuocError.value = "Tiền nước chỉ được nhập số.";
    return;
  }

  tienNuocError.value = "";

  const rawValue = value.replace(/,/g, "");

  hoaDonForm.value.tienNuoc = Number(rawValue || 0);

  tienNuocDisplay.value = rawValue
    ? Number(rawValue).toLocaleString("en-US")
    : "0";

  calculateHoaDonTongTien();
}

function handleTienDichVuKhacInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  if (!/^\d*$/.test(value.replace(/,/g, ""))) {
    tienDichVuKhacError.value = "Tiền dịch vụ khác chỉ được nhập số.";
    return;
  }

  tienDichVuKhacError.value = "";

  const rawValue = value.replace(/,/g, "");

  hoaDonForm.value.tienDichVuKhac = Number(rawValue || 0);

  tienDichVuKhacDisplay.value = rawValue
    ? Number(rawValue).toLocaleString("en-US")
    : "0";

  calculateHoaDonTongTien();
}

function handleSoDienThoaiInput() {
  const value = nguoiThueForm.value.sdt;

  // Không tự cắt dữ liệu người dùng nhập
  if (value.length > 10) {
    soDienThoaiError.value = "Số điện thoại không được vượt quá 10 chữ số";
    return;
  }

  // Kiểm tra ký tự không phải số
  if (!/^\d*$/.test(value)) {
    soDienThoaiError.value = "Số điện thoại chỉ được nhập chữ số";
    return;
  }

  soDienThoaiError.value = "";
}

function validateSoDienThoai() {
  const value = nguoiThueForm.value.sdt;

  if (!value) {
    soDienThoaiError.value = "Vui lòng nhập số điện thoại";
    return false;
  }

  if (!/^\d+$/.test(value)) {
    soDienThoaiError.value = "Số điện thoại chỉ được nhập chữ số";
    return false;
  }

  if (!value.startsWith("0")) {
    soDienThoaiError.value = "Số điện thoại phải bắt đầu bằng số 0";
    return false;
  }

  if (value.length > 10) {
    soDienThoaiError.value = "Số điện thoại không được vượt quá 10 chữ số";
    return false;
  }

  if (value.length < 10) {
    soDienThoaiError.value = "Số điện thoại phải có đúng 10 chữ số";
    return false;
  }

  soDienThoaiError.value = "";
  return true;
}

function handleTienThueInput(event: Event) {
  const input = event.target as HTMLInputElement;

  // Chỉ giữ lại chữ số
  const rawValue = input.value.replace(/\D/g, "");

  hopDongForm.value.tienThue = Number(rawValue || 0);

  tienThueDisplay.value = rawValue
    ? Number(rawValue).toLocaleString("en-US")
    : "";
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}
const summary = ref({
  totalNhaTro: 0,
  totalPhong: 0,
  totalGiuong: 0,
  totalHopDong: 0,
  totalHoaDon: 0,
});

const nhatroImg = ref("/images/nhatro.svg");

const fallbackSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='60' viewBox='0 0 80 60'><rect width='100%' height='100%' fill='%23e6f2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='12' fill='%230f172a'>Nha tro</text></svg>`;
const fallbackUri =
  "data:image/svg+xml;utf8," + encodeURIComponent(fallbackSvg);

function onImageError() {
  nhatroImg.value = fallbackUri;
}

function onImgError(event: Event) {
  const el = event.target as HTMLImageElement;
  if (el && !el.dataset.fallbackApplied) {
    el.dataset.fallbackApplied = "1";
    el.src = fallbackUri;
  }
}

function validateNgayHopDong() {
  const ngayBatDau = hopDongForm.value.ngayBatDau;

  const ngayKetThuc = hopDongForm.value.ngayKetThuc;

  // Chưa nhập ngày bắt đầu
  if (!ngayBatDau) {
    return true;
  }

  // Ngày kết thúc chưa nhập
  if (!ngayKetThuc) {
    return true;
  }

  const startDate = new Date(`${ngayBatDau}T00:00:00`);

  const endDate = new Date(`${ngayKetThuc}T00:00:00`);

  if (startDate >= endDate) {
    alert("Ngày bắt đầu phải nhỏ hơn ngày kết thúc.");

    hopDongForm.value.ngayKetThuc = "";

    return false;
  }

  return true;
}

const nhaTros = ref<any[]>([]);
const phongs = ref<any[]>([]);
const giuongs = ref<any[]>([]);
const nguoiThues = ref<any[]>([]);
const nguoiThueSearch = ref("");
const hopDongs = ref<any[]>([]);
const hoaDons = ref<any[]>([]);

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const filteredNguoiThues = computed(() => {
  const keyword = nguoiThueSearch.value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Không nhập gì → hiển thị toàn bộ
  if (!keyword) {
    return nguoiThues.value;
  }

  return nguoiThues.value.filter((item) => {
    const hoTen = String(item.hoTen ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const cccd = String(item.cccd ?? "").toLowerCase();

    // Tìm chuỗi ở BẤT KỲ vị trí nào
    return hoTen.includes(keyword) || cccd.includes(keyword);
  });
});

const nhaTroDashboard = computed(() => {
  return nhaTros.value.map((nhaTro) => {
    const now = new Date();

    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}`;

    const currentMonthHoaDons = hoaDons.value.filter((hoaDon) => {
      const thangThanhToan = String(hoaDon.thangThanhToan ?? "");

      return (
        thangThanhToan.slice(0, 7) === currentMonth &&
        hoaDon.hopDong?.giuong?.phong?.nhaTro?.id === nhaTro.id
      );
    });

    const paidCurrentMonthHoaDons = currentMonthHoaDons.filter(
      (hoaDon) => hoaDon.trangThai === "da_thanh_toan",
    );

    const currentMonthBedIds = new Set(
      currentMonthHoaDons
        .map((hoaDon) => hoaDon.hopDong?.giuong?.id)
        .filter(Boolean),
    );

    const paidBedIds = new Set(
      paidCurrentMonthHoaDons
        .map((hoaDon) => hoaDon.hopDong?.giuong?.id)
        .filter(Boolean),
    );

    const rooms = phongs.value.filter(
      (phong) => phong.nhaTro?.id === nhaTro.id,
    );

    const beds = giuongs.value.filter(
      (giuong) => giuong.phong?.nhaTro?.id === nhaTro.id,
    );

    const activeContracts = hopDongs.value.filter(
      (hopDong) =>
        hopDong.trangThai === "active" &&
        hopDong.giuong?.phong?.nhaTro?.id === nhaTro.id,
    );

    const occupiedRoomIds = new Set(
      activeContracts
        .map((hopDong) => hopDong.giuong?.phong?.id)
        .filter(Boolean),
    );

    const occupiedBedIds = new Set(
      activeContracts.map((hopDong) => hopDong.giuong?.id).filter(Boolean),
    );

    const paidContracts = hoaDons.value.filter(
      (hoaDon) =>
        hoaDon.trangThai === "da_thanh_toan" &&
        hoaDon.hopDong?.giuong?.phong?.nhaTro?.id === nhaTro.id,
    );

    return {
      id: nhaTro.id,

      maNhaTro: nhaTro.maNhaTro ?? "",

      tenNhaTro: nhaTro.tenNhaTro ?? "",

      soTang: Number(nhaTro.soTang ?? 0),

      totalPhong: rooms.length,

      totalPhongCoNguoi: occupiedRoomIds.size,

      totalGiuong: beds.length,

      totalGiuongCoNguoi: occupiedBedIds.size,

      totalGiuongDaThanhToan: paidBedIds.size,
      totalGiuongCoHoaDonThangHienTai: currentMonthBedIds.size,
    };
  });
});

const nhaTroForm = ref({
  maNhaTro: "",
  tenNhaTro: "",
  diaChi: "",
  soTang: 1,
  moTa: "",
});

const phongForm = ref({
  maPhong: "",
  tangSo: "",
  soGiuongToiDa: 8,
  loaiPhong: "phong_tieu_chuan",
  dienTich: 25,
  nhaTroId: "",
});

const tangSoOptions = computed(() => {
  if (!phongForm.value.nhaTroId) {
    return [];
  }

  const nhaTro = nhaTros.value.find(
    (item) => item.id === phongForm.value.nhaTroId,
  );

  if (!nhaTro) {
    return [];
  }

  const soTang = Number(nhaTro.soTang ?? 0);

  if (soTang <= 0) {
    return [];
  }

  // Các tầng đã được sử dụng bởi phòng khác
  const usedFloors = phongs.value
    .filter((item) => {
      if (item.nhaTro?.id !== phongForm.value.nhaTroId) {
        return false;
      }

      // Khi sửa phòng thì không loại tầng hiện tại của chính phòng đó
      if (item.id === editingPhongId.value) {
        return false;
      }

      return true;
    })
    .map((item) => {
      // Ưu tiên tangSo nếu backend đã lưu
      if (item.tangSo !== undefined && item.tangSo !== null) {
        return Number(item.tangSo);
      }

      // Hỗ trợ dữ liệu cũ: lấy từ CG_T1, CG_T2...
      const match = String(item.maPhong ?? "").match(/_T(\d+)$/);

      return match ? Number(match[1]) : null;
    })
    .filter(
      (floor): floor is number => floor !== null && Number.isInteger(floor),
    );

  return Array.from({ length: soTang }, (_, index) => index + 1).filter(
    (floor) => !usedFloors.includes(floor),
  );
});

const giuongSoOptions = computed(() => {
  const phong = phongs.value.find(
    (item: any) => String(item.id) === String(giuongForm.value.phongId),
  );

  const soGiuongToiDa = Number(phong?.soGiuongToiDa ?? 8);

  return Array.from({ length: soGiuongToiDa }, (_, index) => index + 1);
});

const giuongForm = ref({
  nhaTroId: "",
  phongId: "",
  giuongSo: "",
  giaGiuong: 1500000,
  // trangThai: "trong",
  datCocSom: false,
});

const nguoiThueForm = ref({
  hoTen: "",
  cccd: "",
  sdt: "",
  email: "a@gmail.com",
  diaChi: "",
  ngaySinh: "",
  bienSoXe: "00A0-00000",
  cccdMatTruoc: null as File | null,
  cccdMatSau: null as File | null,
  cccdMatTruocUrl: "",
  cccdMatSauUrl: "",
});

const hopDongForm = ref({
  maHopDong: "",
  nhaTroId: "",
  phongId: "",
  ngayBatDau: "",
  ngayKetThuc: "",
  tienThue: 0,
  chuKyThanhToan: 1,
  tienDatCoc: 1000000,
  ghiChu: "",
  giuongId: "",
  nguoiThueId: "",
  trangThai: "active",
});

const hoaDonForm = ref({
  maHoaDon: "",
  hopDongId: "",
  thangThanhToan: "",
  tienPhong: 0,
  tienDien: 0,
  tienNuoc: 0,
  tienDichVuKhac: 0,
  tongTien: 0,
  trangThai: "chua_thanh_toan",
  ghiChu: "",
});

const hopDongGiuongOptions = computed(() => {
  const nhaTroId = hopDongForm.value.nhaTroId;
  const phongId = hopDongForm.value.phongId;
  // Chưa chọn nhà trọ
  if (!nhaTroId) {
    return [];
  }

  // Lấy ID các giường đã được sử dụng trong hợp đồng
  const usedGiuongIds = hopDongs.value
    .filter((item) => {
      // Khi sửa hợp đồng, cho phép giữ lại chính giường hiện tại
      if (item.id === editingHopDongId.value) {
        return false;
      }

      return !!item.giuong?.id;
    })
    .map((item) => item.giuong.id);

  // Chỉ lấy giường:
  // 1. Thuộc nhà trọ đang chọn
  // 2. Chưa được sử dụng trong hợp đồng khác
  return giuongs.value.filter((item) => {
    const itemNhaTroId = item.phong?.nhaTro?.id;
    const itemPhongId = item.phong?.id;

    if (itemNhaTroId !== nhaTroId) {
      return false;
    }

    if (phongId && itemPhongId !== phongId) {
      return false;
    }

    if (usedGiuongIds.includes(item.id)) {
      return false;
    }

    return true;
  });
});

const hopDongPhongOptions = computed(() => {
  const nhaTroId = hopDongForm.value.nhaTroId;

  if (!nhaTroId) {
    return [];
  }

  return phongs.value.filter((item) => item.nhaTro?.id === nhaTroId);
});
function handleNhaTroChangeForHopDong() {
  // Mỗi khi đổi nhà trọ phải xóa giường đang chọn
  hopDongForm.value.giuongId = "";
  hopDongForm.value.giuongId = "";
  // Xóa mã hợp đồng cũ vì mã hợp đồng phụ thuộc vào giường
  hopDongForm.value.maHopDong = "";
}

function handlePhongChangeForHopDong() {
  // Đổi phòng -> reset giường
  hopDongForm.value.giuongId = "";

  // Mã hợp đồng phụ thuộc vào giường
  hopDongForm.value.maHopDong = "";
}

const editingNhaTroId = ref<string | null>(null);
const showNhaTroForm = ref(false);
const editingPhongId = ref<string | null>(null);
const showPhongForm = ref(false);
const editingGiuongId = ref<string | null>(null);
const showGiuongForm = ref(false);
const editingNguoiThueId = ref<string | null>(null);
const showNguoiThueForm = ref(false);
const cccdMatTruocInput = ref<HTMLInputElement | null>(null);
const cccdMatSauInput = ref<HTMLInputElement | null>(null);
const giaGiuongDisplay = ref("1,500,000");
const tienThueDisplay = ref("");
const tienDatCocDisplay = ref("1,000,000");
const editingHopDongId = ref<string | null>(null);
const showHopDongForm = ref(false);
const editingHoaDonId = ref<string | null>(null);
const showHoaDonForm = ref(false);

const showDeleteHoaDonModal = ref(false);
const showDeleteHopDongModal = ref(false);

function openAddHoaDonForm() {
  resetHoaDonForm();
  showHoaDonForm.value = true;
}
function closeHoaDonForm() {
  resetHoaDonForm();
  showHoaDonForm.value = false;
}
function openAddHopDongForm() {
  resetHopDongForm();
  showHopDongForm.value = true;
}
function closeHopDongForm() {
  resetHopDongForm();
  showHopDongForm.value = false;
}
function openAddNguoiThueForm() {
  resetNguoiThueForm();
  showNguoiThueForm.value = true;
}
function closeNguoiThueForm() {
  resetNguoiThueForm();
  showNguoiThueForm.value = false;
}
function openAddPhongForm() {
  resetPhongForm();
  showPhongForm.value = true;
}

function closePhongForm() {
  resetPhongForm();
  showPhongForm.value = false;
}
function openAddGiuongForm() {
  resetGiuongForm();
  showGiuongForm.value = true;
}

function closeGiuongForm() {
  resetGiuongForm();
  showGiuongForm.value = false;
}
function formatTienThueDisplay(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numberValue = Number(String(value).replace(/[^\d]/g, ""));

  if (isNaN(numberValue)) {
    return "";
  }

  return numberValue.toLocaleString("vi-VN");
}

const deleteHoaDonInfo = ref({
  id: "",
  maHoaDon: "",
});

const deleteHoaDonErrorMessage = ref("");

const deleteHopDongInfo = ref({
  id: "",
  maHopDong: "",
});

function requestDeleteHoaDon(item: any) {
  deleteHoaDonInfo.value = {
    id: item.id,
    maHoaDon: item.maHoaDon ?? "Hóa đơn",
  };

  deleteHoaDonErrorMessage.value = "";
  showDeleteHoaDonModal.value = true;
}

function closeDeleteHoaDonModal() {
  showDeleteHoaDonModal.value = false;
  deleteHoaDonErrorMessage.value = "";
}

async function confirmDeleteHoaDon() {
  const id = deleteHoaDonInfo.value.id;

  if (!id) {
    return;
  }

  try {
    deleteHoaDonErrorMessage.value = "";

    await api.delete(`/hoa-don/${id}`);

    closeDeleteHoaDonModal();

    if (editingHoaDonId.value === id) {
      resetHoaDonForm();
    }

    await loadData();
  } catch (error: any) {
    console.error("Không thể xóa hóa đơn:", error);

    deleteHoaDonErrorMessage.value =
      error?.response?.data?.message ??
      "Không thể xóa hóa đơn. Vui lòng thử lại.";
  }
}

const deleteHopDongErrorMessage = ref("");

const giuongOptions = computed(() => {
  // Danh sách tối đa 8 giường
  const allOptions = Array.from({ length: 8 }, (_, index) => String(index + 1));

  // Chưa chọn tầng
  if (!giuongForm.value.phongId) {
    return [];
  }

  // Lấy các giường đã được sử dụng trong phòng đang chọn
  const existingGiuongSo = giuongs.value
    .filter(
      (item) =>
        item.phong?.id === giuongForm.value.phongId &&
        item.id !== editingGiuongId.value,
    )
    .map((item) => String(item.giuongSo));

  // Chỉ hiển thị những giường chưa được sử dụng
  const availableGiuongSo = allOptions.filter(
    (so) => !existingGiuongSo.includes(so),
  );

  // Khi sửa giường:
  // giữ lại Giường số hiện tại của bản ghi đang sửa
  const currentGiuongSo = String(giuongForm.value.giuongSo ?? "");

  if (
    editingGiuongId.value &&
    currentGiuongSo &&
    !availableGiuongSo.includes(currentGiuongSo)
  ) {
    availableGiuongSo.push(currentGiuongSo);
  }

  return availableGiuongSo.sort((a, b) => Number(a) - Number(b));
});

const requiredLabel = (label: string) => `${label} *`;

function getStatusText(status: string) {
  const map: Record<string, string> = {
    trong: "Trống",
    chua_thue: "Chưa thuê",
    da_thue: "Đã thuê",
    bao_tri: "Bảo trì",
    sap_tra_tro: "Sắp trả trọ",
    active: "Có hiệu lực",
    expired: "Hết hiệu lực",
    chua_thanh_toan: "Chưa thanh toán",
    da_thanh_toan: "Đã thanh toán",
  };

  return map[status] ?? status;
}

function getNguoiThueGiuongStatus(nguoiThueId: string | number) {
  const nguoiThueHopDongs = hopDongs.value.filter((hopDong: any) => {
    const hopDongNguoiThueId = hopDong.nguoiThue?.id ?? hopDong.nguoiThueId;

    return String(hopDongNguoiThueId) === String(nguoiThueId);
  });

  // Chưa từng có hợp đồng
  if (nguoiThueHopDongs.length === 0) {
    return {
      status: "chua_thue",
      text: "Chưa thuê",
      maHopDong: "",
    };
  }

  // Có ít nhất một hợp đồng còn hiệu lực
  const activeHopDong = nguoiThueHopDongs.find(
    (hopDong: any) => hopDong.trangThai === "active",
  );

  if (activeHopDong) {
    return {
      status: "da_thue",
      text: activeHopDong.maHopDong ?? "",
      maHopDong: activeHopDong.maHopDong ?? "",
    };
  }

  // Có hợp đồng nhưng tất cả đều hết hạn
  return {
    status: "het_han",
    text: "Hết hạn hợp đồng",
    maHopDong: "",
  };
}

async function loadData() {
  try {
    const [
      nhaTroResponse,
      phongResponse,
      giuongResponse,
      nguoiThueResponse,
      hopDongResponse,
      hoaDonResponse,
      dashboardResponse,
    ] = await Promise.all([
      api.get("/nha-tro"),
      api.get("/phong"),
      api.get("/giuong"),
      api.get("/nguoi-thue"),
      api.get("/hop-dong"),
      api.get("/hoa-don"),
      api.get("/dashboard/summary"),
    ]);

    nhaTros.value = nhaTroResponse.data;
    phongs.value = phongResponse.data;
    giuongs.value = giuongResponse.data;
    nguoiThues.value = nguoiThueResponse.data;
    hopDongs.value = hopDongResponse.data;
    hoaDons.value = hoaDonResponse.data;
    summary.value = dashboardResponse.data;
  } catch (error) {
    console.error("Không thể nạp dữ liệu:", error);
  }
}

function resetNhaTroForm() {
  nhaTroForm.value = {
    maNhaTro: "",
    tenNhaTro: "",
    diaChi: "",
    soTang: 1,
    moTa: "",
  };
  editingNhaTroId.value = null;
}

function openAddNhaTroForm() {
  resetNhaTroForm();
  showNhaTroForm.value = true;
}

function closeNhaTroForm() {
  resetNhaTroForm();
  showNhaTroForm.value = false;
}

function resetPhongForm() {
  phongForm.value = {
    maPhong: "",
    tangSo: "",
    soGiuongToiDa: 8,
    loaiPhong: "phong_tieu_chuan",
    dienTich: 25,
    nhaTroId: "",
  };
  editingPhongId.value = null;
}

function handleNhaTroChange() {
  phongForm.value.tangSo = "";
  phongForm.value.maPhong = "";
}

function resetGiuongForm() {
  giuongForm.value = {
    nhaTroId: "",
    phongId: "",
    giuongSo: "",
    giaGiuong: 1500000,
    // trangThai: "trong",
    datCocSom: false,
  };

  giaGiuongDisplay.value = "1,500,000";

  editingGiuongId.value = null;
}

function handleGiaGiuongInput(event: Event) {
  const input = event.target as HTMLInputElement;

  const rawValue = input.value.replace(/\D/g, "");

  giuongForm.value.giaGiuong = Number(rawValue || 0);

  giaGiuongDisplay.value = rawValue
    ? Number(rawValue).toLocaleString("en-US")
    : "";
}

function handleGiuongChangeForHopDong() {
  syncHopDongCode();

  const giuong = giuongs.value.find(
    (item) => item.id === hopDongForm.value.giuongId,
  );

  const giaGiuong = Number(giuong?.giaGiuong ?? 0);

  hopDongForm.value.tienThue = giaGiuong;

  tienThueDisplay.value = giaGiuong ? giaGiuong.toLocaleString("en-US") : "";
}

function handleTienDatCocInput(event: Event) {
  const input = event.target as HTMLInputElement;

  const rawValue = input.value.replace(/\D/g, "");

  hopDongForm.value.tienDatCoc = Number(rawValue || 0);

  tienDatCocDisplay.value = rawValue
    ? Number(rawValue).toLocaleString("en-US")
    : "";
}

function resetNguoiThueForm() {
  nguoiThueForm.value = {
    hoTen: "",
    cccd: "",
    sdt: "",
    email: "a@gmail.com",
    diaChi: "",
    ngaySinh: "",
    bienSoXe: "00A0-00000",
    cccdMatTruoc: null,
    cccdMatSau: null,

    cccdMatTruocUrl: "",
    cccdMatSauUrl: "",
  };

  editingNguoiThueId.value = null;

  if (cccdMatTruocInput.value) {
    cccdMatTruocInput.value.value = "";
  }

  if (cccdMatSauInput.value) {
    cccdMatSauInput.value.value = "";
  }

  if (cccdMatTruocPreviewUrl.value) {
    URL.revokeObjectURL(cccdMatTruocPreviewUrl.value);
    cccdMatTruocPreviewUrl.value = "";
  }

  if (cccdMatSauPreviewUrl.value) {
    URL.revokeObjectURL(cccdMatSauPreviewUrl.value);
    cccdMatSauPreviewUrl.value = "";
  }
}

function resetHopDongForm() {
  hopDongForm.value = {
    maHopDong: "",
    nhaTroId: "",
    phongId: "",
    ngayBatDau: "",
    ngayKetThuc: "",
    tienThue: 0,
    chuKyThanhToan: 1,
    tienDatCoc: 1000000,
    ghiChu: "",
    giuongId: "",
    nguoiThueId: "",
    trangThai: "active",
  };

  tienThueDisplay.value = "";
  tienDatCocDisplay.value = "1,000,000";

  editingHopDongId.value = null;
}

function resetHoaDonForm() {
  hoaDonForm.value = {
    maHoaDon: "",
    thangThanhToan: "",
    tienPhong: 0,
    tienDien: 0,
    tienNuoc: 0,
    tienDichVuKhac: 0,
    tongTien: 0,
    trangThai: "chua_thanh_toan",
    ghiChu: "",
    hopDongId: "",
  };
  // Reset giá trị hiển thị trên form về mặc định
  tienDienDisplay.value = "0";
  tienNuocDisplay.value = "0";
  tienDichVuKhacDisplay.value = "0";
  tienDienError.value = "";
  tienNuocError.value = "";
  tienDichVuKhacError.value = "";
  hoaDonThangThanhToanError.value = "";
  editingHoaDonId.value = null;
}

async function saveNhaTro() {
  try {
    const payload = { ...nhaTroForm.value };

    if (editingNhaTroId.value) {
      await api.patch(`/nha-tro/${editingNhaTroId.value}`, payload);
    } else {
      await api.post("/nha-tro", payload);
    }

    resetNhaTroForm();
    showNhaTroForm.value = false;

    await loadData();
  } catch (error: any) {
    console.error("Không thể lưu nhà trọ:", error);

    alert(
      error?.response?.data?.message ??
        "Không thể lưu nhà trọ. Vui lòng thử lại.",
    );
  }
}

async function savePhong() {
  try {
    const payload = {
      maPhong: phongForm.value.maPhong,
      tangSo: Number(phongForm.value.tangSo),
      soGiuongToiDa: Number(phongForm.value.soGiuongToiDa),
      loaiPhong: phongForm.value.loaiPhong,
      dienTich: Number(phongForm.value.dienTich),
      nhaTro: {
        id: phongForm.value.nhaTroId,
      },
    };

    if (editingPhongId.value) {
      await api.patch(`/phong/${editingPhongId.value}`, payload);
    } else {
      await api.post("/phong", payload);
    }

    resetPhongForm();
    showPhongForm.value = false;

    await loadData();
  } catch (error: any) {
    console.error("Không thể lưu phòng:", error);

    alert(
      error?.response?.data?.message ??
        "Không thể lưu phòng. Vui lòng thử lại.",
    );
  }
}

function requestDeletePhong(item: any) {
  deletePhongInfo.value = {
    id: item.id,
    maPhong: item.maPhong ?? "Phòng",
    tenNhaTro: item.nhaTro?.tenNhaTro ?? "",
    soGiuong: Array.isArray(item.giuongs) ? item.giuongs.length : 0,
  };

  deletePhongErrorMessage.value = "";
  showDeletePhongModal.value = true;
}

function closeDeletePhongModal() {
  showDeletePhongModal.value = false;
  deletePhongErrorMessage.value = "";
}

function requestDeleteNguoiThue(item: any) {
  const hopDongIds = hopDongs.value
    .filter((hopDong) => {
      const nguoiThueId = hopDong.nguoiThue?.id ?? hopDong.nguoiThueId;

      return String(nguoiThueId) === String(item.id);
    })
    .map((hopDong) => hopDong.maHopDong)
    .filter(Boolean);

  deleteNguoiThueInfo.value = {
    id: item.id,
    hoTen: item.hoTen ?? "Người thuê",
    cccd: item.cccd ?? "",
    soHopDong: hopDongIds.length,
    hopDongIds,
  };

  deleteNguoiThueErrorMessage.value = "";
  showDeleteNguoiThueModal.value = true;
}

function closeDeleteNguoiThueModal() {
  showDeleteNguoiThueModal.value = false;
  deleteNguoiThueErrorMessage.value = "";
}

async function confirmDeletePhong() {
  const id = deletePhongInfo.value.id;

  if (!id) {
    return;
  }

  try {
    deletePhongErrorMessage.value = "";

    await api.delete(`/phong/${id}`);

    closeDeletePhongModal();

    if (editingPhongId.value === id) {
      resetPhongForm();
    }

    await loadData();
  } catch (error: any) {
    console.error("Không thể xóa phòng:", error);

    deletePhongErrorMessage.value =
      error?.response?.data?.message ??
      "Không thể xóa phòng. Vui lòng thử lại.";
  }
}

async function confirmDeleteNguoiThue() {
  const id = deleteNguoiThueInfo.value.id;

  if (!id) {
    return;
  }

  if (deleteNguoiThueInfo.value.hopDongIds.length > 0) {
    deleteNguoiThueErrorMessage.value =
      "Không thể xóa người thuê vì người thuê đang có hợp đồng. Cần thực hiện xóa hợp đồng trước.";
    return;
  }

  try {
    deleteNguoiThueErrorMessage.value = "";

    await api.delete(`/nguoi-thue/${id}`);

    closeDeleteNguoiThueModal();

    if (editingNguoiThueId.value === id) {
      resetNguoiThueForm();
    }

    await loadData();
  } catch (error: any) {
    console.error("Không thể xóa người thuê:", error);

    deleteNguoiThueErrorMessage.value =
      error?.response?.data?.message ??
      "Không thể xóa người thuê. Vui lòng thử lại.";
  }
}

function requestDeleteHopDong(item: any) {
  const hoaDons = item.hoaDons ?? [];

  if (hoaDons.length > 0) {
    const maHoaDon = hoaDons
      .map((hoaDon: any) => hoaDon.maHoaDon)
      .filter(Boolean)
      .join(", ");

    hopDongHoaDonErrorMessage.value = `Hợp đồng ${item.maHopDong ?? ""} đang nằm trong hóa đơn ${maHoaDon} và không thể xóa được`;

    showHopDongHoaDonErrorModal.value = true;

    return;
  }

  deleteHopDongInfo.value = {
    id: item.id,
    maHopDong: item.maHopDong ?? "Hợp đồng",
  };

  deleteHopDongErrorMessage.value = "";
  showDeleteHopDongModal.value = true;
}

function closeHopDongHoaDonErrorModal() {
  showHopDongHoaDonErrorModal.value = false;
  hopDongHoaDonErrorMessage.value = "";
}

function closeDeleteHopDongModal() {
  showDeleteHopDongModal.value = false;
  deleteHopDongErrorMessage.value = "";
}

async function confirmDeleteHopDong() {
  const id = deleteHopDongInfo.value.id;

  if (!id) {
    return;
  }

  try {
    deleteHopDongErrorMessage.value = "";

    await api.delete(`/hop-dong/${id}`);

    closeDeleteHopDongModal();

    if (editingHopDongId.value === id) {
      resetHopDongForm();
    }

    await loadData();

    alert("Xóa hợp đồng thành công.");
  } catch (error: any) {
    console.error("Không thể xóa hợp đồng:", error);

    const message = error?.response?.data?.message;

    deleteHopDongErrorMessage.value = Array.isArray(message)
      ? message.join("\n")
      : message || "Không thể xóa hợp đồng. Vui lòng thử lại.";
  }
}

async function saveGiuong() {
  const payload = {
    giuongSo: Number(giuongForm.value.giuongSo),
    giaGiuong: Number(giuongForm.value.giaGiuong || 0),
    datCocSom: Boolean(giuongForm.value.datCocSom),
    phong: {
      id: giuongForm.value.phongId,
    },
  };

  try {
    if (editingGiuongId.value) {
      await api.patch(`/giuong/${editingGiuongId.value}`, payload);
    } else {
      await api.post("/giuong", payload);
    }

    resetGiuongForm();
    showGiuongForm.value = false;
    await loadData();
  } catch (error: any) {
    console.error("Không thể lưu giường:", error);

    alert(
      error?.response?.data?.message ??
        "Không thể lưu giường. Vui lòng thử lại.",
    );
  }
}

function requestDeleteGiuong(item: any) {
  const hopDongs = Array.isArray(item.hopDongs) ? item.hopDongs : [];

  deleteGiuongInfo.value = {
    id: item.id,
    maGiuong: item.maGiuong ?? `Giường ${item.giuongSo ?? ""}`,
    maPhong: item.phong?.maPhong ?? "",
    soHopDong: hopDongs.length,
  };

  deleteGiuongErrorMessage.value = "";
  showDeleteGiuongModal.value = true;
}

function closeDeleteGiuongModal() {
  showDeleteGiuongModal.value = false;
  deleteGiuongErrorMessage.value = "";
}

async function confirmDeleteGiuong() {
  const id = deleteGiuongInfo.value.id;

  if (!id) {
    return;
  }

  try {
    deleteGiuongErrorMessage.value = "";

    await api.delete(`/giuong/${id}`);

    closeDeleteGiuongModal();

    if (editingGiuongId.value === id) {
      resetGiuongForm();
    }

    await loadData();
  } catch (error: any) {
    console.error("Không thể xóa giường:", error);

    const responseData = error?.response?.data;

    deleteGiuongErrorMessage.value =
      responseData?.message ?? "Không thể xóa giường. Vui lòng thử lại.";
  }
}

function handleCccdMatTruocChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;

  if (cccdMatTruocPreviewUrl.value) {
    URL.revokeObjectURL(cccdMatTruocPreviewUrl.value);
  }

  nguoiThueForm.value.cccdMatTruoc = file;

  if (file) {
    cccdMatTruocPreviewUrl.value = URL.createObjectURL(file);
  } else {
    cccdMatTruocPreviewUrl.value = "";
  }
}

function handleCccdMatSauChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;

  if (cccdMatSauPreviewUrl.value) {
    URL.revokeObjectURL(cccdMatSauPreviewUrl.value);
  }

  nguoiThueForm.value.cccdMatSau = file;

  if (file) {
    cccdMatSauPreviewUrl.value = URL.createObjectURL(file);
  } else {
    cccdMatSauPreviewUrl.value = "";
  }
}

async function saveNguoiThue() {
  // Kiểm tra số điện thoại trước khi tạo FormData và gọi API
  if (!validateSoDienThoai()) {
    return;
  }
  const formData = new FormData();

  formData.append("hoTen", nguoiThueForm.value.hoTen);

  formData.append("cccd", nguoiThueForm.value.cccd);

  formData.append("sdt", nguoiThueForm.value.sdt);

  formData.append("email", nguoiThueForm.value.email);

  formData.append("diaChi", nguoiThueForm.value.diaChi);

  formData.append("ngaySinh", nguoiThueForm.value.ngaySinh);

  formData.append("bienSoXe", nguoiThueForm.value.bienSoXe);

  if (nguoiThueForm.value.cccdMatTruoc) {
    formData.append("cccdMatTruoc", nguoiThueForm.value.cccdMatTruoc);
  }

  if (nguoiThueForm.value.cccdMatSau) {
    formData.append("cccdMatSau", nguoiThueForm.value.cccdMatSau);
  }

  try {
    if (editingNguoiThueId.value) {
      await api.patch(`/nguoi-thue/${editingNguoiThueId.value}`, formData);
    } else {
      await api.post("/nguoi-thue", formData);
    }

    // Lưu thành công -> clear toàn bộ form,
    // bao gồm cả 2 input file
    resetNguoiThueForm();
    showNguoiThueForm.value = false;
    await loadData();
  } catch (error: any) {
    console.error("Không thể lưu người thuê:", error);

    alert(
      error?.response?.data?.message ??
        "Không thể lưu thông tin người thuê. Vui lòng thử lại.",
    );
  }
}

async function saveHopDong() {
  if (!hopDongForm.value.ngayBatDau) {
    alert("Vui lòng nhập ngày bắt đầu.");
    return;
  }

  if (!hopDongForm.value.ngayKetThuc) {
    alert("Vui lòng nhập ngày kết thúc.");
    return;
  }

  if (!validateNgayHopDong()) {
    return;
  }

  if (!hopDongForm.value.giuongId) {
    alert("Vui lòng chọn giường.");
    return;
  }

  syncHopDongCode();

  const giaThue = Number(hopDongForm.value.tienThue || 0);
  const giuongId = hopDongForm.value.giuongId;

  if (!giuongId) {
    alert("Vui lòng chọn giường.");
    return;
  }

  // 1. Cập nhật Giá giường theo Giá thuê
  await api.patch(`/giuong/${giuongId}`, {
    giaGiuong: giaThue,
  });

  const trangThaiTheoNgay = getTrangThaiHopDongDisplay(
    hopDongForm.value.ngayBatDau,
    hopDongForm.value.ngayKetThuc,
  );
  // 2. Lưu hợp đồng
  const payload = {
    maHopDong: hopDongForm.value.maHopDong,
    ngayBatDau:
      hopDongForm.value.ngayBatDau || new Date().toISOString().slice(0, 10),
    ngayKetThuc: hopDongForm.value.ngayKetThuc || null,
    tienThue: giaThue,
    chuKyThanhToan: Number(hopDongForm.value.chuKyThanhToan || 1),
    tienDatCoc: Number(hopDongForm.value.tienDatCoc || 0),
    ghiChu: hopDongForm.value.ghiChu || null,
    trangThai:
      trangThaiTheoNgay.status === "active"
        ? "active"
        : trangThaiTheoNgay.status === "expired"
          ? "expired"
          : hopDongForm.value.trangThai,
    giuong: {
      id: giuongId,
    },
    nguoiThue: {
      id: hopDongForm.value.nguoiThueId,
    },
  };

  if (editingHopDongId.value) {
    await api.patch(`/hop-dong/${editingHopDongId.value}`, payload);
  } else {
    await api.post("/hop-dong", payload);
  }

  resetHopDongForm();
  showHopDongForm.value = false;
  await loadData();
}

function validateHoaDonTien() {
  if (tienDienError.value) {
    alert(tienDienError.value);
    return false;
  }

  if (tienNuocError.value) {
    alert(tienNuocError.value);
    return false;
  }

  if (tienDichVuKhacError.value) {
    alert(tienDichVuKhacError.value);
    return false;
  }

  return true;
}

async function saveHoaDon() {
  try {
    if (!validateHoaDonTien()) {
      return;
    }

    if (!hoaDonForm.value.hopDongId) {
      alert("Vui lòng chọn hợp đồng.");
      return;
    }

    if (!hoaDonForm.value.thangThanhToan) {
      alert("Vui lòng chọn tháng thanh toán.");
      return;
    }

    /*
     * Khi thêm mới:
     *   luôn sinh mã hóa đơn mới.
     *
     * Khi sửa:
     *   chỉ sinh lại mã nếu Hợp đồng hoặc
     *   Tháng thanh toán đã thay đổi.
     */
    if (!editingHoaDonId.value) {
      hoaDonForm.value.maHoaDon = generateHoaDonCode(
        hoaDonForm.value.hopDongId,
        hoaDonForm.value.thangThanhToan,
      );
    }

    calculateHoaDonTongTien();

    const payload = {
      maHoaDon: hoaDonForm.value.maHoaDon,

      thangThanhToan: hoaDonForm.value.thangThanhToan,

      tienPhong: Number(hoaDonForm.value.tienPhong || 0),

      tienDien: Number(hoaDonForm.value.tienDien || 0),

      tienNuoc: Number(hoaDonForm.value.tienNuoc || 0),

      tienDichVuKhac: Number(hoaDonForm.value.tienDichVuKhac || 0),

      tongTien: Number(hoaDonForm.value.tongTien || 0),

      trangThai: hoaDonForm.value.trangThai,

      ghiChu: hoaDonForm.value.ghiChu || null,

      hopDong: {
        id: hoaDonForm.value.hopDongId,
      },
    };

    if (editingHoaDonId.value) {
      await api.patch(`/hoa-don/${editingHoaDonId.value}`, payload);
    } else {
      await api.post("/hoa-don", payload);
    }

    resetHoaDonForm();
    showHoaDonForm.value = false;
    await loadData();
  } catch (error: any) {
    console.error("Không thể lưu hóa đơn:", error);

    alert(
      error?.response?.data?.message ??
        "Không thể cập nhật hóa đơn. Vui lòng thử lại.",
    );
  }
}

const showDeleteNhaTroModal = ref(false);
const showDeleteGiuongModal = ref(false);
const showDeletePhongModal = ref(false);

const deleteGiuongInfo = ref({
  id: "",
  maGiuong: "",
  maPhong: "",
  soHopDong: 0,
});
const showDeleteNguoiThueModal = ref(false);

const deleteNguoiThueInfo = ref({
  id: "",
  hoTen: "",
  cccd: "",
  soHopDong: 0,
  hopDongIds: [] as string[],
});

const deleteNguoiThueErrorMessage = ref("");
const deleteGiuongErrorMessage = ref("");

const deletePhongInfo = ref({
  id: "",
  maPhong: "",
  tenNhaTro: "",
  soGiuong: 0,
});

const deletePhongErrorMessage = ref("");
const deleteNhaTroInfo = ref({
  id: "",
  tenNhaTro: "",
  soPhong: 0,
  soGiuong: 0,
  soHopDong: 0,
  soHoaDon: 0,
});

const deleteErrorMessage = ref("");

function closeDeleteNhaTroModal() {
  showDeleteNhaTroModal.value = false;
  deleteErrorMessage.value = "";
}

async function deleteNhaTro(id: string) {
  try {
    deleteErrorMessage.value = "";

    const nhaTro = nhaTros.value.find((item) => item.id === id);

    deleteNhaTroInfo.value = {
      id,
      tenNhaTro: nhaTro?.tenNhaTro ?? "Nhà trọ",
      soPhong: 0,
      soGiuong: 0,
      soHopDong: 0,
      soHoaDon: 0,
    };

    await api.delete(`/nha-tro/${id}`);

    closeDeleteNhaTroModal();

    if (editingNhaTroId.value === id) {
      resetNhaTroForm();
    }

    await loadData();
  } catch (error: any) {
    if (error.response?.status === 409) {
      const responseData = error.response?.data;

      const data = responseData?.data ?? {};

      deleteNhaTroInfo.value = {
        id,
        tenNhaTro:
          data.tenNhaTro ??
          nhaTros.value.find((item) => item.id === id)?.tenNhaTro ??
          "Nhà trọ",
        soPhong: Number(data.soPhong ?? 0),
        soGiuong: Number(data.soGiuong ?? 0),
        soHopDong: Number(data.soHopDong ?? 0),
        soHoaDon: Number(data.soHoaDon ?? 0),
      };

      deleteErrorMessage.value =
        responseData?.message ??
        "Không thể xóa nhà trọ vì đang có dữ liệu liên quan.";

      showDeleteNhaTroModal.value = true;

      return;
    }

    console.error("Không thể xóa nhà trọ:", error);

    deleteErrorMessage.value =
      error.response?.data?.message ?? "Có lỗi xảy ra khi xóa nhà trọ.";

    showDeleteNhaTroModal.value = true;
  }
}

function requestDeleteNhaTro(item: any) {
  deleteNhaTroInfo.value = {
    id: item.id,
    tenNhaTro: item.tenNhaTro ?? "Nhà trọ",
    soPhong: 0,
    soGiuong: 0,
    soHopDong: 0,
    soHoaDon: 0,
  };

  deleteErrorMessage.value = "";
  showDeleteNhaTroModal.value = true;
}

async function confirmDeleteNhaTro() {
  const id = deleteNhaTroInfo.value.id;

  if (!id) {
    return;
  }

  await deleteNhaTro(id);
}

function editNhaTro(item: any) {
  editingNhaTroId.value = item.id;
  nhaTroForm.value = {
    maNhaTro: item.maNhaTro ?? "",
    tenNhaTro: item.tenNhaTro ?? "",
    diaChi: item.diaChi ?? "",
    soTang: item.soTang ?? 1,
    moTa: item.moTa ?? "",
  };
  showNhaTroForm.value = true;
  currentTab.value = "nhaTro";
}

function editPhong(item: any) {
  editingPhongId.value = item.id;
  phongForm.value = {
    maPhong: item.maPhong ?? "",
    tangSo: item.tangSo ?? "",
    soGiuongToiDa: item.soGiuongToiDa ?? 8,
    loaiPhong: item.loaiPhong ?? "phong_tieu_chuan",
    dienTich: item.dienTich ?? 25,
    nhaTroId: item.nhaTro?.id ?? "",
  };
  showPhongForm.value = true;
  currentTab.value = "phong";
}

function updateMaPhongByTang() {
  if (!phongForm.value.nhaTroId || !phongForm.value.tangSo) {
    phongForm.value.maPhong = "";
    return;
  }

  const nhaTro = nhaTros.value.find(
    (item) => item.id === phongForm.value.nhaTroId,
  );

  if (!nhaTro?.maNhaTro) {
    phongForm.value.maPhong = "";
    return;
  }

  phongForm.value.maPhong = `${nhaTro.maNhaTro}_T${phongForm.value.tangSo}`;
}

function editGiuong(item: any) {
  editingGiuongId.value = item.id;

  const giaGiuong = Number(item.giaGiuong ?? 0);

  giuongForm.value = {
    nhaTroId: item.phong?.nhaTro?.id ?? "",
    phongId: item.phong?.id ?? "",
    giuongSo: item.giuongSo != null ? String(item.giuongSo) : "",
    datCocSom: Boolean(item.datCocSom),
    giaGiuong,
  };

  giaGiuongDisplay.value = giaGiuong ? giaGiuong.toLocaleString("en-US") : "";
  showGiuongForm.value = true;
  currentTab.value = "giuong";
}

function editNguoiThue(item: any) {
  if (!item?.id) {
    return;
  }

  editingNguoiThueId.value = item.id;

  nguoiThueForm.value = {
    hoTen: item.hoTen ?? "",
    cccd: item.cccd ?? "",
    sdt: item.sdt ?? "",
    email: item.email ?? "",
    diaChi: item.diaChi ?? "",
    ngaySinh: item.ngaySinh ? String(item.ngaySinh).slice(0, 10) : "",
    bienSoXe: item.bienSoXe ?? "",
    cccdMatTruoc: null,
    cccdMatSau: null,
    cccdMatTruocUrl: item.cccdMatTruoc ?? "",
    cccdMatSauUrl: item.cccdMatSau ?? "",
  };

  cccdMatTruocPreviewUrl.value = item.cccdMatTruoc
    ? getImageUrl(item.cccdMatTruoc)
    : "";

  cccdMatSauPreviewUrl.value = item.cccdMatSau
    ? getImageUrl(item.cccdMatSau)
    : "";

  showNguoiThueDetail.value = false;
  selectedNguoiThue.value = null;

  showNguoiThueForm.value = true;
}

function editHopDong(item: any) {
  editingHopDongId.value = item.id;

  const nhaTroId = item.giuong?.phong?.nhaTro?.id ?? "";
  const phongId = item.giuong?.phong?.id ?? "";

  const tienThue = Number(item.tienThue ?? 0);
  const tienDatCoc = Number(item.tienDatCoc ?? 0);

  hopDongForm.value = {
    maHopDong: item.maHopDong ?? "",
    nhaTroId,
    phongId,

    ngayBatDau: item.ngayBatDau
      ? new Date(item.ngayBatDau).toISOString().slice(0, 10)
      : "",

    ngayKetThuc: item.ngayKetThuc
      ? new Date(item.ngayKetThuc).toISOString().slice(0, 10)
      : "",

    tienThue,

    chuKyThanhToan: Number(item.chuKyThanhToan ?? 1),

    tienDatCoc,

    ghiChu: item.ghiChu ?? "",

    giuongId: item.giuong?.id ?? "",

    nguoiThueId: item.nguoiThue?.id ?? "",

    trangThai: item.trangThai ?? "active",
  };

  // Hiển thị Giá thuê và Đặt cọc đã lưu
  tienThueDisplay.value = tienThue ? tienThue.toLocaleString("en-US") : "";

  tienDatCocDisplay.value = tienDatCoc
    ? tienDatCoc.toLocaleString("en-US")
    : "";
  showHopDongForm.value = true;
  currentTab.value = "hopDong";
}

function editHoaDon(item: any) {
  editingHoaDonId.value = item.id;
  const tienPhong = Number(item.tienPhong ?? 0);
  const tienDien = Number(item.tienDien ?? 0);
  const tienNuoc = Number(item.tienNuoc ?? 0);
  const tienDichVuKhac = Number(item.tienDichVuKhac ?? 0);
  hoaDonForm.value = {
    maHoaDon: item.maHoaDon ?? "",
    thangThanhToan: item.thangThanhToan
      ? new Date(item.thangThanhToan).toISOString().slice(0, 10)
      : "",
    tienPhong,
    tienDien,
    tienNuoc,
    tienDichVuKhac,
    tongTien: tienPhong + tienDien + tienNuoc + tienDichVuKhac,
    trangThai: item.trangThai ?? "chua_thanh_toan",
    ghiChu: item.ghiChu ?? "",
    hopDongId: item.hopDong?.id ?? "",
  };
  // Cập nhật giá trị hiển thị, KHÔNG tạo ref mới
  tienDienDisplay.value = tienDien ? tienDien.toLocaleString("en-US") : "0";

  tienNuocDisplay.value = tienNuoc ? tienNuoc.toLocaleString("en-US") : "0";

  tienDichVuKhacDisplay.value = tienDichVuKhac
    ? tienDichVuKhac.toLocaleString("en-US")
    : "0";
  showHoaDonForm.value = true;
  currentTab.value = "hoaDon";
}

function updateHoaDonTienPhong() {
  const hopDongId = hoaDonForm.value.hopDongId;

  if (!hopDongId) {
    hoaDonForm.value.tienPhong = 0;
    calculateHoaDonTongTien();
    return;
  }

  const hopDong = hopDongs.value.find((item) => item.id === hopDongId);

  hoaDonForm.value.tienPhong = Number(hopDong?.tienThue ?? 0);

  calculateHoaDonTongTien();
}

function calculateHoaDonTongTien() {
  const tienPhong = Number(hoaDonForm.value.tienPhong || 0);

  const tienDien = Number(hoaDonForm.value.tienDien || 0);

  const tienNuoc = Number(hoaDonForm.value.tienNuoc || 0);

  const tienDichVuKhac = Number(hoaDonForm.value.tienDichVuKhac || 0);

  hoaDonForm.value.tongTien = tienPhong + tienDien + tienNuoc + tienDichVuKhac;
}

function formatCurrency(value: number | string | undefined) {
  const numberValue = Number(value ?? 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

const filteredPhongsByNhaTro = computed(() => {
  if (!giuongForm.value.nhaTroId) return [];
  return phongs.value.filter(
    (item) => item.nhaTro?.id === giuongForm.value.nhaTroId,
  );
});

function handleNhaTroChangeForGiuong() {
  giuongForm.value.phongId = "";
  giuongForm.value.giuongSo = "";
}

function handleHoaDonHopDongChange() {
  const hopDongId = hoaDonForm.value.hopDongId;

  if (!hopDongId) {
    hoaDonForm.value.tienPhong = 0;
    calculateHoaDonTongTien();
    return;
  }

  const hopDong = hopDongs.value.find((item: any) => item.id === hopDongId);

  if (!hopDong) {
    hoaDonForm.value.tienPhong = 0;
    calculateHoaDonTongTien();
    return;
  }

  hoaDonForm.value.tienPhong = Number(hopDong.tienThue ?? 0);

  calculateHoaDonTongTien();
}

function generateHopDongCode(giuongId: string) {
  const giuong = giuongs.value.find((item) => item.id === giuongId);

  if (!giuong?.maGiuong) {
    return "";
  }

  // Mã hợp đồng = đúng bằng Mã giường
  //
  // Ví dụ:
  // Mã giường:   HM_T1_G1
  // Mã hợp đồng: HM_T1_G1

  return giuong.maGiuong;
}

function generateHoaDonCode(
  hopDongId: string,
  thangThanhToan: string,
  excludeHoaDonId?: string,
) {
  const hopDong = hopDongs.value.find((item) => item.id === hopDongId);

  if (!hopDong?.maHopDong) {
    return "";
  }

  const date = thangThanhToan
    ? new Date(`${thangThanhToan}T00:00:00`)
    : new Date();

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Phần mã chung của hóa đơn
  // Ví dụ: CG_T2_G3_TH3/2026
  const baseCode = `${hopDong.maHopDong}_TH${month}/${year}`;

  // Lấy các hóa đơn đã tồn tại cùng hợp đồng + cùng tháng/năm
  const existingCodes = hoaDons.value
    .filter((item) => item.id !== excludeHoaDonId)
    .map((item) => item.maHoaDon)
    .filter(
      (code): code is string =>
        typeof code === "string" && code.startsWith(`${baseCode}_`),
    );

  // Tìm số thứ tự lớn nhất
  let maxSequence = 0;

  for (const code of existingCodes) {
    const match = code.match(
      new RegExp(`^${baseCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_(\\d+)$`),
    );

    if (match) {
      const sequence = Number(match[1]);

      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  }

  // Tăng số thứ tự và luôn hiển thị 2 chữ số
  const nextSequence = String(maxSequence + 1).padStart(2, "0");

  return `${baseCode}_${nextSequence}`;
}

function syncHopDongCode() {
  if (!hopDongForm.value.giuongId) {
    hopDongForm.value.maHopDong = "";
    return;
  }

  hopDongForm.value.maHopDong = generateHopDongCode(hopDongForm.value.giuongId);
}

function syncHoaDonCode() {
  if (!hoaDonForm.value.hopDongId) {
    hoaDonForm.value.maHoaDon = "";
    return;
  }

  hoaDonForm.value.maHoaDon = generateHoaDonCode(
    hoaDonForm.value.hopDongId,
    hoaDonForm.value.thangThanhToan,
    editingHoaDonId.value ?? undefined,
  );
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <Login
    v-if="!accessToken && authMode === 'login'"
    @login-success="handleLogin"
    @register="authMode = 'register'"
  />

  <Register
    v-else-if="!accessToken && authMode === 'register'"
    @login="authMode = 'login'"
  />

  <div v-else class="app-shell" :class="{ 'menu-open': isMenuOpen }">
    <!-- =====================================================
         NÚT MỞ MENU
         ===================================================== -->
    <button
      v-if="!isMenuOpen"
      type="button"
      class="menu-toggle menu-open-button"
      aria-label="Mở menu"
      title="Mở menu"
      @click="toggleMenu"
    >
      ☰
    </button>

    <!-- =====================================================
         SIDEBAR
         ===================================================== -->
    <aside class="sidebar" :class="{ open: isMenuOpen }">
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-mark">
  <img src="/images/nhatroicon.jpg" alt="Nhà trọ" />
</div>
          <div>
            <h1>Nhà Trọ {{ currentUser.tenHienThi || currentUser.username }}</h1>
            <small>Hệ thống quản lý</small>
          </div>
        </div>

        <!-- Nút Tắt menu -->
        <button
          type="button"
          class="menu-toggle menu-close-button"
          aria-label="Tắt menu"
          title="Tắt menu"
          @click="closeMenu"
        >
          ×
        </button>
      </div>

      <nav class="nav">
        <button
          v-for="tab in tabs"
          :key="tab"
          type="button"
          :class="['nav-item', { active: currentTab === tab }]"
          @click="
            currentTab = tab;
            closeMenu();
          "
        >
          <span class="nav-icon">
            <template v-if="tab === 'dashboard'"> ⌂ </template>

            <template v-else-if="tab === 'nhaTro'"> 🏠 </template>

            <template v-else-if="tab === 'phong'"> ▦ </template>

            <template v-else-if="tab === 'giuong'"> ▤ </template>

            <template v-else-if="tab === 'nguoiThue'"> ♙ </template>

            <template v-else-if="tab === 'hopDong'"> ▤ </template>

            <template v-else> ▣ </template>
          </span>

          <span class="nav-label">
            {{
              tab === "dashboard"
                ? "Tổng quan"
                : tab === "nhaTro"
                  ? "Nhà trọ"
                  : tab === "phong"
                    ? "Phòng"
                    : tab === "giuong"
                      ? "Giường"
                      : tab === "nguoiThue"
                        ? "Người thuê"
                        : tab === "hopDong"
                          ? "Hợp đồng"
                          : "Hóa đơn"
            }}
          </span>
        </button>
      </nav>
    </aside>

    <!-- =====================================================
         OVERLAY
         Dùng cho màn hình nhỏ
         ===================================================== -->
    <div v-if="isMenuOpen" class="menu-overlay" @click="closeMenu"></div>

    <!-- =====================================================
         NỘI DUNG CHÍNH
         ===================================================== -->
    <div class="content-column">
    <main class="content">
      <header class="topbar">
        <div>
          <p class="eyebrow">Hệ thống</p>
          <h2>Quản lý nhà trọ {{ currentUser.tenHienThi || currentUser.username }}</h2>
        </div>
        <div class="header-actions">

    
  </div>
        <button class="primary" @click="loadData">Làm mới dữ liệu</button>
        <button
      type="button"
      class="logout-button"
      @click="logout"
    >
      Đăng xuất
    </button>
      </header>

      <!-- ===================================================
           DASHBOARD
           =================================================== -->
      <section v-if="currentTab === 'dashboard'" class="panel-grid">
        <div class="metric-card metric-nhatro highlight">
          <div class="metric-decor" aria-hidden="true"></div>

          <div class="metric-body">
            <span>Nhà trọ</span>
            <strong>{{ summary.totalNhaTro }}</strong>
          </div>
        </div>

        <div class="metric-card metric-phong">
          <div class="metric-decor" aria-hidden="true"></div>

          <div class="metric-body">
            <span>Phòng</span>
            <strong>{{ summary.totalPhong }}</strong>
          </div>
        </div>

        <div class="metric-card metric-giuong">
          <div class="metric-decor" aria-hidden="true"></div>

          <div class="metric-body">
            <span>Giường</span>
            <strong>{{ summary.totalGiuong }}</strong>
          </div>
        </div>

        <div class="metric-card metric-hopdong">
          <div class="metric-decor" aria-hidden="true"></div>

          <div class="metric-body">
            <span>Hợp đồng</span>
            <strong>{{ summary.totalHopDong }}</strong>
          </div>
        </div>

        <div class="metric-card metric-hoadon">
          <div class="metric-decor" aria-hidden="true"></div>

          <div class="metric-body">
            <span>Hóa đơn</span>
            <strong>{{ summary.totalHoaDon }}</strong>
          </div>
        </div>
        <div
          v-for="house in nhaTroDashboard"
          :key="house.id"
          class="dashboard-house-card"
        >
          <!-- =====================================================
       THÔNG TIN NHÀ TRỌ
       ===================================================== -->

          <div class="dashboard-house-header">
            <div>
              <h3>
                {{ house.tenNhaTro }}

                <span v-if="house.maNhaTro"> ({{ house.maNhaTro }}) </span>
              </h3>

              <p>Tổng số tầng: {{ house.soTang }} tầng</p>
            </div>
          </div>

          <!-- =====================================================
       3 BIỂU ĐỒ
       ===================================================== -->

          <div class="dashboard-chart-grid">
            <!-- =================================================
         BIỂU ĐỒ 1
         ================================================= -->

            <div class="dashboard-chart-card">
              <h4>Tỷ lệ phòng có người ở</h4>

              <div class="chart-container">
                <Doughnut
                  :data="getPhongChartData(house)"
                  :options="doughnutOptions"
                  :plugins="[doughnutCenterTextPlugin]"
                />
              </div>

              <div class="chart-value">
                <strong>
                  {{ house.totalPhongCoNguoi }}/{{ house.totalPhong }}
                </strong>

                <span> phòng </span>
              </div>

              <div class="chart-description">
                <div class="description-icon">👥</div>

                <p>
                  Tỷ lệ phòng đang có người ở so với tổng số phòng của nhà trọ.
                </p>
              </div>
            </div>

            <!-- =================================================
         BIỂU ĐỒ 2
         ================================================= -->

            <div class="dashboard-chart-card">
              <h4>Tỷ lệ số giường có người ở</h4>

              <div class="chart-container">
                <Doughnut
                  :data="getGiuongChartData(house)"
                  :options="doughnutOptions"
                  :plugins="[doughnutCenterTextPlugin]"
                />
              </div>

              <div class="chart-value">
                <strong>
                  {{ house.totalGiuongCoNguoi }}/{{ house.totalGiuong }}
                </strong>

                <span> giường </span>
              </div>

              <div class="chart-description">
                <div class="description-icon">🛏️</div>

                <p>
                  Tỷ lệ số giường đang có người ở so với tổng số giường của nhà
                  trọ.
                </p>
              </div>
            </div>

            <!-- =================================================
         BIỂU ĐỒ 3
         ================================================= -->

            <div class="dashboard-chart-card">
              <h4>Tỷ lệ giường đã thanh toán hóa đơn</h4>

              <div class="chart-container">
                <Doughnut
                  :data="getThanhToanChartData(house)"
                  :options="doughnutOptions"
                  :plugins="[doughnutCenterTextPlugin]"
                />
              </div>

              <div class="chart-value">
                <strong>
                  {{ house.totalGiuongDaThanhToan }}/{{
                    house.totalGiuongCoHoaDonThangHienTai
                  }}
                </strong>

                <span> hóa đơn </span>
              </div>

              <div class="chart-description">
                <div class="description-icon">🧾</div>

                <p>
                  Tỷ lệ giường đã thanh toán hóa đơn so với tổng số giường có
                  hóa đơn trong tháng hiện tại.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===================================================
           NHÀ TRỌ
           =================================================== -->
      <section v-else-if="currentTab === 'nhaTro'" class="panel-grid">
        <!-- FORM THÊM / SỬA NHÀ TRỌ -->
        <div v-if="showNhaTroForm" class="panel">
          <h3>
            {{ editingNhaTroId ? "Sửa nhà trọ" : "Thêm nhà trọ" }}
          </h3>

          <form @submit.prevent="saveNhaTro" class="form-grid">
            <label>
              {{ requiredLabel("Mã nhà trọ") }}

              <input
                v-model="nhaTroForm.maNhaTro"
                placeholder="Ví dụ: CG"
                required
              />
            </label>

            <label>
              {{ requiredLabel("Tên nhà trọ") }}

              <input
                v-model="nhaTroForm.tenNhaTro"
                placeholder="Tên nhà trọ"
                required
              />
            </label>

            <label>
              {{ requiredLabel("Địa chỉ") }}

              <input
                v-model="nhaTroForm.diaChi"
                placeholder="Địa chỉ"
                required
              />
            </label>

            <label>
              {{ requiredLabel("Số tầng") }}

              <input
                v-model.number="nhaTroForm.soTang"
                type="number"
                min="1"
                placeholder="Số tầng"
                required
              />
            </label>

            <label>
              {{ requiredLabel("Mô tả") }}

              <textarea
                v-model="nhaTroForm.moTa"
                placeholder="Mô tả"
                rows="3"
              ></textarea>
            </label>

            <div class="actions">
              <button class="primary" type="submit">
                {{ editingNhaTroId ? "Cập nhật" : "Lưu" }}
              </button>

              <button class="secondary" type="button" @click="closeNhaTroForm">
                Hủy
              </button>
            </div>
          </form>
        </div>

        <!-- DANH SÁCH NHÀ TRỌ -->
        <div v-else class="panel">
          <div class="panel-header">
            <h3>Danh sách nhà trọ</h3>

            <button type="button" class="primary" @click="openAddNhaTroForm">
              Thêm nhà trọ
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên</th>
                <th>Địa chỉ</th>
                <th>Số tầng</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in nhaTros" :key="item.id">
                <td>{{ item.maNhaTro }}</td>

                <td>{{ item.tenNhaTro }}</td>

                <td>{{ item.diaChi }}</td>

                <td>{{ item.soTang }}</td>

                <td class="row-actions">
                  <button class="table-btn edit" @click="editNhaTro(item)">
                    Sửa
                  </button>

                  <button
                    class="table-btn delete"
                    @click="requestDeleteNhaTro(item)"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===================================================
           PHÒNG
           =================================================== -->
      <section v-else-if="currentTab === 'phong'" class="panel-grid">
        <!-- FORM THÊM / SỬA PHÒNG -->
        <div v-if="showPhongForm" class="panel">
          <h3>
            {{ editingPhongId ? "Sửa phòng" : "Thêm phòng" }}
          </h3>

          <form @submit.prevent="savePhong" class="form-grid">
            <label>
              {{ requiredLabel("Nhà trọ") }}

              <select
                v-model="phongForm.nhaTroId"
                @change="handleNhaTroChange"
                required
              >
                <option value="">Chọn nhà trọ</option>

                <option v-for="item in nhaTros" :key="item.id" :value="item.id">
                  {{ item.tenNhaTro }}
                </option>
              </select>
            </label>

            <label>
              {{ requiredLabel("Tầng số") }}

              <select
                v-model="phongForm.tangSo"
                @change="updateMaPhongByTang"
                required
                :disabled="!phongForm.nhaTroId"
              >
                <option value="" disabled>-- Chọn tầng --</option>

                <option
                  v-for="floor in tangSoOptions"
                  :key="floor"
                  :value="floor"
                >
                  Tầng {{ floor }}
                </option>
              </select>
            </label>

            <label>
              {{ requiredLabel("Số giường tối đa") }}

              <input
                v-model.number="phongForm.soGiuongToiDa"
                type="number"
                min="1"
                max="8"
                placeholder="Số giường tối đa"
                required
              />
            </label>

            <label>
              {{ requiredLabel("Loại phòng") }}

              <input
                v-model="phongForm.loaiPhong"
                placeholder="Loại phòng"
                required
              />
            </label>

            <label>
              {{ requiredLabel("Diện tích") }}

              <input
                v-model.number="phongForm.dienTich"
                type="number"
                min="1"
                placeholder="Diện tích"
                required
              />
            </label>

            <div class="actions">
              <button class="primary" type="submit">
                {{ editingPhongId ? "Cập nhật" : "Lưu" }}
              </button>

              <button class="secondary" type="button" @click="closePhongForm">
                Hủy
              </button>
            </div>
          </form>
        </div>

        <!-- DANH SÁCH PHÒNG -->
        <div v-else class="panel">
          <div class="panel-header">
            <h3>Danh sách phòng</h3>

            <button type="button" class="primary" @click="openAddPhongForm">
              Thêm phòng
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Mã phòng</th>
                <th>Nhà trọ</th>
                <th>Tầng số</th>
                <th>Loại</th>
                <th>Số giường</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in phongs" :key="item.id">
                <td>
                  {{ item.maPhong }}
                </td>

                <td>
                  {{ item.nhaTro?.tenNhaTro || item.nhaTro?.maNhaTro }}
                </td>

                <td>
                  {{ item.tangSo }}
                </td>

                <td>
                  {{ item.loaiPhong }}
                </td>

                <td>
                  {{ item.soGiuongToiDa }}
                </td>

                <td class="row-actions">
                  <button class="table-btn edit" @click="editPhong(item)">
                    Sửa
                  </button>

                  <button
                    type="button"
                    class="table-btn delete"
                    @click.stop="requestDeletePhong(item)"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===================================================
           GIƯỜNG
           =================================================== -->
      <section v-else-if="currentTab === 'giuong'" class="panel-grid">
        <!-- FORM THÊM / SỬA GIƯỜNG -->
        <div v-if="showGiuongForm" class="panel">
          <h3>
            {{ editingGiuongId ? "Sửa giường" : "Thêm giường" }}
          </h3>

          <form @submit.prevent="saveGiuong" class="form-grid">
            <!-- Giữ nguyên các trường nhập Giường hiện tại -->

            <label>
              {{ requiredLabel("Nhà trọ") }}

              <select v-model="giuongForm.nhaTroId" required>
                <option value="">Chọn nhà trọ</option>

                <option v-for="item in nhaTros" :key="item.id" :value="item.id">
                  {{ item.maNhaTro }} -
                  {{ item.tenNhaTro }}
                </option>
              </select>
            </label>

            <label>
              {{ requiredLabel("Phòng") }}

              <select
                v-model="giuongForm.phongId"
                required
                :disabled="!giuongForm.nhaTroId"
              >
                <option value="">Chọn phòng</option>

                <option v-for="item in phongs" :key="item.id" :value="item.id">
                  {{ item.maPhong }}
                </option>
              </select>
            </label>

            <label>
              {{ requiredLabel("Giường số") }}

              <select
                v-model="giuongForm.giuongSo"
                required
                :disabled="!giuongForm.phongId"
              >
                <option value="">Chọn giường</option>

                <option v-for="so in giuongSoOptions" :key="so" :value="so">
                  Giường {{ so }}
                </option>
              </select>
            </label>

            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="giuongForm.datCocSom" type="checkbox" />
                Đặt cọc sớm
              </label>
            </div>

            <label>
              {{ requiredLabel("Giá giường") }}

              <input
                :value="giaGiuongDisplay"
                @input="handleGiaGiuongInput"
                inputmode="numeric"
                required
              />
            </label>

            <div class="actions">
              <button type="submit" class="primary">
                {{ editingGiuongId ? "Cập nhật" : "Lưu" }}
              </button>

              <button type="button" class="secondary" @click="closeGiuongForm">
                Hủy
              </button>
            </div>
          </form>
        </div>

        <!-- DANH SÁCH GIƯỜNG -->
        <div v-else class="panel">
          <div class="panel-header">
            <h3>Danh sách giường</h3>

            <button type="button" class="primary" @click="openAddGiuongForm">
              Thêm giường
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Mã giường</th>
                <!-- <th>Nhà trọ</th>
          <th>Phòng</th>
          <th>Giường số</th> -->
                <th class="dat-coc-header">Cọc sớm</th>
                <th>Giá giường</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in giuongs" :key="item.id">
                <td>{{ item.maGiuong }}</td>

                <!-- <td>
            {{ item.phong?.nhaTro?.maNhaTro }}
            -
            {{ item.phong?.nhaTro?.tenNhaTro }}
          </td>

          <td>
            {{ item.phong?.maPhong }}
          </td>
   
          <td>
            {{ item.giuongSo }}
          </td> -->
                <td class="dat-coc-cell">
                  <input
                    type="checkbox"
                    :checked="Boolean(item.datCocSom)"
                    tabindex="-1"
                    aria-readonly="true"
                    :class="{
                      'dat-coc-checked': Boolean(item.datCocSom),
                      'dat-coc-unchecked': !Boolean(item.datCocSom),
                    }"
                  />
                </td>
                <td>
                  {{ Number(item.giaGiuong ?? 0).toLocaleString("vi-VN") }}
                </td>
                <td class="status-cell">
                  <span
                    :class="[
                      'status-badge',
                      item.trangThai === 'da_thue'
                        ? 'status-active'
                        : 'status-empty',
                    ]"
                  >
                    {{ item.trangThai === "da_thue" ? "Đã thuê" : "Chưa thuê" }}
                  </span>
                </td>
                <td class="row-actions">
                  <button
                    type="button"
                    class="table-btn edit"
                    @click="editGiuong(item)"
                  >
                    Sửa
                  </button>

                  <button
                    type="button"
                    class="table-btn delete"
                    @click="requestDeleteGiuong(item)"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===================================================
           NGƯỜI THUÊ
           =================================================== -->
      <section v-else-if="currentTab === 'nguoiThue'" class="panel-grid">
        <!-- CHI TIẾT -->
        <NguoiThueDetail
          v-if="showNguoiThueDetail && selectedNguoiThue"
          :nguoi-thue="selectedNguoiThue"
          @close="closeNguoiThueDetail"
        />

        <!-- FORM THÊM / SỬA -->
        <!-- FORM THÊM / SỬA NGƯỜI THUÊ -->
        <div v-else-if="showNguoiThueForm" class="panel">
          <div class="panel-header">
            <h3>
              {{ editingNguoiThueId ? "Sửa người thuê" : "Thêm người thuê" }}
            </h3>

            <button
              type="button"
              class="secondary"
              @click="showNguoiThueForm = false"
            >
              Quay lại
            </button>
          </div>

          <form class="form-grid" @submit.prevent="saveNguoiThue">
            <label>
              {{ requiredLabel("Họ tên") }}

              <input v-model="nguoiThueForm.hoTen" type="text" required />
            </label>

            <label>
              {{ requiredLabel("CCCD") }}

              <input v-model="nguoiThueForm.cccd" type="text" required />
            </label>

            <label>
              {{ requiredLabel("Số điện thoại") }}

              <input
                v-model="nguoiThueForm.sdt"
                type="text"
                @input="handleSoDienThoaiInput"
                required
              />

              <small v-if="soDienThoaiError" class="error-text">
                {{ soDienThoaiError }}
              </small>
            </label>

            <label>
              Email

              <input v-model="nguoiThueForm.email" type="email" />
            </label>

            <label>
              Địa chỉ

              <input v-model="nguoiThueForm.diaChi" type="text" />
            </label>

            <label>
              Ngày sinh

              <input v-model="nguoiThueForm.ngaySinh" type="date" />
            </label>

            <label>
              Biển số xe

              <input v-model="nguoiThueForm.bienSoXe" type="text" />
            </label>

            <div class="cccd-edit-section">
              <!-- CCCD MẶT TRƯỚC -->
              <div class="cccd-edit-card">
                <label>
                  CCCD mặt trước

                  <input
                    ref="cccdMatTruocInput"
                    type="file"
                    accept="image/*"
                    @change="handleCccdMatTruocChange"
                  />
                </label>

                <div
                  v-if="cccdMatTruocPreviewUrl"
                  class="cccd-edit-image-wrapper"
                >
                  <img
                    :src="cccdMatTruocPreviewUrl"
                    alt="CCCD mặt trước"
                    class="cccd-edit-image"
                  />
                </div>

                <div v-else class="cccd-edit-empty">
                  Chưa có ảnh CCCD mặt trước
                </div>
              </div>

              <!-- CCCD MẶT SAU -->
              <div class="cccd-edit-card">
                <label>
                  CCCD mặt sau

                  <input
                    ref="cccdMatSauInput"
                    type="file"
                    accept="image/*"
                    @change="handleCccdMatSauChange"
                  />
                </label>

                <div
                  v-if="cccdMatSauPreviewUrl"
                  class="cccd-edit-image-wrapper"
                >
                  <img
                    :src="cccdMatSauPreviewUrl"
                    alt="CCCD mặt sau"
                    class="cccd-edit-image"
                  />
                </div>

                <div v-else class="cccd-edit-empty">
                  Chưa có ảnh CCCD mặt sau
                </div>
              </div>
            </div>

            <div class="form-actions">
              <div class="form-actions-right">
                <button
                  type="button"
                  class="secondary"
                  @click="showNguoiThueForm = false"
                >
                  Hủy
                </button>

                <button type="submit" class="primary">
                  {{ editingNguoiThueId ? "Cập nhật" : "Thêm" }}
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- DANH SÁCH -->
        <div v-else class="panel">
          <div class="panel-header">
  <h3>Danh sách người thuê</h3>

  <div class="nguoi-thue-header-actions">
    <div class="nguoi-thue-search">
      <input
        v-model="nguoiThueSearch"
        type="text"
        placeholder="Tìm Họ tên hoặc CCCD..."
        autocomplete="off"
      />

      <button
        v-if="nguoiThueSearch"
        type="button"
        class="nguoi-thue-search-clear"
        @click="nguoiThueSearch = ''"
      >
        ×
      </button>
    </div>

    <button
      type="button"
      class="primary"
      @click="openAddNguoiThueForm"
    >
      Thêm người thuê
    </button>
  </div>
</div>

          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>CCCD</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Biển số xe</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in filteredNguoiThues" :key="item.id">
                <td>
                  <button
                    type="button"
                    class="nguoi-thue-name-link"
                    @click="openNguoiThueDetail(item)"
                  >
                    {{ item.hoTen }}
                  </button>
                </td>

                <td>{{ item.cccd }}</td>

                <td>{{ item.sdt }}</td>

                <td>{{ item.email }}</td>

                <td>{{ item.bienSoXe }}</td>

                <td class="row-actions">
                  <button
                    type="button"
                    class="table-btn edit"
                    @click="editNguoiThue(item)"
                  >
                    Sửa
                  </button>

                  <button
                    type="button"
                    class="table-btn delete"
                    @click="requestDeleteNguoiThue(item)"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
              <tr v-if="filteredNguoiThues.length === 0">
                <td colspan="6" class="nguoi-thue-empty">
                  Không tìm thấy người thuê phù hợp.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===================================================
           HỢP ĐỒNG
           =================================================== -->
      <section v-else-if="currentTab === 'hopDong'" class="panel-grid">
        <!-- Chi tiết người thuê -->
        <NguoiThueDetail
          v-if="showNguoiThueDetail && selectedNguoiThue"
          :nguoi-thue="selectedNguoiThue"
          @close="closeNguoiThueDetail"
        />
        <!-- ===================================================
       FORM THÊM / SỬA HỢP ĐỒNG
       =================================================== -->
        <div v-else-if="showHopDongForm" class="panel">
          <h3>
            {{ editingHopDongId ? "Sửa hợp đồng" : "Thêm hợp đồng" }}
          </h3>

          <form @submit.prevent="saveHopDong" class="form-grid">
            <label>
              {{ requiredLabel("Nhà trọ") }}

              <select
                v-model="hopDongForm.nhaTroId"
                @change="handleNhaTroChangeForHopDong"
                required
              >
                <option value="">Chọn nhà trọ</option>

                <option v-for="item in nhaTros" :key="item.id" :value="item.id">
                  {{ item.maNhaTro }} - {{ item.tenNhaTro }}
                </option>
              </select>
            </label>

            <label v-if="hopDongForm.nhaTroId">
              {{ requiredLabel("Phòng") }}

              <select
                v-model="hopDongForm.phongId"
                @change="handlePhongChangeForHopDong"
                required
              >
                <option value="">Chọn phòng</option>

                <option
                  v-for="item in hopDongPhongOptions"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.maPhong }} - Tầng {{ item.tangSo }}
                </option>
              </select>

              <small v-if="hopDongPhongOptions.length === 0" class="form-hint">
                Nhà trọ này chưa có phòng.
              </small>
            </label>

            <label v-if="hopDongForm.phongId">
              {{ requiredLabel("Giường") }}

              <select
                v-model="hopDongForm.giuongId"
                @change="handleGiuongChangeForHopDong"
                required
              >
                <option value="">Chọn giường</option>

                <option
                  v-for="item in hopDongGiuongOptions"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.maGiuong }} - Giường {{ item.giuongSo }}
                </option>
              </select>

              <small v-if="hopDongGiuongOptions.length === 0" class="form-hint">
                Nhà trọ này không còn giường trống để lập hợp đồng.
              </small>
            </label>

            <label>
              {{ requiredLabel("Người thuê") }}

              <select v-model="hopDongForm.nguoiThueId" required>
                <option value="">Chọn người thuê</option>

                <option
                  v-for="item in filteredNguoiThues"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.hoTen }}
                </option>
              </select>
            </label>

            <label>
              {{ requiredLabel("Ngày bắt đầu") }}

              <input
                v-model="hopDongForm.ngayBatDau"
                type="date"
                @change="syncHopDongCode"
                required
              />
            </label>

            <label>
              Ngày kết thúc

              <input
                v-model="hopDongForm.ngayKetThuc"
                type="date"
                :min="hopDongForm.ngayBatDau || undefined"
                @change="validateNgayHopDong"
              />
            </label>

            <label>
              {{ requiredLabel("Giá thuê") }}

              <div class="currency-input">
                <input
                  :value="tienThueDisplay"
                  type="text"
                  placeholder="Giá thuê"
                  @input="handleTienThueInput"
                  required
                />

                <span>VND</span>
              </div>
            </label>

            <label>
              {{ requiredLabel("Chu kỳ thanh toán") }}

              <select v-model.number="hopDongForm.chuKyThanhToan" required>
                <option :value="1">Hàng tháng</option>

                <option :value="3">3 tháng</option>

                <option :value="6">6 tháng</option>

                <option :value="12">12 tháng</option>
              </select>
            </label>

            <label>
              Đặt cọc

              <div class="currency-input">
                <input
                  :value="tienDatCocDisplay"
                  type="text"
                  placeholder="Số tiền đặt cọc"
                />

                <span>VND</span>
              </div>
            </label>

            <label>
              {{ requiredLabel("Trạng thái") }}

              <select v-model="hopDongForm.trangThai">
                <option value="active">Có hiệu lực</option>

                <option value="sap_het_han">Sắp hết hiệu lực</option>

                <option value="expired">Hết hiệu lực</option>
              </select>
            </label>

            <label class="full-width">
              Ghi chú

              <textarea
                v-model="hopDongForm.ghiChu"
                rows="3"
                placeholder="Nhập ghi chú cho hợp đồng..."
              ></textarea>
            </label>

            <div class="actions">
              <button class="primary" type="submit">
                {{ editingHopDongId ? "Cập nhật" : "Lưu" }}
              </button>

              <button class="secondary" type="button" @click="closeHopDongForm">
                Hủy
              </button>
            </div>
          </form>
        </div>

        <!-- ===================================================
       DANH SÁCH HỢP ĐỒNG
       =================================================== -->
        <div v-else class="panel">
          <div class="panel-header">
            <h3>Danh sách hợp đồng</h3>

            <button type="button" class="primary" @click="openAddHopDongForm">
              Thêm hợp đồng
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Mã HĐ(Giường)</th>
                <th>Người thuê</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Giá thuê</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in hopDongs" :key="item.id">
                <td>
                  {{ item.maHopDong }}
                </td>

                <td>
                  <button
                    type="button"
                    class="nguoi-thue-name"
                    @click="openNguoiThueDetail(item.nguoiThue)"
                  >
                    {{ item.nguoiThue?.hoTen || "" }}
                  </button>
                </td>

                <td>
                  {{
                    item.ngayBatDau
                      ? new Date(item.ngayBatDau).toLocaleDateString("vi-VN")
                      : ""
                  }}
                </td>

                <td>
                  {{
                    item.ngayKetThuc
                      ? new Date(item.ngayKetThuc).toLocaleDateString("vi-VN")
                      : "Không xác định"
                  }}
                </td>

                <td>
                  {{ formatCurrency(item.tienThue) }}
                </td>

                <td>
                  <span
                    :class="[
                      'status-badge',
                      getTrangThaiHopDongDisplay(
                        item.ngayBatDau,
                        item.ngayKetThuc,
                      ).status,
                    ]"
                  >
                    {{
                      getTrangThaiHopDongDisplay(
                        item.ngayBatDau,
                        item.ngayKetThuc,
                      ).text
                    }}
                  </span>
                </td>

                <td class="row-actions">
                  <button
                    type="button"
                    class="table-btn edit"
                    @click="editHopDong(item)"
                  >
                    Sửa
                  </button>

                  <button
                    type="button"
                    class="table-btn delete"
                    @click.stop="requestDeleteHopDong(item)"
                  >
                    Xóa
                  </button>
                </td>
              </tr>

              <tr v-if="hopDongs.length === 0">
                <td colspan="7" style="text-align: center">Chưa có hợp đồng</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===================================================
           HÓA ĐƠN
           =================================================== -->
      <section v-else-if="currentTab === 'hoaDon'" class="panel-grid">
        <div v-if="showHoaDonForm" class="panel">
          <h3>
            {{ editingHoaDonId ? "Sửa hóa đơn" : "Thêm hóa đơn" }}
          </h3>

          <form @submit.prevent="saveHoaDon" class="form-grid">
            <label>
              {{ requiredLabel("Hợp đồng") }}

              <select
                v-model="hoaDonForm.hopDongId"
                @change="
                  updateHoaDonTienPhong();
                  syncHoaDonCode();
                "
                required
              >
                <option value="">Chọn hợp đồng</option>

                <option
                  v-for="item in hopDongs"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.maHopDong }}
                </option>
              </select>
            </label>

            <label>
              {{ requiredLabel("Tháng thanh toán") }}

              <input
                v-model="hoaDonForm.thangThanhToan"
                type="date"
                @change="
                  syncHoaDonCode();
                  hoaDonThangThanhToanError = '';
                "
                required
              />

              <div v-if="hoaDonThangThanhToanError" class="hoa-don-thang-error">
                <span class="hoa-don-thang-error-icon">!</span>

                <span>
                  {{ hoaDonThangThanhToanError }}
                </span>
              </div>
            </label>

            <label>
              {{ requiredLabel("Tiền phòng") }}

              <div class="currency-input">
                <input :value="hoaDonForm.tienPhong" type="text" readonly />

                <span>VND</span>
              </div>
            </label>

            <label>
              {{ requiredLabel("Tiền điện") }}

              <div class="currency-input">
                <input
                  :value="tienDienDisplay"
                  type="text"
                  inputmode="numeric"
                  placeholder="0"
                  @input="handleTienDienInput"
                  required
                />

                <span>VND</span>
              </div>
            </label>

            <label>
              {{ requiredLabel("Tiền nước") }}

              <div class="currency-input">
                <input
                  :value="tienNuocDisplay"
                  type="text"
                  inputmode="numeric"
                  placeholder="0"
                  @input="handleTienNuocInput"
                  required
                />

                <span>VND</span>
              </div>
            </label>

            <label>
              {{ requiredLabel("Tiền dịch vụ khác") }}

              <div class="currency-input">
                <input
                  :value="tienDichVuKhacDisplay"
                  type="text"
                  inputmode="numeric"
                  placeholder="0"
                  @input="handleTienDichVuKhacInput"
                  required
                />

                <span>VND</span>
              </div>
            </label>

            <label>
              {{ requiredLabel("Tổng tiền") }}

              <div class="currency-input">
                <input
                  :value="hoaDonForm.tongTien"
                  inputmode="numeric"
                  type="text"
                  readonly
                />

                <span>VND</span>
              </div>
            </label>

            <label>
              {{ requiredLabel("Trạng thái") }}

              <select v-model="hoaDonForm.trangThai">
                <option value="chua_thanh_toan">Chưa thanh toán</option>

                <option value="da_thanh_toan">Đã thanh toán</option>
              </select>
            </label>

            <label class="full-width">
              Ghi chú

              <textarea
                v-model="hoaDonForm.ghiChu"
                rows="3"
                placeholder="Nhập ghi chú cho hóa đơn..."
              ></textarea>
            </label>

            <div class="invoice-form-actions">
              <div class="invoice-form-actions-left">
                <button class="primary" type="submit">
                  {{ editingHoaDonId ? "Cập nhật" : "Lưu" }}
                </button>

                <button
                  class="secondary"
                  type="button"
                  @click="closeHoaDonForm"
                >
                  Hủy
                </button>
              </div>

              <button
                type="button"
                class="btn-them-hoa-don"
                @click="handleThemHoaDonChoCacGiuong"
                :disabled="editingHoaDonId !== null"
              >
                Thêm HĐ cho các Giường
              </button>
            </div>
          </form>
        </div>

        <div v-else class="panel">
          <div class="panel-header">
            <h3>Danh sách hóa đơn</h3>

            <button type="button" class="primary" @click="openAddHoaDonForm">
              Thêm hóa đơn
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Mã HĐ</th>
                <th>Người thuê</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày nộp</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in hoaDons" :key="item.id">
                <td>
                  {{ item.maHoaDon }}
                </td>

                <td>
                  {{ item.hopDong?.nguoiThue?.hoTen ?? "" }}
                </td>

                <td>
                  {{ formatCurrency(item.tongTien) }}
                </td>

                <td>
                  <span
                    :class="[
                      'status-badge',
                      item.trangThai === 'da_thanh_toan'
                        ? 'status-paid'
                        : 'status-unpaid',
                    ]"
                  >
                    {{
                      item.trangThai === "da_thanh_toan"
                        ? "Đã thanh toán"
                        : "Chưa thanh toán"
                    }}
                  </span>
                </td>

                <td>
                  {{
                    item.trangThai === "da_thanh_toan" && item.ngayNop
                      ? new Date(item.ngayNop).toLocaleDateString("vi-VN")
                      : ""
                  }}
                </td>

                <td class="row-actions">
                  <button class="table-btn edit" @click="editHoaDon(item)">
                    Sửa
                  </button>

                  <button
                    type="button"
                    class="table-btn delete"
                    @click.stop="requestDeleteHoaDon(item)"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- =====================================================
     MODAL XÓA NHÀ TRỌ
     ===================================================== -->
    <div
      v-if="showDeleteNhaTroModal"
      class="modal-overlay"
      @click.self="closeDeleteNhaTroModal"
    >
      <div class="delete-modal">
        <div class="delete-modal-header">
          <div class="warning-icon">⚠</div>

          <div>
            <h3>Xác nhận xóa nhà trọ</h3>

            <p>
              {{ deleteNhaTroInfo.tenNhaTro }}
            </p>
          </div>
        </div>

        <div class="delete-modal-body">
          <!-- Nhà trọ đang có dữ liệu liên quan -->
          <template
            v-if="
              deleteNhaTroInfo.soPhong > 0 ||
              deleteNhaTroInfo.soGiuong > 0 ||
              deleteNhaTroInfo.soHopDong > 0 ||
              deleteNhaTroInfo.soHoaDon > 0
            "
          >
            <p class="warning-message">
              <strong>Không thể xóa nhà trọ này!</strong>
            </p>

            <p>
              Nhà trọ
              <strong>{{ deleteNhaTroInfo.tenNhaTro }}</strong>
              đang có dữ liệu liên quan.
            </p>

            <div class="related-data">
              <div v-if="deleteNhaTroInfo.soPhong > 0" class="related-item">
                <span>Phòng</span>
                <strong>{{ deleteNhaTroInfo.soPhong }}</strong>
              </div>

              <div v-if="deleteNhaTroInfo.soGiuong > 0" class="related-item">
                <span>Giường</span>
                <strong>{{ deleteNhaTroInfo.soGiuong }}</strong>
              </div>

              <div v-if="deleteNhaTroInfo.soHopDong > 0" class="related-item">
                <span>Hợp đồng</span>
                <strong>{{ deleteNhaTroInfo.soHopDong }}</strong>
              </div>

              <div v-if="deleteNhaTroInfo.soHoaDon > 0" class="related-item">
                <span>Hóa đơn</span>
                <strong>{{ deleteNhaTroInfo.soHoaDon }}</strong>
              </div>
            </div>

            <p class="delete-modal-note">
              Hãy xóa hoặc xử lý các dữ liệu liên quan trước khi xóa nhà trọ.
            </p>
          </template>

          <!-- Nhà trọ không có dữ liệu liên quan -->
          <template v-else>
            <p class="confirm-message">
              Bạn có chắc chắn muốn xóa nhà trọ
              <strong>
                {{ deleteNhaTroInfo.tenNhaTro }}
              </strong>
              không?
            </p>

            <p class="delete-modal-note">Thao tác này không thể hoàn tác.</p>
          </template>

          <p v-if="deleteErrorMessage" class="error-message">
            {{ deleteErrorMessage }}
          </p>
        </div>

        <!-- CHỈ CÓ 1 KHỐI BUTTON -->
        <div class="delete-modal-actions">
          <button
            class="secondary"
            type="button"
            @click="closeDeleteNhaTroModal"
          >
            Đóng
          </button>

          <button
            v-if="
              deleteNhaTroInfo.soPhong === 0 &&
              deleteNhaTroInfo.soGiuong === 0 &&
              deleteNhaTroInfo.soHopDong === 0 &&
              deleteNhaTroInfo.soHoaDon === 0
            "
            class="danger-button"
            type="button"
            @click="confirmDeleteNhaTro"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>

    <!-- =====================================================
         MODAL XÓA PHÒNG
         ===================================================== -->
    <div
      v-if="showDeletePhongModal"
      class="modal-overlay"
      @click.self="closeDeletePhongModal"
    >
      <div class="delete-modal">
        <div class="delete-modal-header">
          <div class="warning-icon">⚠</div>

          <div>
            <h3>Xác nhận xóa phòng</h3>

            <p>
              {{ deletePhongInfo.maPhong }}

              <span v-if="deletePhongInfo.tenNhaTro">
                - {{ deletePhongInfo.tenNhaTro }}
              </span>
            </p>
          </div>
        </div>

        <div class="delete-modal-body">
          <template v-if="deletePhongInfo.soGiuong > 0">
            <div class="warning-message">
              <strong> Không thể xóa phòng này! </strong>

              <p>
                Phòng đang có dữ liệu giường liên quan. Bạn cần xử lý các dữ
                liệu này trước khi xóa.
              </p>
            </div>

            <div class="related-data">
              <div class="related-item">
                <span>Giường</span>

                <strong>
                  {{ deletePhongInfo.soGiuong }}
                </strong>
              </div>
            </div>

            <p class="delete-modal-note">
              Hãy xóa hoặc xử lý các giường thuộc phòng trước khi thực hiện thao
              tác này.
            </p>
          </template>

          <template v-else>
            <p class="confirm-message">
              Bạn có chắc chắn muốn xóa phòng
              <strong>
                {{ deletePhongInfo.maPhong }}
              </strong>
              không?
            </p>

            <p class="delete-modal-note">Thao tác này không thể hoàn tác.</p>
          </template>

          <p v-if="deletePhongErrorMessage" class="error-message">
            {{ deletePhongErrorMessage }}
          </p>
        </div>

        <div class="delete-modal-actions">
          <button
            class="secondary"
            type="button"
            @click="closeDeletePhongModal"
          >
            Đóng
          </button>

          <button
            v-if="deletePhongInfo.soGiuong === 0"
            class="danger-button"
            type="button"
            @click="confirmDeletePhong"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>

    <!-- =====================================================
         MODAL XÓA HỢP ĐỒNG
         ===================================================== -->
    <div
      v-if="showDeleteHopDongModal"
      class="modal-overlay"
      @click.self="closeDeleteHopDongModal"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>Xác nhận xóa hợp đồng</h3>

          <button
            type="button"
            class="modal-close"
            @click="closeDeleteHopDongModal"
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <p>
            Bạn có chắc chắn muốn xóa hợp đồng
            <strong>
              {{ deleteHopDongInfo.maHopDong }}
            </strong>
            không?
          </p>

          <p v-if="deleteHopDongErrorMessage" class="delete-error-message">
            {{ deleteHopDongErrorMessage }}
          </p>
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="secondary"
            @click="closeDeleteHopDongModal"
          >
            Hủy
          </button>

          <button type="button" class="danger" @click="confirmDeleteHopDong">
            Xóa
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="showHopDongHoaDonErrorModal"
      class="modal-overlay"
      @click.self="closeHopDongHoaDonErrorModal"
    >
      <div class="modal">
        <div class="modal-header">Không thể xóa hợp đồng</div>

        <div class="modal-body">
          <p class="delete-error-message">
            {{ hopDongHoaDonErrorMessage }}
          </p>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="secondary"
            @click="closeHopDongHoaDonErrorModal"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
    <!-- =====================================================
         MODAL XÓA GIƯỜNG
         ===================================================== -->
    <div
      v-if="showDeleteGiuongModal"
      class="modal-overlay"
      @click.self="closeDeleteGiuongModal"
    >
      <div class="delete-modal">
        <div class="delete-modal-header">
          <div class="warning-icon">⚠</div>

          <div>
            <h3>Xác nhận xóa giường</h3>

            <p>
              {{ deleteGiuongInfo.maGiuong }}

              <span v-if="deleteGiuongInfo.maPhong">
                - Phòng {{ deleteGiuongInfo.maPhong }}
              </span>
            </p>
          </div>
        </div>

        <div class="delete-modal-body">
          <!-- GIƯỜNG ĐÃ CÓ HỢP ĐỒNG -->
          <template v-if="deleteGiuongInfo.soHopDong > 0">
            <div class="warning-message">
              <strong>Không thể xóa giường này!</strong>

              <p>
                Giường đang được sử dụng trong
                <strong>
                  {{ deleteGiuongInfo.soHopDong }}
                </strong>
                hợp đồng.
              </p>

              <p>
                Vui lòng xóa hoặc xử lý hợp đồng liên quan trước khi xóa giường.
              </p>
            </div>

            <div class="related-data">
              <div class="related-item">
                <span>Mã HD(Giường)</span>
                <strong>
                  {{ deleteGiuongInfo.maGiuong }}
                </strong>
              </div>

              <div class="related-item" v-if="deleteGiuongInfo.maPhong">
                <span>Phòng</span>
                <strong>
                  {{ deleteGiuongInfo.maPhong }}
                </strong>
              </div>

              <div class="related-item">
                <span>Số hợp đồng</span>
                <strong>
                  {{ deleteGiuongInfo.soHopDong }}
                </strong>
              </div>
            </div>
          </template>

          <!-- GIƯỜNG CHƯA CÓ HỢP ĐỒNG -->
          <template v-else>
            <p class="confirm-message">
              Bạn có chắc chắn muốn xóa giường
              <strong>
                {{ deleteGiuongInfo.maGiuong }}
              </strong>

              <span v-if="deleteGiuongInfo.maPhong">
                của phòng
                <strong>
                  {{ deleteGiuongInfo.maPhong }}
                </strong>
              </span>

              không?
            </p>

            <p class="delete-modal-note">Thao tác này không thể hoàn tác.</p>
          </template>

          <p v-if="deleteGiuongErrorMessage" class="error-message">
            {{ deleteGiuongErrorMessage }}
          </p>
        </div>

        <div class="delete-modal-actions">
          <button
            class="secondary"
            type="button"
            @click="closeDeleteGiuongModal"
          >
            Đóng
          </button>

          <button
            v-if="deleteGiuongInfo.soHopDong === 0"
            class="danger-button"
            type="button"
            @click="confirmDeleteGiuong"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>

    <!-- =====================================================
         MODAL XÓA NGƯỜI THUÊ
         ===================================================== -->
    <div
      v-if="showDeleteNguoiThueModal"
      class="modal-overlay"
      @click.self="closeDeleteNguoiThueModal"
    >
      <div class="delete-modal">
        <div class="delete-modal-header">
          <div class="warning-icon">⚠</div>

          <div>
            <h3>Xác nhận xóa người thuê</h3>

            <p>
              {{ deleteNguoiThueInfo.hoTen }}

              <span v-if="deleteNguoiThueInfo.cccd">
                - CCCD: {{ deleteNguoiThueInfo.cccd }}
              </span>
            </p>
          </div>
        </div>

        <div class="delete-modal-body">
          <!-- Người thuê đang có hợp đồng -->
          <template v-if="deleteNguoiThueInfo.hopDongIds.length > 0">
            <p class="warning-message">
              Bạn chú ý người thuê
              <strong>{{ deleteNguoiThueInfo.hoTen }}</strong>
              đang có trong hợp đồng
              <strong>
                {{ deleteNguoiThueInfo.hopDongIds.join(", ") }}
              </strong>
              nên không thể xóa được.
            </p>

            <p class="delete-modal-note">Cần thực hiện xóa hợp đồng trước.</p>
          </template>

          <!-- Người thuê không có hợp đồng -->
          <template v-else>
            <p class="confirm-message">
              Bạn có chắc chắn muốn xóa người thuê
              <strong>
                {{ deleteNguoiThueInfo.hoTen }}
              </strong>
              không?
            </p>

            <p class="delete-modal-note">Thao tác này không thể hoàn tác.</p>
          </template>

          <p v-if="deleteNguoiThueErrorMessage" class="error-message">
            {{ deleteNguoiThueErrorMessage }}
          </p>
        </div>

        <div class="delete-modal-actions">
          <button
            class="secondary"
            type="button"
            @click="closeDeleteNguoiThueModal"
          >
            Đóng
          </button>

          <button
            v-if="deleteNguoiThueInfo.hopDongIds.length === 0"
            class="danger-button"
            type="button"
            @click="confirmDeleteNguoiThue"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>

    <!-- =====================================================
         MODAL XÓA HÓA ĐƠN
         ===================================================== -->
    <div
      v-if="showDeleteHoaDonModal"
      class="modal-backdrop"
      @click.self="closeDeleteHoaDonModal"
    >
      <div class="modal">
        <h3>Xóa hóa đơn</h3>

        <p>
          Bạn có chắc chắn muốn xóa hóa đơn
          <strong>
            {{ deleteHoaDonInfo.maHoaDon }}
          </strong>
          không?
        </p>

        <p v-if="deleteHoaDonErrorMessage" class="error-message">
          {{ deleteHoaDonErrorMessage }}
        </p>

        <div class="modal-actions">
          <button type="button" @click="closeDeleteHoaDonModal">Hủy</button>

          <button type="button" class="btn danger" @click="confirmDeleteHoaDon">
            Xóa
          </button>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</div>
</template>

<style scoped>
/* =========================================================
   ẢNH CCCD - FORM THÊM / SỬA NGƯỜI THUÊ
   ========================================================= */

.cccd-preview {
  display: block;

  width: auto;
  max-width: 320px;
  max-height: 190px;

  margin-top: 8px;

  padding: 6px;

  object-fit: contain;

  border: 1px solid #dbe3ee;
  border-radius: 8px;

  background: #f8fafc;

  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
}
/* =========================================================
   RESET + GLOBAL
   ========================================================= */

:global(html) {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
}

:global(body) {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;

  background: linear-gradient(135deg, #f8fafc, #e2e8f0);

  font-family: Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

  color: #0f172a;
}

:global(#app) {
  width: 100%;
  min-height: 100vh;
}

* {
  box-sizing: border-box;
}

button,
input,
select,
textarea {
  font: inherit;
}

/* =========================================================
   APP LAYOUT
   ========================================================= */

.app-shell {
  position: relative;

  display: grid;

  grid-template-columns: 260px minmax(0, 1fr);

  /* Chiều cao tự tăng theo nội dung + Footer */
  grid-template-rows: auto;

  width: 100%;
  min-width: 0;
  min-height: 100vh;

  overflow-x: hidden;

  align-items: stretch;
}
.content-column {
  grid-column: 2;
  grid-row: 1;

  min-width: 0;
  min-height: 100%;

  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  min-width: 0;
}
/* =========================================================
   SIDEBAR
   ========================================================= */

.sidebar {
  grid-column: 1;
  grid-row: 1;

  position: relative;
  top: 0;
  align-self: stretch;

  width: 260px;
  min-height: 100%;

  padding: 24px 16px;

  background: #0f172a;
  color: white;

  overflow-x: hidden;

  z-index: 1000;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: 100%;

  margin-bottom: 28px;
}

.brand {
  display: flex;
  align-items: center;

  gap: 12px;

  min-width: 0;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.brand h1 {
  margin: 0;

  color: white;

  font-size: 1.15rem;
  line-height: 1.2;

  white-space: nowrap;
}

.brand small {
  display: block;

  margin-top: 2px;

  color: #94a3b8;

  font-size: 0.72rem;
}

/* =========================================================
   MENU BUTTON
   ========================================================= */

.menu-toggle {
  border: none;

  display: grid;
  place-items: center;

  cursor: pointer;

  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.menu-toggle:hover {
  transform: translateY(-1px);
}

.menu-open-button {
  display: none;

  position: fixed;

  top: 16px;
  left: 16px;

  width: 42px;
  height: 42px;

  border-radius: 10px;

  background: #0f172a;
  color: white;

  font-size: 1.2rem;

  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2);

  z-index: 1200;
}

.menu-close-button {
  display: none;

  flex: 0 0 34px;

  width: 34px;
  height: 34px;

  border-radius: 8px;

  background: rgba(255, 255, 255, 0.08);

  color: white;

  font-size: 1.2rem;
}

.menu-close-button:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* =========================================================
   NAVIGATION
   ========================================================= */

.nav {
  display: flex;
  flex-direction: column;

  gap: 8px;

  width: 100%;
}

.nav-item {
  display: flex;
  align-items: center;

  width: 100%;
  min-height: 44px;

  border: none;
  border-radius: 10px;

  padding: 10px 12px;

  background: rgba(148, 163, 184, 0.08);

  color: #e2e8f0;

  text-align: left;

  cursor: pointer;

  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.nav-item:hover {
  background: rgba(148, 163, 184, 0.15);

  color: white;

  transform: translateX(2px);
}

.nav-item.active {
  background: linear-gradient(135deg, #38bdf8, #2563eb);

  color: white;

  box-shadow: 0 5px 14px rgba(37, 99, 235, 0.25);
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  flex: 0 0 28px;

  width: 28px;

  font-size: 0.95rem;

  line-height: 1;
}

.nav-label {
  min-width: 0;

  font-size: 0.88rem;
  font-weight: 500;

  white-space: nowrap;
}

/* =========================================================
   MENU OVERLAY
   ========================================================= */

.menu-overlay {
  display: none;

  position: fixed;

  inset: 0;

  background: rgba(15, 23, 42, 0.5);

  backdrop-filter: blur(2px);

  z-index: 900;
}

/* =========================================================
   MAIN CONTENT
   ========================================================= */

.content {
  grid-column: 2;
  grid-row: 1;

  min-width: 0;
  width: 100%;

  padding: 28px;

  overflow-x: hidden;
}

/* =========================================================
   TOP BAR
   ========================================================= */

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;

  width: 100%;

  margin-bottom: 24px;
}

.topbar > div {
  min-width: 0;
}

.eyebrow {
  margin: 0;

  color: #64748b;

  letter-spacing: 0.08em;

  text-transform: uppercase;

  font-size: 0.7rem;
  font-weight: 600;
}

.topbar h2 {
  margin: 5px 0 0;

  color: #0f172a;

  font-size: 2rem;
  line-height: 1.2;
}

/* =========================================================
   BUTTONS
   ========================================================= */

.primary,
.secondary,
.btn-them-hoa-don {
  border: none;
  border-radius: 9px;
  padding: 10px 14px;

  background: linear-gradient(135deg, #16a34a, #22c55e);

  color: #ffffff;

  cursor: pointer;
  font-weight: 600;

  transition:
    background 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;

  box-shadow: 0 4px 10px rgba(22, 163, 74, 0.2);
}

.btn-them-hoa-don:hover {
  background: linear-gradient(135deg, #15803d, #16a34a);

  transform: translateY(-1px);

  box-shadow: 0 6px 14px rgba(22, 163, 74, 0.25);
}

.btn-them-hoa-don:active {
  transform: translateY(0);

  box-shadow: 0 3px 8px rgba(22, 163, 74, 0.2);
}

.btn-them-hoa-don:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
.table-btn {
  border: none;

  border-radius: 9px;

  padding: 10px 14px;

  cursor: pointer;

  font-weight: 600;

  transition:
    background 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.primary {
  background: linear-gradient(135deg, #2563eb, #0ea5e9);

  color: white;

  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
}

.primary:hover {
  transform: translateY(-1px);

  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.25);
}

.secondary {
  background: #e2e8f0;

  color: #0f172a;
}

.secondary:hover {
  background: #cbd5e1;
}

.btn-them-hoa-don {
  border: none;
  border-radius: 9px;

  padding: 10px 16px;

  background: linear-gradient(135deg, #16a34a, #22c55e);

  color: #ffffff;

  cursor: pointer;
  font-weight: 600;
  font-size: 14px;

  white-space: nowrap;
  width: auto;
  min-width: max-content;
  flex-shrink: 0;

  box-shadow: 0 4px 10px rgba(22, 163, 74, 0.2);

  transition:
    background 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.btn-them-hoa-don:hover {
  background: linear-gradient(135deg, #15803d, #16a34a);

  transform: translateY(-1px);

  box-shadow: 0 6px 14px rgba(22, 163, 74, 0.25);
}

.btn-them-hoa-don:active {
  transform: translateY(0);
}

/* =========================================================
   PANELS / GRID
   ========================================================= */

.panel-grid {
  display: grid;

  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

  gap: 20px;

  width: 100%;

  min-width: 0;
}

.panel {
  min-width: 0;

  width: 100%;

  padding: 20px;

  background: rgba(255, 255, 255, 0.86);

  border: 1px solid rgba(148, 163, 184, 0.2);

  border-radius: 18px;

  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);

  backdrop-filter: blur(10px);

  overflow-x: auto;
}

.panel h3 {
  margin: 0 0 18px;

  color: #0f172a;

  font-size: 1.1rem;
}

/* =========================================================
   DASHBOARD METRIC CARD
   ========================================================= */

.metric-card {
  position: relative;

  min-height: 130px;

  display: flex;
  flex-direction: column;

  justify-content: center;

  gap: 6px;

  padding: 20px;

  border: 1px solid rgba(148, 163, 184, 0.2);

  border-radius: 18px;

  overflow: hidden;

  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);

  background: rgba(255, 255, 255, 0.8);

  backdrop-filter: blur(10px);
}

.metric-card.highlight {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
}

.metric-card .metric-decor {
  position: absolute;

  inset: 0;

  z-index: 1;

  pointer-events: none;
}

.metric-card .metric-body {
  position: relative;

  z-index: 2;

  display: flex;
  flex-direction: column;

  gap: 5px;
}

.metric-card span {
  color: #475569;

  font-size: 0.88rem;
}

.metric-card strong {
  color: #0f172a;

  font-size: 2rem;
  line-height: 1.1;
}

/* =========================================================
   METRIC COLORS
   ========================================================= */

.metric-card.metric-nhatro .metric-decor {
  background: linear-gradient(
    135deg,
    rgba(239, 246, 255, 0.95),
    rgba(219, 234, 254, 0.95)
  );
}

.metric-card.metric-phong .metric-decor {
  background: linear-gradient(
    135deg,
    rgba(255, 247, 237, 0.95),
    rgba(255, 237, 213, 0.95)
  );
}

.metric-card.metric-giuong .metric-decor {
  background: linear-gradient(
    135deg,
    rgba(240, 253, 244, 0.95),
    rgba(187, 247, 208, 0.95)
  );
}

.metric-card.metric-hopdong .metric-decor {
  background: linear-gradient(
    135deg,
    rgba(255, 241, 242, 0.95),
    rgba(254, 215, 226, 0.95)
  );
}

.metric-card.metric-hoadon .metric-decor {
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.95),
    rgba(226, 232, 240, 0.95)
  );
}

/* =========================================================
   FORM
   ========================================================= */

.form-grid {
  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 16px;

  width: 100%;
}

.form-grid label {
  display: flex;
  flex-direction: column;

  min-width: 0;

  gap: 7px;

  color: #334155;

  font-size: 0.9rem;
  font-weight: 600;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;

  border: 1px solid #cbd5e1;

  border-radius: 10px;

  padding: 11px 12px;

  background: white;

  color: #0f172a;

  outline: none;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #3b82f6;

  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

textarea {
  resize: vertical;

  min-height: 90px;
}

.form-hint {
  display: block;

  margin-top: 2px;

  color: #64748b;

  font-size: 0.78rem;

  font-weight: 400;

  line-height: 1.4;
}

.form-error {
  display: block;

  margin-top: 2px;

  color: #dc2626 !important;

  font-size: 0.78rem;

  font-weight: 400;

  line-height: 1.4;
}

.full-width {
  grid-column: 1 / -1;
}

/* =========================================================
   FORM ACTIONS
   ========================================================= */

.actions {
  grid-column: 1 / -1;

  display: flex;
  align-items: center;

  gap: 10px;

  margin-top: 4px;
}

/* =========================================================
   CURRENCY INPUT
   ========================================================= */

.currency-input {
  position: relative;

  display: flex;
  align-items: center;

  width: 100%;
}

.currency-input input {
  width: 100%;

  padding-right: 60px;
}

.currency-input span {
  position: absolute;

  right: 12px;

  color: #64748b;

  font-size: 0.85rem;
  font-weight: 600;

  pointer-events: none;
}

.money-input {
  display: flex;
  align-items: center;

  gap: 8px;

  width: 100%;
}

.money-input input {
  flex: 1;
}

.money-input span {
  color: #475569;

  font-weight: 600;

  white-space: nowrap;
}

/* =========================================================
   TABLE
   ========================================================= */

.table-responsive {
  width: 100%;

  overflow-x: auto;
}

table {
  width: 100%;

  min-width: 650px;

  margin-top: 10px;

  border-collapse: collapse;

  table-layout: auto;
}

th,
td {
  padding: 12px 10px;

  border-bottom: 1px solid #e2e8f0;

  text-align: left;

  vertical-align: middle;

  white-space: normal;

  overflow-wrap: anywhere;

  word-break: break-word;
}

th {
  background: #f8fafc;

  color: #475569;

  font-size: 0.82rem;
  font-weight: 700;

  white-space: nowrap;
}

td {
  color: #334155;

  font-size: 0.88rem;
}

tbody tr:hover {
  background: rgba(248, 250, 252, 0.8);
}

/* =========================================================
   TABLE ACTIONS
   ========================================================= */

.row-actions {
  display: flex;
  align-items: center;

  gap: 8px;

  white-space: nowrap;
}

.table-btn {
  padding: 8px 11px;

  font-size: 0.82rem;
}

.table-btn.edit {
  background: #dbeafe;

  color: #1d4ed8;
}

.table-btn.edit:hover {
  background: #bfdbfe;
}

.table-btn.delete {
  background: #fee2e2;

  color: #b91c1c;
}

.table-btn.delete:hover {
  background: #fecaca;
}

/* =========================================================
   STATUS
   ========================================================= */

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-height: 28px;

  padding: 5px 10px;

  border-radius: 999px;

  font-size: 0.78rem;
  font-weight: 700;

  white-space: nowrap;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.expired {
  background: #fee2e2;
  color: #b91c1c;
}

.status-badge.sap_het_han {
  background: #fef3c7;
  color: #92400e;
}
.status-badge.trong {
  background: #e2e8f0;
  color: #475569;
}

.status-badge.da_thue {
  background: #dcfce7;
  color: #166534;
}

.status-badge.sap_tra_tro {
  background: #fef3c7;
  color: #92400e;
}

.status-paid {
  background: #dcfce7;
  color: #166534;
}

.status-unpaid {
  background: #fee2e2;
  color: #b91c1c;
}

/* =========================================================
   NHÀ TRỌ
   ========================================================= */

.nha-tro-grid {
  display: grid;

  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));

  gap: 12px;
}

.nha-tro-card {
  padding: 14px;

  background: rgba(255, 255, 255, 0.9);

  border: 1px solid rgba(148, 163, 184, 0.12);

  border-radius: 12px;
}

.nha-tro-row {
  display: flex;

  gap: 12px;

  margin-top: 8px;
}

.nha-tro-metric {
  min-width: 0;
}

.nha-tro-metric small {
  display: block;

  color: #64748b;
}

.nha-tro-metric strong {
  font-size: 1.25rem;
}

/* =========================================================
   NHÀ TRỌ
   ========================================================= */

.status-badge.chua_thue {
  background: #e2e8f0;
  color: #475569;
}

.status-badge.da_thue {
  background: #dcfce7;
  color: #166534;
}

.status-badge.het_han {
  background: #fee2e2;
  color: #991b1b;
}

/* =========================================================
   RELATIONSHIP
   ========================================================= */

.relationship {
  margin: 0;

  font-size: 1.04rem;

  line-height: 1.7;
}

/* =========================================================
   CCCD
   ========================================================= */

.cccd-current {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  gap: 8px;

  margin-top: 5px;

  padding: 8px 10px;

  border-radius: 8px;

  background: #f8fafc;

  border: 1px solid #e2e8f0;

  font-size: 0.82rem;
}

.cccd-current span {
  color: #64748b;

  font-weight: 600;
}

.cccd-current a {
  color: #2563eb;

  text-decoration: none;

  font-weight: 600;
}

.cccd-current a:hover {
  text-decoration: underline;
}

/* =========================================================
   DELETE MODAL - COMMON
   ========================================================= */

.modal-overlay,
.modal-backdrop {
  position: fixed;

  inset: 0;

  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;

  padding: 20px;

  background: rgba(15, 23, 42, 0.55);

  backdrop-filter: blur(4px);
}

.delete-modal,
.modal-backdrop .modal,
.modal-overlay > .modal {
  width: min(520px, calc(100vw - 40px));

  max-width: 520px;

  margin: 0;

  background: white;

  border: 1px solid #e2e8f0;

  border-radius: 16px;

  box-shadow:
    0 25px 50px rgba(15, 23, 42, 0.25),
    0 8px 20px rgba(15, 23, 42, 0.12);

  overflow: hidden;

  animation: modal-show 0.2s ease-out;
}

@keyframes modal-show {
  from {
    opacity: 0;

    transform: translateY(-10px) scale(0.98);
  }

  to {
    opacity: 1;

    transform: translateY(0) scale(1);
  }
}

/* =========================================================
   DELETE MODAL HEADER
   ========================================================= */

.delete-modal-header {
  display: flex;
  align-items: center;

  gap: 14px;

  padding: 20px 22px;

  border-bottom: 1px solid #e2e8f0;
}

.delete-modal-header h3 {
  margin: 0;

  color: #0f172a;

  font-size: 1.2rem;
  font-weight: 700;
}

.delete-modal-header p {
  margin: 5px 0 0;

  color: #64748b;

  font-size: 0.9rem;
}

.warning-icon {
  flex: 0 0 46px;

  width: 46px;
  height: 46px;

  display: grid;
  place-items: center;

  border-radius: 50%;

  background: #fef3c7;

  color: #d97706;

  font-size: 1.45rem;
  font-weight: 700;
}

/* =========================================================
   DELETE MODAL BODY
   ========================================================= */

.delete-modal-body {
  padding: 22px;
}

.warning-message {
  padding: 14px 16px;

  border: 1px solid #fed7aa;

  border-radius: 12px;

  background: #fff7ed;

  color: #9a3412;
}

.warning-message strong {
  display: block;

  margin-bottom: 5px;
}

.warning-message p {
  margin: 0;

  line-height: 1.5;
}

.related-data {
  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 12px;

  margin-top: 16px;
}

.related-item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  min-width: 0;

  padding: 12px 14px;

  border: 1px solid #e2e8f0;

  border-radius: 10px;

  background: #f8fafc;
}

.related-item span {
  color: #475569;
}

.related-item strong {
  min-width: 32px;

  color: #dc2626;

  text-align: center;

  font-size: 1.05rem;
}

.confirm-message {
  margin: 0;

  color: #334155;

  font-size: 0.95rem;

  line-height: 1.6;
}

.confirm-message strong {
  color: #dc2626;
}

.delete-modal-note {
  margin: 15px 0 0;

  color: #64748b;

  font-size: 0.88rem;

  line-height: 1.5;
}

.error-message {
  margin-top: 14px !important;

  padding: 10px 12px;

  border: 1px solid #fecaca;

  border-radius: 8px;

  background: #fee2e2;

  color: #b91c1c;

  font-size: 0.88rem;

  line-height: 1.4;
}

/* =========================================================
   DELETE MODAL ACTIONS
   ========================================================= */

.delete-modal-actions,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  gap: 10px;

  padding: 16px 22px;

  border-top: 1px solid #e2e8f0;

  background: #f8fafc;
}

.danger-button,
.modal-actions .danger,
.modal-actions .btn.danger {
  min-height: 40px;

  padding: 0 16px;

  border: none;

  border-radius: 9px;

  background: #dc2626;

  color: white;

  cursor: pointer;

  font-size: 0.88rem;
  font-weight: 600;

  transition:
    background 0.2s ease,
    transform 0.15s ease;
}

.danger-button:hover,
.modal-actions .danger:hover,
.modal-actions .btn.danger:hover {
  background: #b91c1c;

  transform: translateY(-1px);
}

/* =========================================================
   STANDARD MODAL
   ========================================================= */

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 16px 20px;

  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;

  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  border: none;

  background: transparent;

  color: #475569;

  padding: 4px 8px;

  font-size: 24px;

  line-height: 1;

  cursor: pointer;
}

.modal-close:hover {
  color: #0f172a;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  margin: 0;

  color: #475569;

  line-height: 1.6;
}

.modal-body strong {
  color: #0f172a;

  font-weight: 700;
}

.dashboard-chart-grid {
  display: grid;

  grid-template-columns: repeat(3, minmax(0, 1fr));

  gap: 20px;

  width: 100%;
  min-width: 0;

  margin-top: 24px;

  box-sizing: border-box;
}

.dashboard-house-card {
  grid-column: 1 / -1;

  width: 100%;
  min-width: 0;

  padding: 24px;

  background: rgba(255, 255, 255, 0.9);

  border: 1px solid rgba(148, 163, 184, 0.2);

  border-radius: 18px;

  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);

  box-sizing: border-box;
}

.dashboard-house-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 16px;

  margin-bottom: 4px;
}

.dashboard-house-header h3 {
  margin: 0;

  color: #0f172a;

  font-size: 1.25rem;

  line-height: 1.3;
}

.dashboard-house-header h3 span {
  color: #2563eb;

  font-weight: 700;
}

.dashboard-house-header p {
  margin: 6px 0 0;

  color: #64748b;

  font-size: 0.88rem;
}

.dashboard-house-card {
  grid-column: 1 / -1;

  width: 100%;
  min-width: 0;

  padding: 24px;

  background: rgba(255, 255, 255, 0.9);

  border: 1px solid rgba(148, 163, 184, 0.2);

  border-radius: 18px;

  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);

  box-sizing: border-box;
}

.dashboard-house-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 16px;

  margin-bottom: 4px;
}

.dashboard-house-header h3 {
  margin: 0;

  color: #0f172a;

  font-size: 1.25rem;

  line-height: 1.3;
}

.dashboard-house-header h3 span {
  color: #2563eb;

  font-weight: 700;
}

.dashboard-house-header p {
  margin: 6px 0 0;

  color: #64748b;

  font-size: 0.88rem;
}

.dashboard-chart-card {
  width: 100%;
  min-width: 0;

  box-sizing: border-box;

  background: #ffffff;

  border: 1px solid #e5e7eb;

  border-radius: 18px;

  padding: 22px;

  text-align: center;

  overflow: hidden;
}

.dashboard-chart-card h4 {
  margin: 0 0 18px;

  color: #172033;

  font-size: 17px;
  font-weight: 700;
}

.chart-container {
  position: relative;

  width: min(230px, 100%);

  height: 230px;

  margin: 0 auto;

  box-sizing: border-box;
}

.chart-container canvas {
  display: block;

  width: 100% !important;
  height: 100% !important;
}

.chart-value {
  margin-top: 8px;

  display: flex;

  justify-content: center;

  align-items: baseline;

  gap: 6px;
}

.chart-value strong {
  font-size: 20px;

  color: #172033;
}

.chart-value span {
  color: #64748b;

  font-size: 13px;
}

.chart-description {
  display: flex;

  align-items: center;

  gap: 12px;

  margin-top: 18px;

  padding: 13px;

  border-radius: 12px;

  background: #f8fafc;

  text-align: left;
}

.description-icon {
  flex-shrink: 0;

  width: 38px;
  height: 38px;

  display: flex;

  align-items: center;
  justify-content: center;

  border-radius: 10px;

  background: #ffffff;

  font-size: 19px;
}

.chart-description p {
  margin: 0;

  color: #475569;

  font-size: 13px;

  line-height: 1.5;
}

.delete-error-message {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 14px;
  font-weight: 600;
}

.invoice-form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}

.invoice-form-actions-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.invoice-form-actions > .btn-them-hoa-don {
  margin-left: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.nguoi-thue-name {
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;

  color: #2563eb;
  font: inherit;
  font-weight: 600;

  cursor: pointer;
  text-align: left;
}

.nguoi-thue-name:hover {
  text-decoration: underline;
}

.nguoi-thue-name-link {
  padding: 0;
  border: none;
  background: transparent;
  color: #2563eb;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.nguoi-thue-name-link:hover {
  text-decoration: underline;
}
.logout-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  height: 38px;
  padding: 0 16px;

  border: 1px solid #dc2626;
  border-radius: 8px;

  background: #ffffff;
  color: #dc2626;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.logout-button:hover {
  background: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
}

.logout-button:active {
  transform: translateY(1px);
}
/* =========================================================
   THÔNG BÁO THÁNG THANH TOÁN - FORM HÓA ĐƠN
   ========================================================= */

.hoa-don-thang-error {
  display: flex;
  align-items: center;

  gap: 8px;

  margin-top: 8px;
  padding: 9px 11px;

  border: 1px solid #fecaca;
  border-radius: 8px;

  background: #fef2f2;
  color: #dc2626;

  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.4;

  animation: hoaDonErrorFadeIn 0.2s ease-out;
}

.hoa-don-thang-error-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  flex: 0 0 18px;

  width: 18px;
  height: 18px;

  border-radius: 50%;

  background: #dc2626;
  color: #ffffff;

  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

@keyframes hoaDonErrorFadeIn {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1200px) {
  .dashboard-chart-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .invoice-form-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .invoice-form-actions-left {
    width: 100%;
  }

  .invoice-form-actions-left button,
  .invoice-form-actions > .btn-them-hoa-don {
    width: 100%;
  }
}

.status-active {
  color: #166534;
  background-color: #dcfce7;
}

.status-empty {
  color: #475569;
  background-color: #f1f5f9;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.dat-coc-header {
  width: 140px;
  text-align: center;
}

.dat-coc-cell {
  width: 100px;
  min-width: 100px;
  text-align: center;
  vertical-align: middle;
}

.dat-coc-display {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

/* Checkbox */
.dat-coc-display input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin: 0;
}

/* ĐÃ ĐẶT CỌC - màu đỏ */
.dat-coc-display-yes {
  color: #dc2626;
}

.dat-coc-display-yes input[type="checkbox"] {
  accent-color: #dc2626;
}

/* CHƯA ĐẶT CỌC - màu xám */
.dat-coc-display-no {
  color: #6b7280;
}

.dat-coc-display-no input[type="checkbox"] {
  accent-color: #9ca3af;
}

.dat-coc-cell {
  width: 100px;
  min-width: 100px;
  text-align: center;
  vertical-align: middle;
}

.dat-coc-cell input[type="checkbox"] {
  width: 17px;
  height: 17px;
  margin: 0;
  pointer-events: none;
}

/* Có đặt cọc → checkbox màu đỏ */
.dat-coc-checked {
  accent-color: #dc2626;
}

/* Không đặt cọc → checkbox màu xám */
.dat-coc-unchecked {
  accent-color: #9ca3af;
}
.nguoi-thue-link {
  padding: 0;
  border: none;
  background: transparent;

  color: #2563eb;
  font: inherit;
  font-weight: 600;

  cursor: pointer;
  text-align: left;
}

.nguoi-thue-link:hover {
  text-decoration: underline;
}

.nguoi-thue-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}

.nguoi-thue-header-actions .primary {
  white-space: nowrap;
  min-width: max-content;
  flex-shrink: 0;
}

.nguoi-thue-search {
  position: relative;
  width: 300px;
  flex-shrink: 0;
}

.nguoi-thue-search input {
  width: 100%;
  height: 40px;
  box-sizing: border-box;

  padding: 0 38px 0 12px;

  border: 1px solid #cbd5e1;
  border-radius: 8px;

  font-size: 0.9rem;
  outline: none;
}

.nguoi-thue-header-actions > .primary {
  height: 40px;

  margin: 0;
  padding: 0 14px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  white-space: nowrap;
  flex-shrink: 0;
}

.nguoi-thue-search input:focus {
  border-color: #3b82f6;

  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.nguoi-thue-search input::placeholder {
  color: #94a3b8;
}

.nguoi-thue-search-clear {
  position: absolute;

  top: 50%;
  right: 8px;

  width: 24px;
  height: 24px;

  transform: translateY(-50%);

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0;

  border: none;
  border-radius: 50%;

  background: #e2e8f0;
  color: #475569;

  font-size: 16px;
  line-height: 1;

  cursor: pointer;
}

.nguoi-thue-search-clear:hover {
  background: #cbd5e1;
}

.nguoi-thue-empty {
  padding: 30px 15px;

  color: #64748b;

  text-align: center;
  font-size: 0.9rem;
}
/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 900px) {
  .app-shell {
    display: block;

    width: 100%;
    min-height: 100vh;
  }

  .menu-open-button {
    display: grid;
  }

  .sidebar {
    position: fixed;

    top: 0;
    left: 0;

    width: 260px;
    height: 100vh;

    transform: translateX(-100%);

    transition: transform 0.25s ease;

    box-shadow: 10px 0 30px rgba(15, 23, 42, 0.18);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .menu-close-button {
    display: grid;
  }

  .menu-open .menu-overlay {
    display: block;
  }

  .content {
    width: 100%;

    padding: 22px 18px;
  }

  .topbar {
    padding-left: 58px;
  }

  .topbar h2 {
    font-size: 1.65rem;
  }

  .panel-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* =========================================================
   TABLET / SMALL SCREEN
   ========================================================= */

@media (max-width: 700px) {
  .cccd-edit-section {
    grid-template-columns: 1fr;
  }

  .cccd-edit-image-wrapper,
  .cccd-edit-empty {
    height: 180px;
  }

  .cccd-edit-image {
    max-height: 165px;
  }

  .form-actions-right {
    width: 100%;
  }

  .form-actions-right button {
    flex: 1;
  }
}

/* =========================================================
   CCCD - FORM THÊM / SỬA NGƯỜI THUÊ
   ========================================================= */

.cccd-edit-section {
  grid-column: 1 / -1;

  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 20px;

  width: 100%;
  margin-top: 4px;
}

.cccd-edit-card {
  display: flex;
  flex-direction: column;

  min-width: 0;

  padding: 16px;

  border: 1px solid #e2e8f0;
  border-radius: 14px;

  background: #ffffff;

  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.cccd-edit-card label {
  display: flex;
  flex-direction: column;

  gap: 8px;

  color: #334155;

  font-size: 0.9rem;
  font-weight: 600;
}

.cccd-edit-image-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 210px;

  margin-top: 12px;
  padding: 8px;

  box-sizing: border-box;

  border: 1px solid #dbe3ee;
  border-radius: 10px;

  background: #f8fafc;

  overflow: hidden;
}

.cccd-edit-image {
  display: block;

  max-width: 100%;
  max-height: 190px;

  width: auto;
  height: auto;

  object-fit: contain;

  border-radius: 6px;
}

.cccd-edit-empty {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 210px;

  margin-top: 12px;

  border: 1px dashed #cbd5e1;
  border-radius: 10px;

  background: #f8fafc;

  color: #94a3b8;

  font-size: 0.85rem;
}

.form-actions {
  grid-column: 1 / -1;

  display: flex;
  justify-content: flex-end;
  align-items: center;

  width: 100%;

  margin-top: 4px;
  padding-top: 18px;

  border-top: 1px solid #e2e8f0;
}

.form-actions-right {
  display: flex;
  align-items: center;

  gap: 10px;
}

/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 480px) {
  .menu-open-button {
    top: 12px;
    left: 12px;

    width: 40px;
    height: 40px;
  }

  .content {
    padding: 14px 10px;
  }

  .topbar {
    flex-direction: column;

    padding-left: 52px;
  }

  .topbar .primary {
    align-self: flex-start;
  }

  .panel {
    padding: 14px;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .actions button {
    width: 100%;
  }

  .delete-modal,
  .modal-backdrop .modal,
  .modal-overlay > .modal {
    width: calc(100vw - 24px);

    border-radius: 14px;
  }

  .delete-modal-header {
    padding: 18px;
  }

  .delete-modal-body {
    padding: 18px;
  }

  .delete-modal-actions,
  .modal-actions {
    padding: 14px 18px;
  }

  .delete-modal-actions button,
  .modal-actions button {
    min-height: 40px;
  }
}
</style>
