<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  hoaDon: any;
  sendingEmail?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  sendEmail: [];
}>();

function formatCurrency(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("vi-VN");
}

function formatMonth(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
}

function getKyTinh() {
  const thang = props.hoaDon?.thangThanhToan;

  if (!thang) {
    return "";
  }

  const date = new Date(thang);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = date.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return `${formatDate(start)} – ${formatDate(end)}`;
}

const isPaid = () => props.hoaDon?.trangThai === "da_thanh_toan";
</script>

<template>
  <div class="hoa-don-detail-overlay" @click.self="emit('close')">
    <div class="hoa-don-detail-card">
      <!-- HEADER -->
      <div class="hoa-don-detail-header">
        <div>
          <h2>HÓA ĐƠN TIỀN PHÒNG</h2>

          <div class="hoa-don-detail-month">
            {{ formatMonth(hoaDon.thangThanhToan) }}
          </div>
        </div>

        <button
          type="button"
          class="hoa-don-detail-close"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <!-- THÔNG TIN CHUNG -->
      <div class="hoa-don-detail-info">
        <div class="hoa-don-info-item">
          <span>Nhà trọ</span>

          <strong>
            {{ hoaDon.hopDong?.giuong?.phong?.nhaTro?.tenNhaTro || "" }}

            <template v-if="hoaDon.hopDong?.giuong?.phong?.nhaTro?.diaChi">
              — {{ hoaDon.hopDong.giuong.phong.nhaTro.diaChi }}
            </template>
          </strong>
        </div>

        <div class="hoa-don-info-item">
          <span>Phòng</span>

          <strong>
            {{ hoaDon.hopDong?.giuong?.phong?.maPhong || "" }}

            <template v-if="hoaDon.hopDong?.giuong?.phong?.tangSo">
              — Tầng {{ hoaDon.hopDong.giuong.phong.tangSo }}
            </template>
          </strong>
        </div>

        <div class="hoa-don-info-item">
          <span>Khách thuê</span>

          <strong>
            {{ hoaDon.hopDong?.nguoiThue?.hoTen || "" }}
          </strong>
        </div>

        <div class="hoa-don-info-item">
          <span>Kỳ tính</span>

          <strong>
            {{ getKyTinh() }}
          </strong>
        </div>
      </div>

      <!-- CHI TIẾT -->
      <div class="hoa-don-detail-body">
        <div class="hoa-don-detail-table-header">
          <span>Khoản mục</span>
          <span>Chi tiết</span>
          <span>Thành tiền</span>
        </div>

        <div class="hoa-don-detail-row">
          <div>
            <strong>Tiền thuê phòng</strong>
          </div>

          <div>1 tháng</div>

          <div>
            {{ formatCurrency(hoaDon.tienPhong) }}
          </div>
        </div>

        <div class="hoa-don-detail-row">
          <div>
            <strong>Tiền điện</strong>

            <small v-if="hoaDon.ghiChu">
              {{ hoaDon.ghiChu }}
            </small>
          </div>

          <div>Tiền điện</div>

          <div>
            {{ formatCurrency(hoaDon.tienDien) }}
          </div>
        </div>

        <div class="hoa-don-detail-row">
          <div>
            <strong>Tiền nước</strong>
          </div>

          <div>Tiền nước</div>

          <div>
            {{ formatCurrency(hoaDon.tienNuoc) }}
          </div>
        </div>

        <div class="hoa-don-detail-row">
          <div>
            <strong>Phí dịch vụ khác</strong>
          </div>

          <div>Cố định</div>

          <div>
            {{ formatCurrency(hoaDon.tienDichVuKhac) }}
          </div>
        </div>
      </div>

      <!-- TỔNG -->
      <div class="hoa-don-detail-total">
        <strong>TỔNG CỘNG</strong>

        <strong>
          {{ formatCurrency(hoaDon.tongTien) }}
        </strong>
      </div>

      <!-- THANH TOÁN -->
      <div class="hoa-don-payment-info">
        <h3>Thông tin thanh toán</h3>

        <div>
          🏦 Trạng thái:
          <strong>
            {{ isPaid() ? "Đã thanh toán" : "Chưa thanh toán" }}
          </strong>
        </div>

        <div v-if="hoaDon.ngayNop">
          📅 Ngày thanh toán:
          <strong>
            {{ formatDate(hoaDon.ngayNop) }}
          </strong>
        </div>

        <div v-if="hoaDon.hopDong?.nguoiThue?.email">
          ✉️ Email:
          <strong>
            {{ hoaDon.hopDong.nguoiThue.email }}
          </strong>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="hoa-don-detail-actions">
        <button type="button" class="secondary" @click="emit('close')">
          Đóng
        </button>

        <button
          type="button"
          class="primary"
          :disabled="sendingEmail"
          @click="emit('sendEmail')"
        >
          {{ sendingEmail ? "Đang gửi..." : "Gửi hóa đơn qua email" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hoa-don-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(15, 23, 42, 0.45);

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 24px;
}

.hoa-don-detail-card {
  width: min(760px, 100%);
  max-height: 90vh;
  overflow-y: auto;

  background: #ffffff;
  border-radius: 16px;

  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);

  border: 1px solid #e5e7eb;
}

.hoa-don-detail-header {
  position: relative;

  padding: 20px 24px;

  text-align: center;

  background: #2345b5;
  color: white;

  border-radius: 16px 16px 0 0;
}

.hoa-don-detail-header h2 {
  margin: 0;

  font-size: 20px;
  font-weight: 800;
}

.hoa-don-detail-month {
  margin-top: 4px;
  font-size: 14px;
}

.hoa-don-detail-close {
  position: absolute;
  right: 14px;
  top: 10px;

  width: 34px;
  height: 34px;

  border: none;
  background: transparent;

  color: white;
  font-size: 28px;

  cursor: pointer;
}

.hoa-don-detail-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;

  padding: 20px 24px;

  border-bottom: 1px solid #e5e7eb;
}

.hoa-don-info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.hoa-don-info-item span {
  color: #64748b;
  font-size: 13px;
}

.hoa-don-info-item strong {
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
}

.hoa-don-detail-body {
  padding: 8px 24px;
}

.hoa-don-detail-table-header,
.hoa-don-detail-row {
  display: grid;
  grid-template-columns: 1fr 150px 150px;
  gap: 16px;
  align-items: center;
}

.hoa-don-detail-table-header {
  padding: 10px 0;

  color: #64748b;
  font-size: 13px;

  border-bottom: 1px solid #e5e7eb;
}

.hoa-don-detail-table-header span:nth-child(2),
.hoa-don-detail-row > div:nth-child(2) {
  text-align: center;
}

.hoa-don-detail-table-header span:last-child,
.hoa-don-detail-row > div:last-child {
  text-align: right;
}

.hoa-don-detail-row {
  padding: 14px 0;

  border-bottom: 1px solid #f1f5f9;

  font-size: 14px;
}

.hoa-don-detail-row small {
  display: block;
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.hoa-don-detail-total {
  display: flex;
  justify-content: space-between;

  margin: 0 24px;
  padding: 16px 0;

  border-top: 2px solid #2345b5;

  font-size: 16px;
}

.hoa-don-detail-total strong:last-child {
  color: #2345b5;
  font-size: 18px;
}

.hoa-don-payment-info {
  margin: 0 24px 20px;
  padding: 16px;

  background: #f8fafc;
  border-radius: 12px;

  color: #475569;
  font-size: 13px;

  line-height: 1.8;
}

.hoa-don-payment-info h3 {
  margin: 0 0 6px;

  color: #334155;
  font-size: 15px;
}

.hoa-don-detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  padding: 16px 24px;

  border-top: 1px solid #e5e7eb;
}

@media (max-width: 650px) {
  .hoa-don-detail-info {
    grid-template-columns: 1fr;
  }

  .hoa-don-detail-table-header,
  .hoa-don-detail-row {
    grid-template-columns: 1fr 100px 120px;
  }
}
</style>
