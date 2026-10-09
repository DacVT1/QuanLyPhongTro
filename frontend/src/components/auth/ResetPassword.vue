<script setup lang="ts">
import { ref } from "vue";
import api from "../../services/api";

const props = defineProps<{
  email: string;
  otp: string;
}>();

const newPassword = ref("");
const confirmPassword = ref("");

const errorMessage = ref("");
const loading = ref(false);

const emit = defineEmits<{
  success: [];
  back: [];
}>();

async function resetPassword() {
  errorMessage.value = "";

  if (!newPassword.value) {
    errorMessage.value = "Vui lòng nhập mật khẩu mới";
    return;
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = "Mật khẩu phải có ít nhất 6 ký tự";
    return;
  }

  if (!confirmPassword.value) {
    errorMessage.value = "Vui lòng nhập lại mật khẩu";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = "Mật khẩu nhập lại không khớp";
    return;
  }

  try {
    loading.value = true;

    await api.post("/auth/reset-password", {
      email: props.email,
      otp: props.otp,
      newPassword: newPassword.value,
    });

    alert("Đổi mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.");

    emit("success");
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || "Không thể đổi mật khẩu";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>Đặt lại mật khẩu</h2>

      <p class="auth-description">Tạo mật khẩu mới cho tài khoản:</p>

      <p class="email">
        {{ props.email }}
      </p>

      <div v-if="errorMessage" class="auth-error">
        {{ errorMessage }}
      </div>

      <div class="form-group">
        <label>Mật khẩu mới *</label>

        <input
          v-model="newPassword"
          type="password"
          autocomplete="new-password"
          placeholder="Nhập mật khẩu mới"
        />
      </div>

      <div class="form-group">
        <label>Nhập lại mật khẩu *</label>

        <input
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          placeholder="Nhập lại mật khẩu"
          @keyup.enter="resetPassword"
        />
      </div>

      <button class="auth-button" :disabled="loading" @click="resetPassword">
        {{ loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu" }}
      </button>

      <div class="auth-register">
        <button type="button" @click="emit('back')">Quay lại</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  width: 100%;
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #f1f5f9;

  box-sizing: border-box;
  padding: 16px;
}

.auth-card {
  width: 380px;
  max-width: 100%;

  padding: 30px;

  background: white;
  border-radius: 14px;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  box-sizing: border-box;
}

.auth-card h2 {
  margin-bottom: 18px;

  text-align: center;
}

.auth-description {
  margin-bottom: 6px;

  text-align: center;

  color: #64748b;
}

.email {
  margin-bottom: 20px;

  text-align: center;

  font-weight: 700;

  word-break: break-word;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;

  margin-bottom: 6px;

  font-weight: 600;
}

.form-group input {
  width: 100%;

  box-sizing: border-box;

  padding: 11px 12px;

  border: 1px solid #cbd5e1;
  border-radius: 8px;

  outline: none;
}

.auth-button {
  width: 100%;

  padding: 12px;

  border: none;
  border-radius: 8px;

  cursor: pointer;

  font-weight: 600;
}

.auth-button:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

.auth-error {
  margin-bottom: 15px;

  padding: 10px;

  border-radius: 8px;

  background: #fee2e2;
  color: #b91c1c;
}

.auth-register {
  margin-top: 18px;

  text-align: center;
}

.auth-register button {
  border: none;

  background: none;

  cursor: pointer;

  font-weight: 600;
}

@media (max-width: 600px) {
  .auth-card {
    width: 100%;
    padding: 24px 16px;
  }
}
</style>
