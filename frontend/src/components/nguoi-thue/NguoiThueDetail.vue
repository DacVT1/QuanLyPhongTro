<script setup lang="ts">
import { getImageUrl } from "../../utils/image";

interface NguoiThue {
  id: string;
  hoTen?: string;
  cccd?: string;
  sdt?: string;
  email?: string;
  diaChi?: string;
  ngaySinh?: string;
  bienSoXe?: string;
  cccdMatTruoc?: string | null;
  cccdMatSau?: string | null;
}

const props = defineProps<{
  nguoiThue: NguoiThue;
}>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

function formatDate(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <h3>Chi tiết người thuê</h3>
    </div>

    <div class="form-grid">
      <label>
        Họ tên

        <input
          :value="props.nguoiThue.hoTen || ''"
          readonly
        />
      </label>

      <label>
        CCCD

        <input
          :value="props.nguoiThue.cccd || ''"
          readonly
        />
      </label>

      <label>
        Số điện thoại

        <input
          :value="props.nguoiThue.sdt || ''"
          readonly
        />
      </label>

      <label>
        Email

        <input
          :value="props.nguoiThue.email || ''"
          readonly
        />
      </label>

      <label>
        Ngày sinh

        <input
          :value="formatDate(props.nguoiThue.ngaySinh)"
          readonly
        />
      </label>

      <label>
        Biển số xe

        <input
          :value="props.nguoiThue.bienSoXe || ''"
          readonly
        />
      </label>

      <label class="full-width">
        Địa chỉ

        <textarea
          :value="props.nguoiThue.diaChi || ''"
          rows="3"
          readonly
        ></textarea>
      </label>

      <!-- CCCD MẶT TRƯỚC -->
      <div class="full-width cccd-detail">
        <h4>CCCD mặt trước</h4>

        <div
          v-if="props.nguoiThue.cccdMatTruoc"
          class="cccd-image-wrapper"
        >
          <img
            :src="getImageUrl(props.nguoiThue.cccdMatTruoc)"
            alt="CCCD mặt trước"
            class="cccd-detail-image"
          />
        </div>

        <div
          v-else
          class="cccd-empty"
        >
          Chưa có ảnh CCCD mặt trước
        </div>
      </div>

      <!-- CCCD MẶT SAU -->
      <div class="full-width cccd-detail">
        <h4>CCCD mặt sau</h4>

        <div
          v-if="props.nguoiThue.cccdMatSau"
          class="cccd-image-wrapper"
        >
          <img
            :src="getImageUrl(props.nguoiThue.cccdMatSau)"
            alt="CCCD mặt sau"
            class="cccd-detail-image"
          />
        </div>

        <div
          v-else
          class="cccd-empty"
        >
          Chưa có ảnh CCCD mặt sau
        </div>
      </div>
    </div>

    <div class="actions">
      <button
        type="button"
        class="secondary"
        @click="emit('close')"
      >
        Quay lại danh sách
      </button>
    </div>
  </div>
</template>

<style scoped>

/* =========================================================
   CHI TIẾT NGƯỜI THUÊ
   ========================================================= */

.panel {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

/* =========================================================
   HEADER
   ========================================================= */

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 16px;

  margin-bottom: 24px;
  padding-bottom: 16px;

  border-bottom: 1px solid #e2e8f0;
}

.panel-header h3 {
  margin: 0;

  color: #0f172a;

  font-size: 1.35rem;
  font-weight: 700;
}

/* =========================================================
   GRID THÔNG TIN
   ========================================================= */

.form-grid {
  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 18px 24px;

  width: 100%;
  min-width: 0;

  box-sizing: border-box;
}

/* Mỗi trường */
.form-grid > label {
  display: flex;
  flex-direction: column;

  min-width: 0;

  gap: 7px;

  color: #334155;

  font-size: 0.88rem;
  font-weight: 600;
}

/* Trường full width */
.form-grid .full-width {
  grid-column: 1 / -1;
}

/* =========================================================
   INPUT / TEXTAREA - CHỈ XEM
   ========================================================= */

.form-grid input,
.form-grid textarea {
  width: 100%;
  min-width: 0;

  box-sizing: border-box;

  padding: 11px 13px;

  border: 1px solid #cbd5e1;
  border-radius: 9px;

  background: #f8fafc;

  color: #0f172a;

  font-family: inherit;
  font-size: 0.92rem;

  outline: none;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

/* Input */
.form-grid input {
  height: 44px;
}

/* Textarea */
.form-grid textarea {
  min-height: 90px;

  line-height: 1.5;

  resize: none;
}

/* Readonly */
.form-grid input[readonly],
.form-grid textarea[readonly] {
  cursor: default;

  background: #f8fafc;

  color: #1e293b;
}

/* Không cho cảm giác input có thể sửa */
.form-grid input[readonly]:focus,
.form-grid textarea[readonly]:focus {
  border-color: #cbd5e1;

  box-shadow: none;

  outline: none;
}

/* =========================================================
   CCCD
   ========================================================= */

.cccd-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-top: 4px;
}

.cccd-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.05);
}

.cccd-image-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 210px;

  padding: 8px;
  box-sizing: border-box;

  border: 1px solid #dbe3ee;
  border-radius: 9px;

  background: #f8fafc;
  overflow: hidden;
}

.cccd-detail-image {
  display: block;
  max-width: 100%;
  max-height: 190px;
  width: auto;
  object-fit: contain;
  border-radius: 6px;
}

/* Khung ảnh CCCD nhỏ gọn */
.cccd-image-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;

  width: fit-content;
  max-width: 100%;
  min-height: 0;

  box-sizing: border-box;

  padding: 8px;

  border: 1px solid #dbe3ee;
  border-radius: 10px;

  background: #f8fafc;

  overflow: hidden;
}

/* Ảnh CCCD */
.cccd-detail-image {
  display: block;

  width: auto;
  max-width: 360px;
  max-height: 220px;

  object-fit: contain;

  border-radius: 6px;

  box-shadow:
    0 2px 8px rgba(15, 23, 42, 0.12);
}
/* Không có ảnh */
.cccd-empty {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 100%;
  min-height: 220px;

  box-sizing: border-box;

  padding: 30px;

  border: 1px dashed #cbd5e1;
  border-radius: 12px;

  background: #f8fafc;

  color: #64748b;

  font-size: 0.9rem;

  text-align: center;
}

/* =========================================================
   BUTTON
   ========================================================= */

.panel-header .secondary,
.actions .secondary {
  min-height: 40px;

  padding: 9px 16px;

  border: 1px solid #cbd5e1;
  border-radius: 8px;

  background: #f8fafc;

  color: #334155;

  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;
}

.panel-header .secondary:hover,
.actions .secondary:hover {
  background: #e2e8f0;

  border-color: #94a3b8;

  transform: translateY(-1px);
}

/* =========================================================
   FOOTER ACTION
   ========================================================= */

.actions {
  display: flex;

  align-items: center;
  justify-content: flex-end;

  gap: 10px;

  margin-top: 28px;
  padding-top: 18px;

  border-top: 1px solid #e2e8f0;
}

/* =========================================================
   RESPONSIVE
   ========================================================= */

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-grid .full-width {
    grid-column: 1;
  }
}

@media (max-width: 600px) {
  .cccd-section {
    grid-template-columns: 1fr;
  }

  .cccd-image-wrapper {
    height: 180px;
  }

  .cccd-detail-image {
    max-height: 165px;
  }

  .actions {
    justify-content: stretch;
  }

  .actions .secondary {
    width: 100%;
  }
}
</style>