<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  email: string;
}>();

const otp = ref("");
const errorMessage = ref("");

const emit = defineEmits<{
  verified: [otp: string];
  back: [];
}>();

function handleOtpInput(event: Event) {
  const input = event.target as HTMLInputElement;

  input.value = input.value.replace(/\D/g, "").slice(0, 6);

  otp.value = input.value;
}

function verifyOtp() {
  errorMessage.value = "";

  if (!otp.value) {
    errorMessage.value = "Vui lòng nhập mã xác thực";
    return;
  }

  if (!/^\d{6}$/.test(otp.value)) {
    errorMessage.value = "Mã xác thực phải gồm 6 chữ số";
    return;
  }

  /*
   * Chưa đổi mật khẩu ở bước này.
   *
   * OTP sẽ được kiểm tra thực tế
   * tại API reset-password.
   */
  emit("verified", otp.value);
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>Xác nhận mã</h2>

      <p class="auth-description">Mã xác thực 6 chữ số đã được gửi đến:</p>

      <p class="email">
        {{ props.email }}
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

      <button class="auth-button" @click="verifyOtp">Xác nhận</button>

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

  padding: 16px;

  box-sizing: border-box;
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
