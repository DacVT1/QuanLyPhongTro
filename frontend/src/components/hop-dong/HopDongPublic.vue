```vue
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import api from "../../services/api";

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
const benA = ref<BenA>({
  hoTen: "Nguyễn Thị Chi",
  cccd: "0909889908098",
  ngayCap: "12/13/2026",
  noiCap: "Bộ công an ",
  sdt: "098989898",
  nganHang: "Viettin bank",
  soTaiKhoan: "09453242344",
  chuTaiKhoan: "Nguyễn Thị Chi",
  diaChi: "Cầu Giấy ",
});

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

  const numberValue = Number(String(value).replace(/[^\d]/g, ""));

  if (Number.isNaN(numberValue)) {
    return "";
  }

  return numberValue.toLocaleString("en-US");
}

function handleTienDatCocInput(event: Event) {
  const input = event.target as HTMLInputElement;

  const rawValue = input.value.replace(/\D/g, "");

  form.value.tienDatCoc = Number(rawValue || 0);

  tienDatCocDisplay.value = rawValue
    ? Number(rawValue).toLocaleString("en-US")
    : "";
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

  if (form.value.tienDatCoc < 0) {
    errorMessage.value = "Tiền đặt cọc không hợp lệ.";
    return false;
  }

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

    nhaTros.value = data?.nhaTros ?? [];

    phongs.value = data?.phongs ?? [];

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
    const response = await api.post("/public/hop-dong/submit", formData);

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
      <!-- =================================================
           HEADER
      ================================================== -->

      <header class="contract-header">
        <div class="national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>

        <div class="national-subtitle">Độc lập - Tự do - Hạnh phúc</div>

        <div class="header-line"></div>

        <h1>HỢP ĐỒNG THUÊ TRỌ</h1>

        <p class="legal-basis">
          Căn cứ Bộ luật Dân sự 2015 và Luật Nhà ở 2023, hai bên tự nguyện thỏa
          thuận các điều khoản của hợp đồng như sau:
        </p>
      </header>

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

      <template v-if="!loading">
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

            <div class="form-row">
              <label>Địa chỉ thường trú</label>

              <input type="text" :value="benA.diaChi" readonly />
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
                    v-for="(item, index) in phongOptions"
                    :key="item.id"
                    :value="item.id"
                  >
                    Phòng {{ index + 1 }}
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
                <label>Giá thuê <span>*</span></label>

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
                <label> Tiền đặt cọc </label>

                <div class="money-input">
                  <input
                    :value="tienDatCocDisplay"
                    type="text"
                    inputmode="numeric"
                    placeholder="Nhập tiền đặt cọc"
                    @input="handleTienDatCocInput"
                  />

                  <span>đồng</span>
                </div>
              </div>
            </div>

            <div class="contract-text">
              <p>
                Giá thuê đã bao gồm tất cả các dịch vụ đi kèm theo thỏa thuận
                của hai bên.
              </p>

              <p>
                Bên B thanh toán tiền thuê vào ngày mùng 1 hằng tháng bằng hình
                thức chuyển khoản.
              </p>

              <p v-if="tienThue">
                Số tiền thuê:
                <strong> {{ tienThueDisplay }} đồng/tháng </strong>
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
              Thời hạn thuê tối thiểu là 03 tháng. Hai bên thống nhất thời gian
              thuê như sau:
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
        </section>

        <!-- =================================================
             ĐIỀU 4
        ================================================== -->

        <section class="contract-section article-section">
          <h2>ĐIỀU 4. QUYỀN VÀ NGHĨA VỤ CỦA HAI BÊN</h2>

          <div class="contract-text">
            <p>
              <strong>4.1. Bên A:</strong>
              Giao nhà đúng hiện trạng và đúng thời gian đã thỏa thuận; đảm bảo
              cho Bên B được sử dụng ổn định trong thời hạn thuê; thực hiện sửa
              chữa các hư hỏng không do lỗi của Bên B.
            </p>

            <p>
              <strong>4.2. Bên B:</strong>
              Thanh toán tiền thuê và các khoản chi phí đúng thời hạn; sử dụng
              nhà đúng mục đích; giữ gìn tài sản; không tự ý sửa chữa, cải tạo
              hoặc cho thuê lại khi chưa được Bên A đồng ý.
            </p>

            <p>
              Bên B có trách nhiệm tuân thủ các quy định của nhà trọ, quy định
              về phòng cháy chữa cháy và đăng ký tạm trú theo quy định.
            </p>

            <p>
              Khi chấm dứt hợp đồng, Bên B có trách nhiệm bàn giao lại phòng và
              tài sản theo đúng hiện trạng ban đầu, ngoại trừ hao mòn tự nhiên.
            </p>
          </div>
        </section>

        <!-- =================================================
             ĐIỀU 5
        ================================================== -->

        <section class="contract-section article-section">
          <h2>ĐIỀU 5. CHẤM DỨT HỢP ĐỒNG</h2>

          <div class="contract-text">
            <p>
              Hợp đồng chấm dứt khi hết thời hạn thuê hoặc theo thỏa thuận của
              hai bên.
            </p>

            <p>
              Thời hạn thuê tối thiểu là 03 tháng. Trường hợp một bên muốn chấm
              dứt hợp đồng trước thời hạn phải thông báo cho bên còn lại trước
              ít nhất 30 ngày.
            </p>

            <p>
              Bên vi phạm nghĩa vụ dẫn đến việc chấm dứt hợp đồng phải chịu
              trách nhiệm bồi thường theo thỏa thuận giữa hai bên.
            </p>

            <p>
              Tiền đặt cọc được hoàn trả hoặc khấu trừ các khoản nghĩa vụ còn
              thiếu, hư hỏng tài sản hoặc các khoản chi phí khác theo thỏa
              thuận.
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
              Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận trong
              hợp đồng.
            </p>

            <p>
              Mọi tranh chấp phát sinh trong quá trình thực hiện hợp đồng trước
              hết sẽ được hai bên ưu tiên giải quyết bằng thương lượng.
            </p>

            <p>
              Trường hợp thương lượng không thành công, tranh chấp sẽ được giải
              quyết tại Tòa án nhân dân có thẩm quyền.
            </p>
          </div>
        </section>

        <!-- =================================================
             SIGNATURE
        ================================================== -->

        <section class="signature-section">
          <p class="signature-intro">
            Nội dung bên trên sẽ được coi như một bản hợp đồng giữa hai bên. Bên
            A mặc định đã ký. Nếu Bên B đồng ý ký hợp đồng, vui lòng tích vào ô
            xác nhận tương ứng.
          </p>

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

                <span>Tôi xác nhận đã ký</span>
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
</style>
