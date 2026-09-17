<script setup lang="ts">
import { ref } from "vue";
import api from "../../services/api";

const email = ref("");
const errorMessage = ref("");
const loading = ref(false);

const emit = defineEmits<{
  otpSent: [email: string];
  back: [];
}>();

async function sendOtp() {
  errorMessage.value = "";

  const value = email.value.trim().toLowerCase();

  if (!value) {
    errorMessage.value = "Vui lòng nhập email";
    return;
  }

  try {
    loading.value = true;

    await api.post("/auth/forgot-password", {
      email: value,
    });

    emit("otpSent", value);
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || "Không thể gửi mã xác thực";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>Lấy lại mật khẩu</h2>

      <p class="auth-description">
        Nhập email tài khoản của bạn. Mã xác thực sẽ được gửi về email.
      </p>

      <div v-if="errorMessage" class="auth-error">
        {{ errorMessage }}
      </div>

      <div class="form-group">
        <label>Email *</label>

        <input
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="Nhập email"
          @keyup.enter="sendOtp"
        />
      </div>

      <button class="auth-button" :disabled="loading" @click="sendOtp">
        {{ loading ? "Đang gửi mã..." : "Gửi mã xác nhận" }}
      </button>

      <div class="auth-register">
        <button type="button" @click="emit('back')">Quay lại đăng nhập</button>
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
  margin-bottom: 20px;

  text-align: center;

  color: #64748b;

  line-height: 1.5;
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
