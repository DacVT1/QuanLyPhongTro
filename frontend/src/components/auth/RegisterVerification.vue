<script setup lang="ts">
import { ref } from "vue";
import api from "../../services/api";

const props = defineProps<{
  identifier: string;
}>();

const otp = ref("");
const errorMessage = ref("");
const loading = ref(false);

const emit = defineEmits<{
  verified: [];
  back: [];
}>();

async function verifyOtp() {
  errorMessage.value = "";

  if (!otp.value) {
    errorMessage.value = "Vui lòng nhập mã xác thực";
    return;
  }

  if (!/^\d{6}$/.test(otp.value)) {
    errorMessage.value = "Mã xác thực phải gồm 6 chữ số";
    return;
  }

  try {
    loading.value = true;

    await api.post("/auth/verify-register", {
      identifier: props.identifier,
      otp: otp.value,
    });

    alert("Xác thực đăng ký thành công. Vui lòng đăng nhập.");

    emit("verified");
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || "Mã xác thực không đúng";
  } finally {
    loading.value = false;
  }
}

function handleOtpInput(event: Event) {
  const input = event.target as HTMLInputElement;

  input.value = input.value.replace(/\D/g, "").slice(0, 6);

  otp.value = input.value;
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>Xác thực đăng ký</h2>

      <p class="auth-description">Mã xác thực gồm 6 chữ số đã được gửi đến:</p>

      <p class="identifier">
        {{ props.identifier }}
      </p>

      <div v-if="errorMessage" class="auth-error">
        {{ errorMessage }}
      </div>

      <div class="form-group">
        <label>Mã xác thực *</label>

        <input
          :value="otp"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          placeholder="Nhập mã 6 chữ số"
          @input="handleOtpInput"
          @keyup.enter="verifyOtp"
        />
      </div>

      <button class="auth-button" :disabled="loading" @click="verifyOtp">
        {{ loading ? "Đang xác thực..." : "Xác nhận" }}
      </button>

      <div class="auth-register">
        <button type="button" @click="emit('back')">Quay lại đăng ký</button>
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
  margin-bottom: 8px;
  text-align: center;
  color: #64748b;
}

.identifier {
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

  text-align: center;
  font-size: 20px;
  letter-spacing: 4px;
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

  background: #fee2e2;
  color: #b91c1c;

  border-radius: 8px;
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
</style>
