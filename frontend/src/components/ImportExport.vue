<script setup lang="ts">
import { ref } from "vue";
import api from "../services/api";
const importInput = ref<HTMLInputElement | null>(null);
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
      timeout: 120000,
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

    // Không thu hồi URL ngay lập tức khi trình duyệt
    // còn đang xử lý tải file.
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    successMessage.value = "Đã yêu cầu tải file sao lưu.";
  } catch (error) {
    console.error("Lỗi xuất dữ liệu:", error);

    errorMessage.value = "Không thể xuất dữ liệu. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
}

function importData() {
  errorMessage.value = "";
  successMessage.value = "";
  importInput.value?.click();
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  try {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      errorMessage.value = "Vui lòng chọn file ZIP sao lưu.";
      return;
    }

    const confirmed = window.confirm(
      "Nhập dữ liệu có thể thay thế dữ liệu hiện tại. " +
        "Bạn đã sao lưu dữ liệu hiện tại và muốn tiếp tục chứ?",
    );

    if (!confirmed) return;

    loading.value = true;
    errorMessage.value = "";
    successMessage.value = "";

    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/data-transfer/import", formData, {
      timeout: 0,
    });

    const result = response.data;

    successMessage.value =
      `${result?.message ?? "Đã xử lý nhập dữ liệu."} ` +
      "Vui lòng tải lại trang để cập nhật giao diện.";
  } catch (error: any) {
    console.error("Lỗi nhập dữ liệu:", error);

    errorMessage.value =
      error?.response?.data?.message ||
      "Không thể nhập dữ liệu. Vui lòng kiểm tra file sao lưu.";
  } finally {
    loading.value = false;
    input.value = "";
  }
}
</script>

<template>
  <input
    ref="importInput"
    type="file"
    accept=".zip,application/zip"
    hidden
    @change="handleImportFile"
  />
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
