<script setup lang="ts">
import { ref } from 'vue'
import api from '../../services/api'

const username = ref('')
const password = ref('')

const errorMessage = ref('')
const loading = ref(false)

const emit = defineEmits<{
  loginSuccess: [data: any]
  register: []
}>()

async function login() {
  errorMessage.value = ''

  if (!username.value || !password.value) {
    errorMessage.value =
      'Vui lòng nhập đầy đủ thông tin'
    return
  }

  try {
    loading.value = true

    const response = await api.post(
      '/auth/login',
      {
        username: username.value,
        password: password.value,
      },
    )

    localStorage.setItem(
      'accessToken',
      response.data.accessToken,
    )

    localStorage.setItem(
      'currentUser',
      JSON.stringify(response.data.user),
    )

    emit(
      'loginSuccess',
      response.data,
    )
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message ||
      'Đăng nhập thất bại'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>Đăng nhập</h2>

      <div
        v-if="errorMessage"
        class="auth-error"
      >
        {{ errorMessage }}
      </div>

      <div class="form-group">
        <label>Tên đăng nhập</label>

        <input
          v-model="username"
          type="text"
          autocomplete="username"
          placeholder="Nhập tên đăng nhập"
        />
      </div>

      <div class="form-group">
        <label>Mật khẩu</label>

        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Nhập mật khẩu"
          @keyup.enter="login"
        />
      </div>

      <button
        class="auth-button"
        :disabled="loading"
        @click="login"
      >
        {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
      </button>

      <div class="auth-register">
        Chưa có tài khoản?

        <button
          type="button"
          @click="emit('register')"
        >
          Đăng ký
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
  width: 380px;

  padding: 30px;

  background: white;
  border-radius: 14px;

  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.1);
}

.auth-card h2 {
  margin-bottom: 24px;

  text-align: center;
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
</style>