<script setup lang="ts">
import { ref } from "vue";
import Login from "@/components/auth/Login.vue";
import api from "@/services/api";

interface UserAccount {
  id: string;
  username: string;
  tenHienThi: string;
  email: string;
  role: string;
  createdAt?: string;
}

const isAdmin = ref(false);
const loading = ref(false);
const errorMessage = ref("");
const accounts = ref<UserAccount[]>([]);

async function handleLogin(data: any) {
  errorMessage.value = "";
  accounts.value = [];

  // Chỉ tài khoản admin mới được vào trang này.
  if (data?.user?.role !== "admin") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");

    isAdmin.value = false;

    errorMessage.value =
      "Tài khoản không có quyền quản trị. Chỉ admin mới được xem danh sách tài khoản.";

    return;
  }

  isAdmin.value = true;

  await loadUsers();
}

async function loadUsers() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await api.get("/tai-khoan/admin/users");

    accounts.value = response.data;
  } catch (error: any) {
    accounts.value = [];

    errorMessage.value =
      error?.response?.data?.message ??
      "Không thể tải danh sách tài khoản. Vui lòng thử lại.";

    // Nếu backend từ chối quyền, không giữ giao diện quản trị.
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("currentUser");
      isAdmin.value = false;
    }
  } finally {
    loading.value = false;
  }
}

async function deleteUser(account: UserAccount) {
  const confirmed = window.confirm(
    `CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản "${
      account.email || account.username
    }" không?\n\n` +
      "Thao tác này sẽ xóa tenant và toàn bộ dữ liệu liên quan, " +
      "bao gồm nhà trọ, phòng, giường, người thuê, hợp đồng, hóa đơn " +
      "và các gói đăng ký dịch vụ. Dữ liệu đã xóa không thể khôi phục " +
      "nếu không có bản sao lưu.",
  );

  if (!confirmed) return;

  errorMessage.value = "";

  try {
    await api.delete(`/tai-khoan/admin/users/${account.id}`);

    // Cập nhật danh sách sau khi xóa thành công.
    accounts.value = accounts.value.filter((item) => item.id !== account.id);
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.message ??
      "Không thể xóa tài khoản. Vui lòng thử lại.";
  }
}

function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("currentUser");

  accounts.value = [];
  isAdmin.value = false;
  errorMessage.value = "";
}
</script>

<template>
  <div class="user-admin-page">
    <!-- Chưa đăng nhập với quyền admin -->
    <div v-if="!isAdmin">
      <Login :hide-secondary-actions="true" @login-success="handleLogin" />

      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>
    </div>

    <!-- Đã đăng nhập với quyền admin -->
    <div v-else class="admin-container">
      <header class="admin-header">
        <div>
          <h1>Quản lý tài khoản</h1>
          <p>Danh sách các tài khoản người dùng trên hệ thống</p>
        </div>

        <button class="logout-button" @click="logout">Đăng xuất</button>
      </header>

      <div class="account-summary">
        Tổng số tài khoản user:
        <strong>{{ accounts.length }}</strong>
      </div>

      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>

      <div v-if="loading" class="loading">Đang tải danh sách tài khoản...</div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên hiển thị</th>
              <th>Email / Username</th>
              <th>Mật khẩu</th>
              <th>Role</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(account, index) in accounts" :key="account.id">
              <td>{{ index + 1 }}</td>

              <td>{{ account.tenHienThi || "—" }}</td>

              <td>{{ account.email || account.username }}</td>

              <td>
                <span class="password-status">Đã mã hóa</span>
              </td>

              <td>
                <span class="role-badge">
                  {{ account.role }}
                </span>
              </td>

              <td>
                {{
                  account.createdAt
                    ? new Date(account.createdAt).toLocaleDateString("vi-VN")
                    : "—"
                }}
              </td>

              <td>
                <button class="delete-button" @click="deleteUser(account)">
                  Xóa
                </button>
              </td>
            </tr>

            <tr v-if="accounts.length === 0">
              <td colspan="7" class="empty-state">
                Chưa có tài khoản user nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button class="refresh-button" :disabled="loading" @click="loadUsers">
        {{ loading ? "Đang tải..." : "Làm mới danh sách" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.user-admin-page {
  min-height: 100vh;
  background: #f1f5f9;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.admin-header h1 {
  margin: 0 0 8px;
  color: #0f172a;
}

.admin-header p {
  margin: 0;
  color: #64748b;
}

.account-summary {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 10px;
}

.table-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

th {
  background: #e2e8f0;
  color: #334155;
}

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  background: #dcfce7;
  color: #166534;
  font-weight: 600;
}

.logout-button,
.refresh-button {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.logout-button {
  background: #fee2e2;
  color: #b91c1c;
}

.refresh-button {
  margin-top: 20px;
  background: #2563eb;
  color: white;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  max-width: 500px;
  margin: 16px auto;
  padding: 12px;
  border-radius: 8px;
  background: #fee2e2;
  color: #b91c1c;
  text-align: center;
}

.loading,
.empty-state {
  padding: 24px;
  text-align: center;
  color: #64748b;
}

@media (max-width: 600px) {
  .admin-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-container {
    padding: 20px 12px;
  }
}

.password-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  font-size: 13px;
}

.delete-button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: #dc2626;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.delete-button:hover {
  background: #b91c1c;
}
</style>
