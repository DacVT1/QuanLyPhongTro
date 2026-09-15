<script setup lang="ts">
import { ref } from "vue";
import api from "@/services/api";
import { getImageUrl } from "@/utils/image";
type NotificationType = "success" | "error" | "warning" | "info";
const showModal = ref(false);
const loading = ref(false);
const saving = ref(false);
const qrFile = ref<File | null>(null);
const qrPreview = ref("");
const showAppNotification = ref(false);
const appNotificationType = ref<NotificationType>("success");
const appNotificationTitle = ref("");
const appNotificationMessage = ref("");

const form = ref({
  hoTen: "",
  tenHienThi: "",
  soCccd: "",
  ngayCap: "",
  noiCap: "",
  diaChiThuongTru: "",
  email: "",
  dienThoai: "",
  nganHang: "",
  soTaiKhoan: "",
  chuTaiKhoan: "",
  maQrThanhToan: "",
});

function resetForm() {
  form.value = {
    hoTen: "",
    tenHienThi: "",
    soCccd: "",
    ngayCap: "",
    noiCap: "",
    diaChiThuongTru: "",
    email: "",
    dienThoai: "",
    nganHang: "",
    soTaiKhoan: "",
    chuTaiKhoan: "",
    maQrThanhToan: "",
  };

  qrFile.value = null;
  qrPreview.value = "";
}

async function openAccount() {
  showModal.value = true;
  loading.value = true;

  try {
    const response = await api.get("/tai-khoan/me");

    form.value = {
      hoTen: response.data.hoTen ?? "",
      tenHienThi: response.data.tenHienThi ?? "",
      soCccd: response.data.soCccd ?? "",
      ngayCap: response.data.ngayCap
        ? String(response.data.ngayCap).substring(0, 10)
        : "",
      noiCap: response.data.noiCap ?? "",
      diaChiThuongTru: response.data.diaChiThuongTru ?? "",
      email: response.data.email ?? "",
      dienThoai: response.data.dienThoai ?? "",
      nganHang: response.data.nganHang ?? "",
      soTaiKhoan: response.data.soTaiKhoan ?? "",
      chuTaiKhoan: response.data.chuTaiKhoan ?? "",
      maQrThanhToan: response.data.maQrThanhToan ?? "",
    };

    if (form.value.maQrThanhToan) {
      qrPreview.value = getImageUrl(form.value.maQrThanhToan);
    }
  } catch (error) {
    console.error("Không thể tải thông tin tài khoản:", error);
  } finally {
    loading.value = false;
  }
}

function closeAccount() {
  showModal.value = false;
}

function getDefaultNotificationTitle(type: NotificationType) {
  switch (type) {
    case "error":
      return "Có lỗi xảy ra";

    case "warning":
      return "Cảnh báo";

    case "info":
      return "Thông báo";

    case "success":
    default:
      return "Thành công";
  }
}

function showNotification(
  message: string,
  type: NotificationType = "success",
  title?: string,
) {
  appNotificationType.value = type;
  appNotificationTitle.value = title ?? getDefaultNotificationTitle(type);
  appNotificationMessage.value = message;
  showAppNotification.value = true;

  setTimeout(() => {
    showAppNotification.value = false;
  }, 1000);
}

function handleQrChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  qrFile.value = file;
  qrPreview.value = URL.createObjectURL(file);
}

async function saveAccount() {
  saving.value = true;

  try {
    const formData = new FormData();

    formData.append("hoTen", form.value.hoTen);
    formData.append("tenHienThi", form.value.tenHienThi);
    formData.append("soCccd", form.value.soCccd);
    formData.append("ngayCap", form.value.ngayCap);
    formData.append("noiCap", form.value.noiCap);
    formData.append("diaChiThuongTru", form.value.diaChiThuongTru);
    formData.append("email", form.value.email);
    formData.append("dienThoai", form.value.dienThoai);
    formData.append("nganHang", form.value.nganHang);
    formData.append("soTaiKhoan", form.value.soTaiKhoan);
    formData.append("chuTaiKhoan", form.value.chuTaiKhoan);

    if (qrFile.value) {
      formData.append("maQrThanhToan", qrFile.value);
    }

    const response = await api.patch("/tai-khoan/me", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

    const updatedUser = {
      ...currentUser,
      ...response.data,
    };

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    window.dispatchEvent(
      new CustomEvent("account:updated", {
        detail: response.data,
      }),
    );

    form.value.maQrThanhToan = response.data.maQrThanhToan ?? "";

    if (form.value.maQrThanhToan) {
      qrPreview.value = getImageUrl(form.value.maQrThanhToan);
    }

    qrFile.value = null;

    showNotification("Đã lưu thông tin tài khoản.");
  } catch (error) {
    console.error("Không thể lưu thông tin tài khoản:", error);

    showNotification("Không thể lưu thông tin tài khoản.");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <button type="button" class="account-button" @click="openAccount">
    Tài khoản
  </button>

  <div v-if="showModal" class="account-overlay" @click.self="closeAccount">
    <div class="account-modal">
      <div class="account-header">
        <h2>Chi tiết tài khoản</h2>

        <button type="button" class="account-close" @click="closeAccount">
          ×
        </button>
      </div>

      <div v-if="loading" class="account-loading">
        Đang tải thông tin tài khoản...
      </div>

      <form v-else class="account-form" @submit.prevent="saveAccount">
        <div class="account-grid">
          <div class="account-field">
            <label>Họ và tên</label>
            <input v-model="form.hoTen" type="text" required />
          </div>

          <div class="account-field">
            <label>Tên hiển thị</label>
            <input v-model="form.tenHienThi" type="text" required />
          </div>

          <div class="account-field">
            <label>Số CCCD</label>
            <input v-model="form.soCccd" type="text" />
          </div>

          <div class="account-field">
            <label>Ngày cấp</label>
            <input v-model="form.ngayCap" type="date" />
          </div>

          <div class="account-field">
            <label>Nơi cấp</label>
            <input v-model="form.noiCap" type="text" />
          </div>

          <div class="account-field account-field-full">
            <label>Địa chỉ thường trú</label>
            <input v-model="form.diaChiThuongTru" type="text" />
          </div>

          <div class="account-field">
            <label>Gmail</label>
            <input v-model="form.email" type="email" />
          </div>

          <div class="account-field">
            <label>Điện thoại</label>
            <input v-model="form.dienThoai" type="tel" />
          </div>

          <div class="account-field">
            <label>Ngân hàng</label>
            <input v-model="form.nganHang" type="text" />
          </div>

          <div class="account-field">
            <label>Số tài khoản</label>
            <input v-model="form.soTaiKhoan" type="text" />
          </div>

          <div class="account-field">
            <label>Chủ tài khoản</label>
            <input v-model="form.chuTaiKhoan" type="text" />
          </div>

          <div class="account-field">
            <label>Mã QR thanh toán</label>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              @change="handleQrChange"
            />

            <img
              v-if="qrPreview"
              :src="qrPreview"
              class="qr-preview"
              alt="Mã QR thanh toán"
            />
          </div>
        </div>

        <div class="account-actions">
          <button
            type="button"
            class="account-exit"
            :disabled="saving"
            @click="closeAccount"
          >
            Thoát
          </button>

          <button type="submit" class="account-save" :disabled="saving">
            {{ saving ? "Đang lưu..." : "Lưu" }}
          </button>
        </div>
      </form>
    </div>
  </div>
  <div
    v-if="showAppNotification"
    class="account-notification"
    :class="`account-notification-${appNotificationType}`"
  >
    <div class="account-notification-icon">
      {{ appNotificationType === "success" ? "✓" : "!" }}
    </div>

    <div class="account-notification-content">
      <div class="account-notification-title">
        {{ appNotificationTitle }}
      </div>

      <div class="account-notification-message">
        {{ appNotificationMessage }}
      </div>
    </div>

    <button
      type="button"
      class="account-notification-close"
      @click="showAppNotification = false"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.account-button {
  height: 38px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  white-space: nowrap;
  box-sizing: border-box;
  margin: 0;
}

.account-button:hover {
  background: #f3f4f6;
}

.account-button:active {
  background: #e5e7eb;
}

.account-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.55);
}

.account-modal {
  width: min(900px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.account-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.account-header h2 {
  margin: 0;
}

.account-close {
  border: 0;
  background: transparent;
  font-size: 28px;
  cursor: pointer;
}

.account-form {
  padding: 24px;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.account-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.account-field-full {
  grid-column: 1 / -1;
}

.account-field label {
  font-weight: 600;
}

.account-field input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

.qr-preview {
  width: 180px;
  height: 180px;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-top: 8px;
}

.account-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.account-save {
  border: 0;
  border-radius: 8px;
  padding: 10px 24px;
  cursor: pointer;
  background: #16a34a;
  color: white;
  font-weight: 700;
}

.account-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.account-loading {
  padding: 40px;
  text-align: center;
}

@media (max-width: 700px) {
  .account-grid {
    grid-template-columns: 1fr;
  }

  .account-field-full {
    grid-column: auto;
  }
}

.account-notification {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  min-width: 340px;
  max-width: 450px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 10px;
  background: white;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.18);
  border-left: 4px solid #16a34a;
}

.account-notification-success {
  border-left-color: #16a34a;
}

.account-notification-error {
  border-left-color: #dc2626;
}

.account-notification-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #16a34a;
  color: white;
  font-weight: 700;
}

.account-notification-error .account-notification-icon {
  background: #dc2626;
}

.account-notification-content {
  flex: 1;
}

.account-notification-title {
  font-weight: 700;
  margin-bottom: 4px;
}

.account-notification-message {
  font-size: 14px;
  color: #4b5563;
}

.account-notification-close {
  border: 0;
  background: transparent;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.account-notification-close:hover {
  color: #111827;
}

@media (max-width: 600px) {
  .account-notification {
    top: 16px;
    right: 16px;
    left: 16px;
    min-width: auto;
  }
}

.account-exit {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 24px;
  cursor: pointer;
  background: rgb(199, 15, 15);
  color: hsl(216, 50%, 96%);
  font-weight: 600;
}

.account-exit:hover {
  background: #f3f4f6;
}

.account-exit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
