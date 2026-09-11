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

      console.warn(
        "Phiên đăng nhập không còn hợp lệ. Đang chuyển về màn hình đăng nhập...",
      );

      // Xóa phiên đăng nhập cũ
      localStorage.removeItem("accessToken");
      localStorage.removeItem("currentUser");

      // Thông báo cho App.vue cập nhật trạng thái Vue
      window.dispatchEvent(new Event("auth:unauthorized"));

      // Cho phép xử lý 401 tiếp theo sau khi App.vue đã cập nhật
      setTimeout(() => {
        isHandlingUnauthorized = false;
      }, 100);
    }

    return Promise.reject(error);
  },
);

export default api;
