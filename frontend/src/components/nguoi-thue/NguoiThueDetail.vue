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

      <button
        type="button"
        class="secondary"
        @click="emit('close')"
      >
        Quay lại
      </button>
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
.cccd-detail {
  margin-top: 20px;
}

.cccd-detail h4 {
  margin-bottom: 12px;
}

.cccd-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
}

.cccd-detail-image {
  display: block;
  width: 100%;
  max-width: 720px;
  max-height: 500px;
  object-fit: contain;
  border-radius: 8px;
}

.cccd-empty {
  padding: 30px;
  text-align: center;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  color: #6b7280;
}
</style>