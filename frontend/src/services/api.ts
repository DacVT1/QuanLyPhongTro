import axios from "axios";

const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
  const requestUrl = config.url || "";

  const isLoginRequest =
    requestUrl === "/auth/login" || requestUrl.endsWith("/auth/login");

  if (!isLoginRequest) {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => {
    console.log("========== API SUCCESS ==========");
    console.log("Status:", response.status);
    console.log("URL:", response.config?.url);
    console.log("=================================");

    return response;
  },

  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";

    console.error("========== API ERROR ==========");
    console.error("Status:", status);
    console.error("URL:", requestUrl);
    console.error("Method:", error?.config?.method);
    console.error("Response:", error?.response?.data);
    console.error("================================");

    /*
     * QUAN TRỌNG:
     *
     * Không tự động xóa accessToken ở đây.
     *
     * Nếu API nào đó trả 401, chúng ta cần biết chính xác
     * API nào lỗi trước khi quyết định logout.
     */

    return Promise.reject(error);
  },
);

export default api;
