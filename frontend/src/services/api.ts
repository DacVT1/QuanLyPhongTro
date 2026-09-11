import axios from "axios";

const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Backend NestJS uses the global /api prefix.
const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, "");

const apiBaseUrl = normalizedBaseUrl.endsWith("/api")
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`;

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

let isHandlingUnauthorized = false;

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error?.response?.status;

    if (status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;

      console.warn("Phiên đăng nhập không còn hợp lệ. Đang đăng xuất...");

      // Xóa phiên đăng nhập cũ
      localStorage.removeItem("accessToken");
      localStorage.removeItem("currentUser");

      // Reload để App.vue khởi tạo lại trạng thái
      // và hiển thị màn hình đăng nhập.
      window.location.reload();
    }

    return Promise.reject(error);
  },
);

export default api;
