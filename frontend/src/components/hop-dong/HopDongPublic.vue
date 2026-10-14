```vue
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import api from "../../services/api";
import { getImageUrl } from "../../utils/image";

/* =========================================================
 * TYPES
 * ======================================================= */

interface NhaTro {
  id: string | number;
  maNhaTro?: string;
  tenNhaTro?: string;
  diaChi?: string;
  soTang?: number;
}

interface Phong {
  id: string | number;
  maPhong?: string;
  //   phongSo?: string | number;
  tangSo?: number;
  nhaTro?: {
    id: string | number;
  };
  soGiuongToiDa?: number;
}

interface Giuong {
  id: string | number;
  giuongSo?: string | number;
  giaGiuong?: number;
  trangThai?: string;
  phong?: {
    id: string | number;
    nhaTro?: {
      id: string | number;
    };
  };
}

interface BenA {
  hoTen: string;
  cccd: string;
  ngayCap: string;
  noiCap: string;
  sdt: string;
  nganHang: string;
  soTaiKhoan: string;
  chuTaiKhoan: string;
  diaChi: string;
}

/* =========================================================
 * DATA
 * ======================================================= */

const loading = ref(true);
const submitting = ref(false);
const verificationStep = ref(false);

const verificationCode = ref("");

const verificationId = ref("");

const verificationEmail = ref("");

const verificationLoading = ref(false);

const verificationMessage = ref("");
const verificationSigningStatus = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const nhaTros = ref<NhaTro[]>([
  {
    id: "cau-giay",
    tenNhaTro: "Cầu Giấy",
    soTang: 10,
  },
  {
    id: "xuan-thuy",
    tenNhaTro: "Xuân Thủy",
    soTang: 10,
  },
]);
const phongs = ref<Phong[]>([]);
const giuongs = ref<Giuong[]>([]);

/*
 * Bên A được lấy từ backend.
 *
 * Tạm thời để dữ liệu rỗng để không hard-code
 * thông tin chủ nhà trong frontend.
 */
// const benA = ref<BenA>({
//   hoTen: "Nguyễn Thị Chi",
//   cccd: "0909889908098",
//   ngayCap: "12/13/2026",
//   noiCap: "Bộ công an ",
//   sdt: "098989898",
//   nganHang: "Viettin bank",
//   soTaiKhoan: "09453242344",
//   chuTaiKhoan: "Nguyễn Thị Chi",
//   diaChi: "Cầu Giấy ",
// });
const benA = ref<BenA>({
  hoTen: "",
  cccd: "",
  ngayCap: "",
  noiCap: "",
  sdt: "",
  nganHang: "",
  soTaiKhoan: "",
  chuTaiKhoan: "",
  diaChi: "",
});

const benAQr = ref("");
/* =========================================================
 * FORM
 * ======================================================= */

const form = ref({
  hoTen: "",
  cccd: "",
  cccdMatTruoc: null as File | null,
  cccdMatSau: null as File | null,
  sdt: "",
  email: "",
  ngaySinh: "",
  diaChi: "",
  bienSoXe: "",

  // =========================
  // Điều 1
  // =========================
  nhaTroId: "",
  tangSo: "",
  phongId: "",
  giuongId: "",

  // =========================
  // Điều 2
  // =========================
  tienDatCoc: 0,

  // =========================
  // Điều 3
  // =========================
  ngayBatDau: "",
  ngayKetThuc: "",

  // =========================
  // Xác nhận
  // =========================
  benBDaKy: false,
  dongYHopDong: false,
});

const cccdMatTruocPreview = ref("");
const cccdMatSauPreview = ref("");
const cccdMatTruocInput = ref<HTMLInputElement | null>(null);
const cccdMatSauInput = ref<HTMLInputElement | null>(null);

function handleCccdMatTruocChange(event: Event) {
  const input = event.target as HTMLInputElement;

  const file = input.files?.[0] ?? null;

  form.value.cccdMatTruoc = file;

  if (cccdMatTruocPreview.value) {
    URL.revokeObjectURL(cccdMatTruocPreview.value);
  }

  cccdMatTruocPreview.value = file ? URL.createObjectURL(file) : "";
}

function handleCccdMatSauChange(event: Event) {
  const input = event.target as HTMLInputElement;

  const file = input.files?.[0] ?? null;

  form.value.cccdMatSau = file;

  if (cccdMatSauPreview.value) {
    URL.revokeObjectURL(cccdMatSauPreview.value);
  }

  cccdMatSauPreview.value = file ? URL.createObjectURL(file) : "";
}

function resetContractForm() {
  // Giải phóng object URL của ảnh preview
  if (cccdMatTruocPreview.value) {
    URL.revokeObjectURL(cccdMatTruocPreview.value);
  }

  if (cccdMatSauPreview.value) {
    URL.revokeObjectURL(cccdMatSauPreview.value);
  }

  // Reset toàn bộ dữ liệu form
  form.value = {
    hoTen: "",
    cccd: "",
    cccdMatTruoc: null,
    cccdMatSau: null,
    sdt: "",
    email: "",
    ngaySinh: "",
    diaChi: "",
    bienSoXe: "",

    nhaTroId: "",
    tangSo: "",
    phongId: "",
    giuongId: "",

    tienDatCoc: 0,

    ngayBatDau: "",
    ngayKetThuc: "",

    benBDaKy: false,
    dongYHopDong: false,
  };

  // Reset ô hiển thị tiền đặt cọc
  tienDatCocDisplay.value = "";

  // Reset preview ảnh
  cccdMatTruocPreview.value = "";
  cccdMatSauPreview.value = "";

  // Reset input file thật trong DOM
  if (cccdMatTruocInput.value) {
    cccdMatTruocInput.value.value = "";
  }

  if (cccdMatSauInput.value) {
    cccdMatSauInput.value.value = "";
  }

  // Reset thông tin xác nhận OTP
  verificationCode.value = "";
  verificationId.value = "";
  verificationEmail.value = "";
  verificationMessage.value = "";
  verificationSigningStatus.value = false;

  // Reset thông báo lỗi
  errorMessage.value = "";
}

function isValidImage(file: File | null) {
  if (!file) {
    return false;
  }

  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
    file.type,
  );
}
/* =========================================================
 * DISPLAY MONEY
 * ======================================================= */

const tienDatCocDisplay = ref("");

function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "";
  }

  return numberValue.toLocaleString("en-US");
}

function normalizeTienDatCoc(value: string): number | null {
  const trimmed = value.trim();

  // Để trống => 0
  if (trimmed === "") {
    return 0;
  }

  // Cho phép số nguyên không âm, có thể có dấu . phân cách hàng nghìn
  // Ví dụ:
  // 5000
  // 5.000
  // 1.000.000
  // 1000000
  if (!/^\d+(?:\.\d{3})*$/.test(trimmed) && !/^\d+$/.test(trimmed)) {
    return null;
  }

  // Bỏ dấu chấm phân cách hàng nghìn
  const rawValue = trimmed.replace(/\./g, "");

  const numberValue = Number(rawValue);

  if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
    return null;
  }

  return numberValue;
}

function handleTienDatCocInput(event: Event) {
  const input = event.target as HTMLInputElement;

  const value = input.value;

  // Cho phép người dùng nhập tạm thời.
  // Validation chính sẽ thực hiện khi bấm tiếp tục.
  tienDatCocDisplay.value = value;

  const normalized = normalizeTienDatCoc(value);

  if (normalized !== null) {
    form.value.tienDatCoc = normalized;
  }
}

/* =========================================================
 * PRICE
 * ======================================================= */

const selectedGiuong = computed<Giuong | null>(() => {
  if (!form.value.giuongId) {
    return null;
  }

  return (
    giuongs.value.find(
      (item) => String(item.id) === String(form.value.giuongId),
    ) ?? null
  );
});

const tienThue = computed(() => {
  return Number(selectedGiuong.value?.giaGiuong ?? 0);
});

const tienThueDisplay = computed(() => {
  return tienThue.value ? formatMoney(tienThue.value) : "";
});

/* =========================================================
 * NHA TRO
 * ======================================================= */

const selectedNhaTro = computed(() => {
  return (
    nhaTros.value.find(
      (item) => String(item.id) === String(form.value.nhaTroId),
    ) ?? null
  );
});

const tangOptions = computed(() => {
  const soTang = Number(selectedNhaTro.value?.soTang ?? 0);

  if (soTang <= 0) {
    return [];
  }

  return Array.from({ length: soTang }, (_, index) => index + 1);
});

/* =========================================================
 * PHÒNG
 * ======================================================= */

const phongOptions = computed(() => {
  // Chưa chọn Nhà trọ hoặc Tầng
  // => không cho Phòng hiển thị
  if (!form.value.nhaTroId || !form.value.tangSo) {
    return [];
  }

  return phongs.value.filter((item) => {
    const dungNhaTro = String(item.nhaTro?.id) === String(form.value.nhaTroId);

    const dungTang = Number(item.tangSo) === Number(form.value.tangSo);

    return dungNhaTro && dungTang;
  });
});

/* =========================================================
 * GIƯỜNG
 * ======================================================= */

const giuongOptions = computed(() => {
  // Chưa chọn Nhà trọ / Tầng / Phòng
  // => không hiển thị giường
  if (!form.value.nhaTroId || !form.value.tangSo || !form.value.phongId) {
    return [];
  }

  return giuongs.value.filter((item) => {
    // Giường phải thuộc đúng Phòng
    const dungPhong = String(item.phong?.id) === String(form.value.phongId);

    // Giường phải thuộc đúng Nhà trọ
    const dungNhaTro =
      String(item.phong?.nhaTro?.id) === String(form.value.nhaTroId);

    // Chỉ cho thuê giường chưa thuê
    const status = String(item.trangThai ?? "").toLowerCase();

    const chuaThue = !["da_thue", "đã thuê", "occupied"].includes(status);

    return dungPhong && dungNhaTro && chuaThue;
  });
});

/* =========================================================
 * CHANGE HANDLERS
 * ======================================================= */

function handleNhaTroChange() {
  form.value.tangSo = "";
  form.value.phongId = "";
  form.value.giuongId = "";
}

function handleTangChange() {
  form.value.phongId = "";
  form.value.giuongId = "";
}

function handlePhongChange() {
  form.value.giuongId = "";
}

/* =========================================================
 * DATE VALIDATION
 * ======================================================= */

const minimumEndDate = computed(() => {
  if (!form.value.ngayBatDau) {
    return "";
  }

  const startDate = new Date(`${form.value.ngayBatDau}T00:00:00`);

  if (Number.isNaN(startDate.getTime())) {
    return "";
  }

  startDate.setMonth(startDate.getMonth() + 3);

  const year = startDate.getFullYear();

  const month = String(startDate.getMonth() + 1).padStart(2, "0");

  const day = String(startDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
});

function validateDateRange() {
  if (!form.value.ngayBatDau || !form.value.ngayKetThuc) {
    return true;
  }

  const startDate = new Date(`${form.value.ngayBatDau}T00:00:00`);

  const endDate = new Date(`${form.value.ngayKetThuc}T00:00:00`);

  if (startDate >= endDate) {
    errorMessage.value = "Ngày kết thúc phải lớn hơn ngày bắt đầu.";

    return false;
  }

  if (minimumEndDate.value && form.value.ngayKetThuc < minimumEndDate.value) {
    errorMessage.value = "Thời hạn thuê tối thiểu là 3 tháng.";

    return false;
  }

  return true;
}

/* =========================================================
 * VALIDATION
 * ======================================================= */

function validateForm() {
  errorMessage.value = "";

  if (!form.value.hoTen.trim()) {
    errorMessage.value = "Vui lòng nhập Họ và tên.";
    return false;
  }

  if (!form.value.sdt.trim()) {
    errorMessage.value = "Vui lòng nhập số điện thoại.";
    return false;
  }

  if (!/^0\d{9}$/.test(form.value.sdt)) {
    errorMessage.value =
      "Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng 0.";
    return false;
  }

  if (!form.value.cccd.trim()) {
    errorMessage.value = "Vui lòng nhập số CCCD.";
    return false;
  }

  if (!/^\d+$/.test(form.value.cccd)) {
    errorMessage.value = "CCCD chỉ được nhập chữ số.";
    return false;
  }

  if (!form.value.cccdMatTruoc) {
    errorMessage.value = "Vui lòng chọn ảnh CCCD mặt trước.";
    return false;
  }

  if (!isValidImage(form.value.cccdMatTruoc)) {
    errorMessage.value =
      "Ảnh CCCD mặt trước phải có định dạng JPG, JPEG, PNG hoặc WEBP.";
    return false;
  }

  if (!form.value.cccdMatSau) {
    errorMessage.value = "Vui lòng chọn ảnh CCCD mặt sau.";
    return false;
  }

  if (!isValidImage(form.value.cccdMatSau)) {
    errorMessage.value =
      "Ảnh CCCD mặt sau phải có định dạng JPG, JPEG, PNG hoặc WEBP.";
    return false;
  }

  if (!form.value.email.trim()) {
    errorMessage.value = "Vui lòng nhập Gmail.";
    return false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errorMessage.value = "Gmail không hợp lệ.";
    return false;
  }

  if (!form.value.nhaTroId) {
    errorMessage.value = "Vui lòng chọn nhà trọ.";
    return false;
  }

  if (!form.value.tangSo) {
    errorMessage.value = "Vui lòng chọn tầng.";
    return false;
  }

  if (!form.value.phongId) {
    errorMessage.value = "Vui lòng chọn phòng.";
    return false;
  }

  if (!form.value.giuongId) {
    errorMessage.value = "Vui lòng chọn giường.";
    return false;
  }

  const tienDatCocInput = tienDatCocDisplay.value.trim();

  const tienDatCoc = normalizeTienDatCoc(tienDatCocInput);

  if (tienDatCoc === null) {
    errorMessage.value =
      "Tiền đặt cọc phải là số nguyên không âm. Ví dụ: 5000 hoặc 1.000.000.";
    return false;
  }

  form.value.tienDatCoc = tienDatCoc;

  if (!form.value.ngayBatDau) {
    errorMessage.value = "Vui lòng chọn ngày bắt đầu.";
    return false;
  }

  if (!form.value.ngayKetThuc) {
    errorMessage.value = "Vui lòng chọn ngày kết thúc.";
    return false;
  }

  if (!validateDateRange()) {
    return false;
  }

  if (!form.value.dongYHopDong) {
    errorMessage.value =
      "Vui lòng tích vào ô đồng ý với toàn bộ nội dung hợp đồng.";
    return false;
  }

  if (!form.value.ngaySinh) {
    errorMessage.value = "Vui lòng chọn ngày sinh.";
    return false;
  }

  if (!form.value.diaChi.trim()) {
    errorMessage.value = "Vui lòng nhập địa chỉ.";
    return false;
  }

  // if (!form.value.bienSoXe.trim()) {
  //   errorMessage.value = "Vui lòng nhập biển số xe.";
  //   return false;
  // }

  // if (form.value.tienDatCoc <= 0) {
  //   errorMessage.value = "Vui lòng nhập tiền đặt cọc.";
  //   return false;
  // }

  return true;
}

/* =========================================================
 * LOAD DATA
 * ======================================================= */

async function loadData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await api.get("/public/hop-dong/data");

    const data = response.data;

    // ==========================================
    // BÊN A - TAI_KHOAN
    // ==========================================
    const taiKhoan = data?.taiKhoan;

    benA.value = {
      hoTen: taiKhoan?.hoTen ?? taiKhoan?.tenHienThi ?? "",
      cccd: taiKhoan?.soCccd ?? "",
      ngayCap: taiKhoan?.ngayCap
        ? String(taiKhoan.ngayCap).substring(0, 10)
        : "",
      noiCap: taiKhoan?.noiCap ?? "",
      sdt: taiKhoan?.dienThoai ?? "",
      nganHang: taiKhoan?.nganHang ?? "",
      soTaiKhoan: taiKhoan?.soTaiKhoan ?? "",
      chuTaiKhoan: taiKhoan?.chuTaiKhoan ?? "",
      diaChi: taiKhoan?.diaChiThuongTru ?? "",
    };

    // ==========================================
    // MÃ QR THANH TOÁN - TAI_KHOAN
    // ==========================================
    benAQr.value = taiKhoan?.maQrThanhToan
      ? getImageUrl(taiKhoan.maQrThanhToan)
      : "";

    // ==========================================
    // NHÀ TRỌ
    // ==========================================
    nhaTros.value = data?.nhaTros ?? [];

    // ==========================================
    // PHÒNG
    // ==========================================
    phongs.value = data?.phongs ?? [];

    // ==========================================
    // GIƯỜNG
    // ==========================================
    giuongs.value = data?.giuongs ?? [];
  } catch (error: any) {
    console.error("Không thể tải dữ liệu hợp đồng:", error);

    errorMessage.value =
      error?.response?.data?.message ??
      "Không thể tải thông tin hợp đồng. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
}

/* =========================================================
 * SUBMIT
 * ======================================================= */

async function submitContract() {
  successMessage.value = "";
  errorMessage.value = "";

  if (!validateForm()) {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    return;
  }

  submitting.value = true;

  try {
    const formData = new FormData();

    // =========================
    // THÔNG TIN NGƯỜI THUÊ
    // =========================
    formData.append("hoTen", form.value.hoTen.trim());
    formData.append("cccd", form.value.cccd.trim());
    formData.append("sdt", form.value.sdt.trim());
    formData.append("email", form.value.email.trim());
    formData.append("ngaySinh", form.value.ngaySinh || "");
    formData.append("diaChi", form.value.diaChi.trim());
    formData.append("bienSoXe", form.value.bienSoXe.trim());

    // =========================
    // VỊ TRÍ THUÊ
    // =========================
    formData.append("nhaTroId", String(form.value.nhaTroId));
    formData.append("tangSo", String(form.value.tangSo));
    formData.append("phongId", String(form.value.phongId));
    formData.append("giuongId", String(form.value.giuongId));

    // =========================
    // HỢP ĐỒNG
    // =========================
    formData.append("tienDatCoc", String(form.value.tienDatCoc));

    formData.append("ngayBatDau", form.value.ngayBatDau);

    formData.append("ngayKetThuc", form.value.ngayKetThuc);

    formData.append("benBDaKy", String(form.value.benBDaKy));

    formData.append("dongYHopDong", String(form.value.dongYHopDong));

    // =========================
    // ẢNH CCCD
    // =========================
    if (form.value.cccdMatTruoc) {
      formData.append("cccdMatTruoc", form.value.cccdMatTruoc);
    }

    if (form.value.cccdMatSau) {
      formData.append("cccdMatSau", form.value.cccdMatSau);
    }

    // =========================
    // GỬI HỢP ĐỒNG
    // =========================
    const response = await api.post(
      "/public/hop-dong/request-verification",
      formData,
    );

    verificationId.value = response.data?.verificationId ?? "";

    verificationEmail.value = form.value.email.trim();

    // Lưu lại trạng thái ký của Bên B trước khi chuyển sang màn hình xác nhận
    verificationSigningStatus.value = form.value.benBDaKy;

    verificationMessage.value = "";

    verificationCode.value = "";

    verificationStep.value = true;

    successMessage.value = "";

    successMessage.value =
      response.data?.message ??
      "Hợp đồng đã được tạo và gửi qua email thành công.";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error: any) {
    console.error("Không thể hoàn thành hợp đồng:", error);

    errorMessage.value =
      error?.response?.data?.message ??
      "Không thể hoàn thành hợp đồng. Vui lòng thử lại.";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } finally {
    submitting.value = false;
  }
}

async function verifyContract() {
  errorMessage.value = "";
  successMessage.value = "";
  verificationMessage.value = "";

  const code = verificationCode.value.trim();

  if (!code) {
    verificationMessage.value = "Vui lòng nhập mã xác nhận.";

    return;
  }

  if (!/^\d{6}$/.test(code)) {
    verificationMessage.value = "Mã xác nhận phải gồm 6 chữ số.";

    return;
  }

  verificationLoading.value = true;

  try {
    const response = await api.post("/public/hop-dong/verify", {
      verificationId: verificationId.value,

      code,
    });

    successMessage.value =
      response.data?.message ??
      "Xác nhận thành công. Hợp đồng đã được gửi đến email.";

    // Quay lại form HỢP ĐỒNG THUÊ TRỌ
    verificationStep.value = false;

    // Reset toàn bộ dữ liệu người dùng vừa nhập
    resetContractForm();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error: any) {
    console.error("Không thể xác nhận OTP:", error);

    verificationMessage.value =
      error?.response?.data?.message ??
      "Mã xác nhận không đúng. Vui lòng thử lại.";
  } finally {
    verificationLoading.value = false;
  }
}
/* =========================================================
 * INIT
 * ======================================================= */

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="contract-page">
    <div class="contract-paper">
      <template v-if="verificationStep">
        <div class="verification-box">
          <h2>XÁC NHẬN HỢP ĐỒNG</h2>

          <div class="verification-signing-status">
            <p v-if="verificationSigningStatus" class="signing-agreed">
              Bạn đã đồng ý và xác nhận đã ký
            </p>

            <p v-else class="signing-not-agreed">
              Bạn đã không đồng ý và không ký
            </p>
          </div>

          <p class="verification-note">
            Mã xác nhận đã được gửi đến email của bạn.
          </p>

          <strong class="verification-email">
            {{ verificationEmail }}
          </strong>

          <p class="verification-note">
            Vui lòng kiểm tra email và nhập mã xác nhận gồm 6 chữ số.
          </p>

          <div v-if="verificationMessage" class="message message-error">
            {{ verificationMessage }}
          </div>

          <div class="verification-input">
            <label>Mã xác nhận</label>

            <input
              v-model="verificationCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
              placeholder="Nhập mã 6 chữ số"
            />
          </div>

          <button
            type="button"
            class="submit-button"
            :disabled="verificationLoading"
            @click="verifyContract"
          >
            <span v-if="verificationLoading"> Đang xác nhận... </span>

            <span v-else> Xác nhận mã </span>
          </button>

          <p class="verification-expire">
            Mã xác nhận có hiệu lực trong 10 phút.
          </p>
        </div>
      </template>
      <template v-else>
        <header class="contract-header">
          <div class="national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>

          <div class="national-subtitle">Độc lập - Tự do - Hạnh phúc</div>

          <div class="header-line"></div>

          <h1>HỢP ĐỒNG THUÊ TRỌ</h1>

          <p class="legal-basis">
            Căn cứ Bộ luật Dân sự 2015 và Luật Nhà ở 2023, hai bên tự nguyện
            thỏa thuận các điều khoản của hợp đồng như sau:
          </p>
        </header>
      </template>
      <!-- =================================================
           LOADING
      ================================================== -->

      <div v-if="loading" class="loading-box">
        Đang tải thông tin hợp đồng...
      </div>

      <!-- =================================================
           ERROR
      ================================================== -->

      <div v-if="errorMessage" class="message message-error">
        {{ errorMessage }}
      </div>

      <!-- =================================================
           SUCCESS
      ================================================== -->

      <div v-if="successMessage" class="message message-success">
        {{ successMessage }}
      </div>

      <template v-if="!loading && !verificationStep">
        <!-- =================================================
             BÊN A
        ================================================== -->

        <section class="contract-section">
          <h2>BÊN CHO THUÊ (BÊN A)</h2>

          <div class="section-content">
            <div class="form-row">
              <label>Họ và tên</label>

              <input type="text" :value="benA.hoTen" readonly />
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label>CCCD số</label>

                <input type="text" :value="benA.cccd" readonly />
              </div>

              <div class="form-group">
                <label>Ngày cấp</label>

                <input type="text" :value="benA.ngayCap" readonly />
              </div>

              <div class="form-group">
                <label>Nơi cấp</label>

                <input type="text" :value="benA.noiCap" readonly />
              </div>
            </div>
            <div class="form-row">
              <label>Địa chỉ thường trú</label>

              <input type="text" :value="benA.diaChi" readonly />
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Điện thoại</label>

                <input type="text" :value="benA.sdt" readonly />
              </div>

              <div class="form-group">
                <label>Ngân hàng</label>

                <input type="text" :value="benA.nganHang" readonly />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label>Số tài khoản</label>

                <input type="text" :value="benA.soTaiKhoan" readonly />
              </div>

              <div class="form-group">
                <label>Chủ tài khoản</label>

                <input type="text" :value="benA.chuTaiKhoan" readonly />
              </div>
            </div>
            <div class="qr-payment">
              <div class="qr-payment-title">Mã QR thanh toán</div>

              <img
                v-if="benAQr"
                :src="benAQr"
                alt="Mã QR thanh toán của Bên A"
                class="qr-payment-image"
              />

              <div v-else class="qr-payment-empty">
                Chưa cập nhật mã QR thanh toán
              </div>
            </div>
          </div>
        </section>

        <!-- =================================================
             BÊN B
        ================================================== -->

        <section class="contract-section">
          <h2>BÊN THUÊ (BÊN B)</h2>

          <p class="section-note">
            Vui lòng nhập đầy đủ thông tin của người thuê.
          </p>

          <div class="section-content">
            <div class="form-row">
              <label> Họ và tên <span>*</span> </label>

              <input
                v-model="form.hoTen"
                type="text"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label> Số điện thoại <span>*</span> </label>

                <input
                  v-model="form.sdt"
                  type="text"
                  inputmode="numeric"
                  maxlength="10"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div class="form-group">
                <label> CCCD <span>*</span> </label>

                <input
                  v-model="form.cccd"
                  type="text"
                  inputmode="numeric"
                  maxlength="12"
                  placeholder="Nhập số CCCD"
                />
              </div>
            </div>
            <div class="form-grid-2 cccd-image-grid">
              <!-- CCCD MẶT TRƯỚC -->
              <div class="form-group">
                <label> Ảnh CCCD mặt trước <span>*</span> </label>

                <input
                  ref="cccdMatTruocInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  @change="handleCccdMatTruocChange"
                />

                <div v-if="cccdMatTruocPreview" class="cccd-preview">
                  <img :src="cccdMatTruocPreview" alt="Ảnh CCCD mặt trước" />
                </div>

                <div v-if="form.cccdMatTruoc" class="file-selected">
                  {{ form.cccdMatTruoc.name }}
                </div>
              </div>

              <!-- CCCD MẶT SAU -->
              <div class="form-group">
                <label> Ảnh CCCD mặt sau <span>*</span> </label>

                <input
                  ref="cccdMatSauInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  @change="handleCccdMatSauChange"
                />

                <div v-if="cccdMatSauPreview" class="cccd-preview">
                  <img :src="cccdMatSauPreview" alt="Ảnh CCCD mặt sau" />
                </div>

                <div v-if="form.cccdMatSau" class="file-selected">
                  {{ form.cccdMatSau.name }}
                </div>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label> Gmail <span>*</span> </label>

                <input
                  v-model="form.email"
                  type="email"
                  placeholder="Nhập Gmail"
                />
              </div>

              <div class="form-group">
                <label>Ngày sinh <span>*</span></label>

                <input v-model="form.ngaySinh" type="date" />
              </div>
            </div>

            <div class="form-row">
              <label>Địa chỉ thường trú <span>*</span></label>

              <input
                v-model="form.diaChi"
                type="text"
                placeholder="Nhập địa chỉ"
              />
            </div>

            <div class="form-row">
              <label>Biển số xe </label>

              <input
                v-model="form.bienSoXe"
                type="text"
                placeholder="Nhập biển số xe"
              />
            </div>
          </div>
        </section>

        <p class="agreement-intro">Hai bên thống nhất các điều khoản sau:</p>

        <!-- =================================================
             ĐIỀU 1
        ================================================== -->

        <section class="contract-section article-section">
          <h2>ĐIỀU 1. ĐỊA CHỈ NHÀ TRỌ CHO THUÊ</h2>

          <div class="section-content">
            <div class="form-row">
              <label> Nhà trọ <span>*</span> </label>

              <select v-model="form.nhaTroId" @change="handleNhaTroChange">
                <option value="">-- Chọn nhà trọ --</option>

                <option v-for="item in nhaTros" :key="item.id" :value="item.id">
                  {{ item.tenNhaTro || item.maNhaTro }}
                  <span v-if="item.diaChi"> - {{ item.diaChi }} </span>
                </option>
              </select>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label> Tầng số <span>*</span> </label>

                <select
                  v-model="form.tangSo"
                  @change="handleTangChange"
                  :disabled="!form.nhaTroId"
                >
                  <option value="">-- Chọn tầng --</option>

                  <option v-for="tang in tangOptions" :key="tang" :value="tang">
                    Tầng {{ tang }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label> Phòng số <span>*</span> </label>

                <select
                  v-model="form.phongId"
                  @change="handlePhongChange"
                  :disabled="!form.tangSo"
                >
                  <option value="">-- Chọn phòng --</option>

                  <option
                    v-for="item in phongOptions"
                    :key="item.id"
                    :value="item.id"
                  >
                    Phòng
                    {{
                      item.maPhong
                        ?.match(/_T\d+(\d{2})$/)?.[1]
                        ?.replace(/^0+/, "") || ""
                    }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label> Giường số <span>*</span> </label>

                <select v-model="form.giuongId" :disabled="!form.phongId">
                  <option value="">-- Chọn giường --</option>

                  <option
                    v-for="item in giuongOptions"
                    :key="item.id"
                    :value="item.id"
                  >
                    Giường {{ item.giuongSo }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="selectedNhaTro" class="selected-location">
              <strong>Địa chỉ nhà trọ:</strong>
              {{ selectedNhaTro.diaChi || "—" }}
            </div>
          </div>
        </section>

        <!-- =================================================
             ĐIỀU 2
        ================================================== -->

        <section class="contract-section article-section">
          <h2>ĐIỀU 2. GIÁ THUÊ, TIỀN ĐẶT CỌC VÀ THANH TOÁN</h2>

          <div class="section-content">
            <div class="form-grid-2">
              <div class="form-group">
                <label>1. Giá thuê <span>*</span></label>

                <div class="money-input">
                  <input
                    type="text"
                    :value="tienThueDisplay"
                    readonly
                    placeholder="Chọn giường"
                  />

                  <span>đồng/tháng</span>
                </div>
              </div>

              <div class="form-group">
                <label> 2. Tiền đặt cọc </label>

                <div class="money-input">
                  <input
                    type="text"
                    :value="tienDatCocDisplay"
                    @input="handleTienDatCocInput"
                    inputmode="decimal"
                    autocomplete="off"
                  />

                  <span>đồng</span>
                </div>
              </div>
            </div>

            <div class="contract-text">
              <p>
                3. Giá thuê đã bao gồm các dịch vụ đi kèm theo thỏa thuận của
                hai bên.
              </p>

              <p>
                4. Bên B có trách nhiệm thanh toán tiền thuê vào ngày mùng 1
                hằng tháng bằng hình thức chuyển khoản.
              </p>

              <p>
                5. Các khoản tiền và nghĩa vụ thanh toán khác, nếu có, được thực
                hiện theo thỏa thuận cụ thể giữa hai bên.
              </p>
            </div>
          </div>
        </section>

        <!-- =================================================
             ĐIỀU 3
        ================================================== -->

        <section class="contract-section article-section">
          <h2>ĐIỀU 3. THỜI HẠN THUÊ VÀ GIAO NHẬN</h2>

          <div class="section-content">
            <p class="article-text">
              1. Thời hạn thuê tối thiểu là 03 tháng. Hai bên thống nhất thời
              gian thuê như sau:
            </p>

            <div class="form-grid-2">
              <div class="form-group">
                <label> Ngày bắt đầu <span>*</span> </label>

                <input
                  v-model="form.ngayBatDau"
                  type="date"
                  :max="form.ngayKetThuc || undefined"
                />
              </div>

              <div class="form-group">
                <label> Ngày kết thúc <span>*</span> </label>

                <input
                  v-model="form.ngayKetThuc"
                  type="date"
                  :min="minimumEndDate || undefined"
                />
              </div>
            </div>

            <div v-if="minimumEndDate" class="info-note">
              Ngày kết thúc sớm nhất:
              <strong>
                {{ minimumEndDate }}
              </strong>
              để đảm bảo thời hạn thuê tối thiểu 03 tháng.
            </div>
          </div>
          <div class="section-content">
            <p class="article-text">
              2. Bên A có trách nhiệm bàn giao chỗ thuê cho Bên B theo đúng thời
              gian và hiện trạng đã thỏa thuận.
            </p>
          </div>
        </section>

        <!-- =================================================
             ĐIỀU 4
        ================================================== -->

        <section class="contract-section article-section">
          <h2>ĐIỀU 4. QUYỀN VÀ NGHĨA VỤ CỦA HAI BÊN</h2>

          <div class="contract-text">
            <p><strong>4.1. Bên A:</strong></p>
            <ul>
              <li>Giao chỗ thuê đúng hiện trạng và thời gian đã thỏa thuận.</li>
              <li>
                Đảm bảo cho Bên B được sử dụng ổn định chỗ thuê trong thời hạn
                hợp đồng, trừ các trường hợp được phép theo thỏa thuận và quy
                định pháp luật.
              </li>
              <li>
                Thực hiện sửa chữa các hư hỏng không do lỗi của Bên B theo trách
                nhiệm của Bên A.
              </li>
              <li>
                Tôn trọng quyền và lợi ích hợp pháp của Bên B theo hợp đồng và
                quy định pháp luật.
              </li>
            </ul>

            <p><strong>4.2. Bên B:</strong></p>
            <ul>
              <li>
                Thanh toán tiền thuê và các khoản chi phí theo đúng thời hạn đã
                thỏa thuận.
              </li>
              <li>
                Sử dụng chỗ thuê đúng mục đích; giữ gìn tài sản; không tự ý sửa
                chữa, cải tạo hoặc cho thuê lại khi chưa được Bên A đồng ý.
              </li>
              <li>
                Tuân thủ nội quy nhà trọ, quy định về phòng cháy, chữa cháy và
                thực hiện đăng ký, khai báo tạm trú theo quy định pháp luật.
              </li>
              <li>
                Khi chấm dứt hợp đồng, bàn giao lại chỗ thuê và tài sản theo
                hiện trạng ban đầu, ngoại trừ hao mòn tự nhiên và các trường hợp
                khác được hai bên thống nhất.
              </li>
            </ul>
          </div>
        </section>

        <!-- =================================================
             ĐIỀU 5
        ================================================== -->

        <section class="contract-section article-section">
          <h2>ĐIỀU 5. CHẤM DỨT HỢP ĐỒNG</h2>

          <div class="contract-text">
            <p>
              1. Hợp đồng chấm dứt khi hết thời hạn thuê hoặc theo thỏa thuận
              của hai bên, hoặc các trường hợp khác theo quy định pháp luật.
            </p>

            <p>
              2. Thời hạn thuê tối thiểu là 03 tháng. Trường hợp một bên muốn
              chấm dứt hợp đồng trước thời hạn, bên đó phải thông báo cho bên
              còn lại trước ít nhất 30 ngày, trừ trường hợp hai bên có thỏa
              thuận khác hoặc pháp luật có quy định khác.
            </p>

            <p>
              3. Bên vi phạm nghĩa vụ dẫn đến việc chấm dứt hợp đồng phải chịu
              trách nhiệm bồi thường thiệt hại theo thỏa thuận hợp pháp của hai
              bên và quy định pháp luật.
            </p>

            <p>
              4. Tiền đặt cọc được hoàn trả hoặc khấu trừ các khoản nghĩa vụ còn
              thiếu, chi phí khắc phục hư hỏng do lỗi của Bên B và các khoản
              khác theo thỏa thuận hợp pháp của hai bên.
            </p>
          </div>
        </section>

        <!-- =================================================
             ĐIỀU 6
        ================================================== -->

        <section class="contract-section article-section">
          <h2>ĐIỀU 6. CAM KẾT CHUNG</h2>

          <div class="contract-text">
            <p>
              1. Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận
              trong hợp đồng.
            </p>

            <p>
              2. Mọi tranh chấp phát sinh trong quá trình thực hiện hợp đồng
              trước hết được hai bên ưu tiên giải quyết thông qua thương lượng.
            </p>

            <p>
              3. Trường hợp thương lượng không thành công, tranh chấp được giải
              quyết tại Tòa án nhân dân có thẩm quyền theo quy định pháp luật.
            </p>
          </div>
        </section>
        <!-- ĐIỀU 7 -->
        <section class="contract-section article-section">
          <h2>ĐIỀU 7. CAM KẾT VỀ TÍNH CHÍNH XÁC CỦA THÔNG TIN, DỮ LIỆU</h2>

          <div class="contract-text">
            <p>
              1. Bên B cam kết các thông tin, dữ liệu, giấy tờ và tài liệu do
              mình cung cấp để lập, xác nhận và thực hiện hợp đồng, bao gồm
              nhưng không giới hạn ở họ tên, ngày tháng năm sinh, số định danh
              cá nhân hoặc căn cước công dân, địa chỉ, số điện thoại, email và
              các thông tin liên quan khác, là đầy đủ, chính xác, trung thực và
              thuộc quyền cung cấp, sử dụng hợp pháp của Bên B.
            </p>

            <p>
              2. Bên B chịu trách nhiệm về tính chính xác, trung thực và hợp
              pháp của các thông tin, dữ liệu do mình cung cấp; có trách nhiệm
              thông báo và phối hợp cập nhật kịp thời khi phát hiện thông tin
              sai lệch, thiếu sót hoặc có thay đổi ảnh hưởng đến việc thực hiện
              hợp đồng.
            </p>

            <p>
              3. Trường hợp Bên B cung cấp thông tin sai sự thật, giả mạo giấy
              tờ, sử dụng thông tin của người khác trái phép hoặc có hành vi
              gian dối làm ảnh hưởng đến quyền, lợi ích hợp pháp của Bên A hoặc
              bên thứ ba, Bên B phải chịu trách nhiệm đối với hành vi của mình
              và bồi thường thiệt hại thực tế phát sinh theo quy định pháp luật.
              Việc xử lý vi phạm hoặc chấm dứt hợp đồng phải tuân thủ các điều
              khoản hợp đồng và quy định pháp luật có liên quan.
            </p>

            <p>
              4. Bên A có trách nhiệm sử dụng, lưu trữ và bảo vệ thông tin, dữ
              liệu cá nhân của Bên B theo mục đích hợp pháp, phạm vi cần thiết
              để lập, quản lý và thực hiện hợp đồng, đồng thời tuân thủ quy định
              pháp luật về bảo vệ dữ liệu cá nhân. Việc cung cấp thông tin cho
              bên thứ ba chỉ được thực hiện khi có căn cứ pháp luật hoặc sự đồng
              ý hợp lệ của chủ thể dữ liệu, tùy từng trường hợp.
            </p>
          </div>
        </section>

        <!-- ĐIỀU 8 -->
        <section class="contract-section article-section">
          <h2>ĐIỀU 8. HIỆU LỰC PHÁP LÝ CỦA HỢP ĐỒNG ĐIỆN TỬ</h2>

          <div class="contract-text">
            <p>
              1. Hai bên thống nhất xác lập và xác nhận hợp đồng thông qua hệ
              thống điện tử của nền tảng quản lý nhà trọ. Hợp đồng cùng các dữ
              liệu điện tử ghi nhận quá trình tạo lập, hiển thị, xác nhận và lưu
              trữ hợp đồng được sử dụng làm căn cứ xác định nội dung thỏa thuận
              và việc xác nhận của các bên theo quy định pháp luật.
            </p>

            <p>
              2. Bên A xác nhận việc đồng ý giao kết hợp đồng thông qua thao tác
              xác nhận điện tử hoặc phương thức xác nhận được hệ thống ghi nhận.
              Bên B xác nhận đã đọc, hiểu, có cơ hội xem xét nội dung hợp đồng,
              tự nguyện đồng ý với toàn bộ điều khoản và thực hiện thao tác xác
              nhận điện tử theo hướng dẫn của hệ thống.
            </p>

            <p>
              3. Các bên thống nhất rằng việc xác nhận điện tử có thể được sử
              dụng làm căn cứ chứng minh ý chí giao kết hợp đồng. Giá trị pháp
              lý của hợp đồng điện tử, dữ liệu điện tử và phương thức xác nhận
              được xác định theo quy định pháp luật hiện hành; việc xác nhận
              điện tử không mặc nhiên thay thế chữ ký hoặc hình thức bắt buộc
              khác trong trường hợp pháp luật yêu cầu.
            </p>

            <p>
              4. Hợp đồng có hiệu lực kể từ thời điểm hai bên hoàn tất việc xác
              nhận giao kết theo phương thức đã thỏa thuận, trừ khi hai bên có
              thỏa thuận khác hoặc pháp luật có quy định khác. Hợp đồng chấm dứt
              theo Điều 5 của hợp đồng và các quy định pháp luật có liên quan.
            </p>

            <p>
              5. Hệ thống có thể lưu trữ các thông tin phục vụ việc chứng minh
              giao kết hợp đồng như nội dung hợp đồng tại thời điểm xác nhận,
              thời gian xác nhận, tài khoản thực hiện và lịch sử thao tác liên
              quan. Việc thu thập, lưu trữ và sử dụng các thông tin này phải
              tuân thủ quy định pháp luật về bảo vệ dữ liệu cá nhân và các quy
              định pháp luật có liên quan.
            </p>

            <p>
              6. Hợp đồng điện tử được lưu trữ trên hệ thống để các bên có thể
              xem lại và đối chiếu khi cần thiết. Mỗi bên có trách nhiệm giữ gìn
              thông tin đăng nhập và không để người khác sử dụng tài khoản của
              mình để xác nhận hợp đồng trái phép.
            </p>
          </div>
        </section>

        <!-- ĐIỀU 9 -->
        <section class="contract-section article-section">
          <h2>ĐIỀU 9. ĐIỀU KHOẢN CUỐI CÙNG</h2>

          <div class="contract-text">
            <p>
              Hai bên xác nhận đã đọc, hiểu và tự nguyện đồng ý với toàn bộ nội
              dung hợp đồng. Những vấn đề chưa được quy định trong hợp đồng này
              được thực hiện theo thỏa thuận hợp pháp của hai bên và quy định
              pháp luật hiện hành.
            </p>

            <p>
              Hợp đồng được lập và lưu trữ dưới dạng điện tử trên hệ thống. Dữ
              liệu xác nhận của các bên được lưu giữ cùng hợp đồng nhằm phục vụ
              việc tra cứu, đối chiếu và giải quyết tranh chấp khi cần thiết.
            </p>
          </div>
        </section>
        <!-- =================================================
             SIGNATURE
        ================================================== -->

        <section class="signature-section">
          <div class="signature-grid">
            <!-- BÊN A -->

            <div class="signature-box">
              <h3>BÊN CHO THUÊ</h3>

              <p class="signature-role">(BÊN A)</p>

              <p class="signature-note">(Xác nhận ký, ghi rõ họ tên)</p>

              <div class="signature-space"></div>

              <label class="signature-checkbox">
                <input type="checkbox" checked disabled />

                <span>Đã ký</span>
              </label>

              <div class="signature-name">
                {{ benA.hoTen || "Bên A" }}
              </div>
            </div>

            <!-- BÊN B -->

            <div class="signature-box">
              <h3>BÊN THUÊ</h3>

              <p class="signature-role">(BÊN B)</p>

              <p class="signature-note">(Xác nhận ký, ghi rõ họ tên)</p>

              <div class="signature-space"></div>
              <label class="signature-checkbox">
                <input v-model="form.benBDaKy" type="checkbox" />

                <span>Tôi đồng ý và xác nhận đã ký</span>
              </label>
              <div class="signature-name">
                {{ form.hoTen || "........................" }}
              </div>
            </div>
          </div>

          <!-- AGREEMENT -->

          <div class="final-agreement">
            <label>
              <input v-model="form.dongYHopDong" type="checkbox" />

              <span>
                Tôi đã đọc, hiểu và đồng ý với toàn bộ nội dung của hợp đồng.
              </span>
            </label>
          </div>

          <!-- SUBMIT -->

          <div class="submit-section">
            <button
              type="button"
              class="submit-button"
              :disabled="submitting || !form.dongYHopDong"
              @click="submitContract"
            >
              <span v-if="submitting"> Đang xử lý... </span>

              <span v-else> Hoàn thành </span>
            </button>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* =========================================================
   PAGE
========================================================= */

.contract-page {
  min-height: 100vh;
  background: #f1f5f9;
  padding: 32px 16px 60px;
  box-sizing: border-box;
}

.contract-paper {
  width: min(100%, 980px);
  margin: 0 auto;
  background: #ffffff;
  padding: 56px 64px 64px;
  box-sizing: border-box;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.1);
  border-radius: 4px;
}

/* =========================================================
   HEADER
========================================================= */

.contract-header {
  text-align: center;
  margin-bottom: 38px;
}

.national-title {
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
}

.national-subtitle {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
}

.header-line {
  width: 180px;
  margin: 8px auto 28px;
  border-bottom: 1px solid #111827;
}

.contract-header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.legal-basis {
  max-width: 760px;
  margin: 18px auto 0;
  font-size: 15px;
  line-height: 1.7;
  text-align: left;
}

/* =========================================================
   LOADING / MESSAGE
========================================================= */

.loading-box {
  padding: 20px;
  margin-bottom: 24px;
  text-align: center;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 6px;
}

.message {
  padding: 14px 16px;
  margin-bottom: 24px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
}

.message-error {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.message-success {
  color: #166534;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

/* =========================================================
   SECTION
========================================================= */

.contract-section {
  margin-top: 32px;
}

.contract-section h2 {
  margin: 0 0 18px;
  font-size: 17px;
  line-height: 1.5;
  font-weight: 800;
  text-transform: uppercase;
}

.section-content {
  width: 100%;
}

.section-note {
  margin: -8px 0 18px;
  color: #64748b;
  font-size: 14px;
}

/* =========================================================
   FORM
========================================================= */

.form-row,
.form-group {
  margin-bottom: 16px;
}

.form-grid-2,
.form-grid-3 {
  display: grid;
  gap: 16px;
}

.form-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-row label,
.form-group label {
  display: block;
  margin-bottom: 7px;
  font-size: 14px;
  font-weight: 650;
  color: #1e293b;
}

.form-row label span,
.form-group label span {
  color: #dc2626;
}

input,
select {
  width: 100%;
  min-height: 42px;
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  outline: none;
  background: #ffffff;
  color: #0f172a;
  font-family: inherit;
  font-size: 14px;
  box-sizing: border-box;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

input:focus,
select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input::placeholder {
  color: #94a3b8;
}

input[readonly] {
  background: #f8fafc;
  color: #475569;
}

select:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

/* =========================================================
   MONEY
========================================================= */

.money-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.money-input input {
  flex: 1;
}

.money-input span {
  flex: 0 0 auto;
  color: #475569;
  font-size: 14px;
  white-space: nowrap;
}

/* =========================================================
   CONTRACT TEXT
========================================================= */

.agreement-intro {
  margin: 34px 0 4px;
  font-weight: 650;
  font-size: 15px;
}

.contract-text {
  font-size: 15px;
  line-height: 1.75;
  text-align: justify;
}

.contract-text p {
  margin: 0 0 12px;
}

.article-text {
  margin: 0 0 18px;
  font-size: 15px;
  line-height: 1.7;
}

.selected-location {
  margin-top: 4px;
  padding: 11px 14px;
  background: #f8fafc;
  border-left: 3px solid #94a3b8;
  font-size: 14px;
  color: #475569;
}

.info-note {
  margin-top: 12px;
  padding: 11px 14px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 5px;
  color: #92400e;
  font-size: 13px;
}

/* =========================================================
   SIGNATURE
========================================================= */

.signature-section {
  margin-top: 46px;
}

.signature-intro {
  margin-bottom: 34px;
  font-size: 14px;
  line-height: 1.7;
  text-align: justify;
}

.signature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 40px;
}

.signature-box {
  min-height: 300px;
  text-align: center;
}

.signature-box h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.signature-role {
  margin: 4px 0;
  font-size: 14px;
}

.signature-note {
  margin: 8px 0 0;
  font-size: 13px;
  font-style: italic;
  color: #64748b;
}

.signature-space {
  height: 135px;
}

.signature-name {
  min-height: 22px;
  font-weight: 700;
  font-size: 14px;
}

.signature-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  cursor: pointer;
  font-size: 14px;
}

.signature-checkbox input {
  width: 17px;
  height: 17px;
  min-height: 17px;
}

/* =========================================================
   FINAL AGREEMENT
========================================================= */

.final-agreement {
  margin-top: 30px;
  padding: 17px 18px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 6px;
}

.final-agreement label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.6;
  font-weight: 600;
}

.final-agreement input {
  width: 18px;
  height: 18px;
  min-height: 18px;
  flex: 0 0 auto;
  margin-top: 2px;
}

/* =========================================================
   SUBMIT
========================================================= */

.submit-section {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

.submit-button {
  min-width: 180px;
  min-height: 46px;
  padding: 10px 28px;
  border: 0;
  border-radius: 6px;
  background: #2563eb;
  color: #ffffff;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.submit-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.submit-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 768px) {
  .contract-page {
    padding: 0;
  }

  .contract-paper {
    width: 100%;
    padding: 30px 20px 40px;
    border-radius: 0;
    box-shadow: none;
  }

  .national-title {
    font-size: 15px;
  }

  .national-subtitle {
    font-size: 14px;
  }

  .contract-header h1 {
    font-size: 22px;
  }

  .legal-basis {
    font-size: 14px;
  }

  .form-grid-2,
  .form-grid-3,
  .signature-grid {
    grid-template-columns: 1fr;
  }

  .signature-grid {
    gap: 10px;
  }

  .signature-box {
    min-height: 270px;
  }
}

@media print {
  .contract-page {
    padding: 0;
    background: #ffffff;
  }

  .contract-paper {
    width: 100%;
    padding: 20px 30px;
    box-shadow: none;
  }

  .submit-section,
  .message,
  .loading-box {
    display: none !important;
  }

  input,
  select {
    border-color: transparent;
    background: transparent;
    box-shadow: none;
  }
}

.cccd-image-grid {
  margin-top: 18px;
}

.cccd-image-grid input[type="file"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  box-sizing: border-box;
}

.file-selected {
  margin-top: 6px;
  font-size: 13px;
  color: #475569;
  word-break: break-all;
}

.cccd-preview {
  margin-top: 12px;
  width: 100%;
  max-width: 360px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 6px;
  background: #f8f8f8;
  overflow: hidden;
}

.cccd-preview img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 220px;
  object-fit: contain;
  border-radius: 6px;
}

.file-selected {
  margin-top: 8px;
  font-size: 13px;
  color: #666;
  word-break: break-all;
}

.verification-box {
  max-width: 560px;
  margin: 40px auto;
  padding: 32px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  text-align: center;
}

.verification-box h2 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 800;
}

.verification-box p {
  margin: 8px 0;
  line-height: 1.6;
}

.verification-box strong {
  display: block;
  margin: 8px 0 18px;
  color: #2563eb;
}

.verification-note {
  color: #475569;
  font-size: 14px;
}

.verification-input {
  margin: 24px 0;
  text-align: left;
}

.verification-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 650;
}

.verification-input input {
  width: 100%;
  min-height: 48px;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 8px;
}

.verification-expire {
  margin-top: 16px;
  color: #64748b;
  font-size: 13px;
}

.verification-signing-message {
  margin: 20px 0 16px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
}

.verification-email {
  display: block;
  margin: 12px 0 20px;
  color: #2563eb;
  font-size: 16px;
  text-align: center;
}

.verification-signing-status {
  margin: 24px 0;
  text-align: center;
}

.signing-agreed,
.signing-not-agreed {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.5;
}

.signing-agreed {
  color: #15803d;
}

.signing-not-agreed {
  color: #dc2626;
}

.verification-email {
  display: block;
  margin: 12px 0 20px;
  text-align: center;
  font-size: 16px;
}

.qr-payment {
  width: 100%;
  margin-top: 20px;
  text-align: center;
}

.qr-payment-title {
  margin-bottom: 12px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

.qr-payment-image {
  display: block;
  width: 150px;
  height: 150px;
  margin: 0 auto;
  object-fit: contain;
}

.qr-payment-empty {
  width: 150px;
  min-height: 150px;
  margin: 0 auto;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-sizing: border-box;
  border: 1px dashed #ccc;
  border-radius: 8px;
  color: #777;
  font-size: 13px;
}
</style>
