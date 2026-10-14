<script setup lang="ts">
import { ref } from "vue";
import api from "../services/api";

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

async function exportData() {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const response = await api.get("/data-transfer/export", {
      responseType: "blob",
    });

    const url = URL.createObjectURL(response.data);

    const link = document.createElement("a");

    link.href = url;
    link.download = `quan-ly-nha-tro-${new Date()
      .toISOString()
      .slice(0, 10)}.zip`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    successMessage.value = "Đã tạo yêu cầu xuất dữ liệu.";
  } catch (error) {
    console.error("Lỗi xuất dữ liệu:", error);

    errorMessage.value = "Không thể xuất dữ liệu. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
}

async function importData() {
  // Sẽ nối với API nhập ZIP ở bước 8.
}
</script>

<template>
  <div class="transfer-page">
    <div class="transfer-card">
      <h2>Nhập/Xuất dữ liệu</h2>
      <p>
        Sao lưu dữ liệu nhà trọ và hình ảnh, hoặc khôi phục từ file sao lưu.
      </p>

      <div class="transfer-actions">
        <button
          type="button"
          class="primary transfer-button"
          :disabled="loading"
          @click="importData"
        >
          Nhập dữ liệu
        </button>

        <button
          type="button"
          class="primary transfer-button"
          :disabled="loading"
          @click="exportData"
        >
          Xuất dữ liệu
        </button>
      </div>

      <p v-if="loading">Đang xử lý, vui lòng chờ...</p>
      <p v-if="errorMessage" class="transfer-error">
        {{ errorMessage }}
      </p>
      <p v-if="successMessage" class="transfer-success">
        {{ successMessage }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.transfer-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.transfer-card {
  width: 100%;
  max-width: 720px;
  text-align: center;
  padding: 36px 24px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 4px 18px rgb(0 0 0 / 6%);
}

.transfer-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 28px;
}

.transfer-button {
  min-width: 180px;
  min-height: 48px;
}

.transfer-error {
  color: #dc2626;
  margin-top: 20px;
}

.transfer-success {
  color: #15803d;
  margin-top: 20px;
}
</style>
