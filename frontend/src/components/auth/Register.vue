<script setup lang="ts">
import { ref } from 'vue'
import api from '../../services/api'

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const tenHienThi = ref('')
const email = ref('')

const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(false)

const emit = defineEmits<{
  login: []
}>()

async function register() {
  errorMessage.value = ''
  successMessage.value = ''

  if (
    !username.value ||
    !password.value ||
    !tenHienThi.value
  ) {
    errorMessage.value =
      'Vui lòng nhập đầy đủ thông tin bắt buộc'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value =
      'Mật khẩu nhập lại không khớp'
    return
  }

  try {
    loading.value = true

    await api.post(
      '/auth/register',
      {
        username: username.value,
        password: password.value,
        tenHienThi: tenHienThi.value,
        email: email.value || undefined,
      },
    )

    successMessage.value =
      'Đăng ký thành công. Vui lòng đăng nhập.'

    setTimeout(() => {
      emit('login')
    }, 1000)
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message ||
      'Đăng ký thất bại'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>Đăng ký tài khoản</h2>

      <div
        v-if="errorMessage"
        class="auth-error"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="successMessage"
        class="auth-success"
      >
        {{ successMessage }}
      </div>

      <div class="form-group">
        <label>Tên hiển thị *</label>

        <input
          v-model="tenHienThi"
          type="text"
          placeholder="Nhập tên hiển thị"
        />
      </div>

      <div class="form-group">
        <label>Tên đăng nhập *</label>

        <input
          v-model="username"
          type="text"
          autocomplete="username"
          placeholder="Nhập tên đăng nhập"
        />
      </div>

      <div class="form-group">
        <label>Email</label>

        <input
          v-model="email"
          type="email"
          placeholder="Nhập email"
        />
      </div>

      <div class="form-group">
        <label>Mật khẩu *</label>

        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          placeholder="Nhập mật khẩu"
        />
      </div>

      <div class="form-group">
        <label>Nhập lại mật khẩu *</label>

        <input
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          placeholder="Nhập lại mật khẩu"
        />
      </div>

      <button
        class="auth-button"
        :disabled="loading"
        @click="register"
      >
        {{ loading ? 'Đang đăng ký...' : 'Đăng ký' }}
      </button>

      <div class="auth-register">
        Đã có tài khoản?

        <button
          type="button"
          @click="emit('login')"
        >
          Đăng nhập
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #f1f5f9;
}

.auth-card {
  width: 400px;
  max-width: 100%;

  padding: 30px;

  background: white;
  border-radius: 14px;

  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.1);

  box-sizing: border-box;
}

.auth-card h2 {
  margin-bottom: 24px;
  text-align: center;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  box-sizing: border-box;

  padding: 10px 12px;

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

.auth-error {
  margin-bottom: 15px;
  padding: 10px;

  background: #fee2e2;
  color: #b91c1c;

  border-radius: 8px;
}

.auth-success {
  margin-bottom: 15px;
  padding: 10px;

  background: #dcfce7;
  color: #166534;

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

@media (max-width: 600px) {
  .auth-page {
    width: 100vw;
    max-width: 100vw;
    min-height: 100vh;

    margin: 0;
    padding: 16px;

    box-sizing: border-box;
    overflow-x: hidden;
  }

  .auth-card {
    width: 100%;
    max-width: 100%;

    margin: 0;
    padding: 24px 16px;

    box-sizing: border-box;
  }
}
</style>