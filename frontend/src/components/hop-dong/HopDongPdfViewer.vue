<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import api from "../../services/api";
import AppNotification from "../common/AppNotification.vue";

interface Props {
  show: boolean;
  pdfUrl: string;
  title?: string;
  hopDongId: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "HỢP ĐỒNG THUÊ TRỌ",
});

const emit = defineEmits<{
  "update:show": [value: boolean];
}>();

const showNotification = ref(false);
const notificationType = ref<"success" | "error" | "warning" | "info">(
  "success",
);
const notificationTitle = ref("");
const notificationMessage = ref("");

const loading = ref(false);
const sending = ref(false);

/**
 * Xác định thiết bị mobile.
 *
 * Không chỉ dựa vào user-agent mà còn kiểm tra
 * kích thước màn hình để hỗ trợ các thiết bị/tablet
 * có user-agent đặc biệt.
 */
const isMobile = computed(() => {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent =
    navigator.userAgent || navigator.vendor || (window as any).opera || "";

  const mobileUserAgent =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
      userAgent,
    );

  const smallScreen = window.innerWidth <= 768;

  return mobileUserAgent || smallScreen;
});

function close() {
  emit("update:show", false);
}

function notify(
  message: string,
  type: "success" | "error" | "warning" | "info" = "success",
  title?: string,
) {
  notificationType.value = type;
  notificationTitle.value = title ?? "";
  notificationMessage.value = message;
  showNotification.value = true;
}

/**
 * Mở PDF trên điện thoại.
 *
 * pdfUrl ở đây là Blob URL được tạo từ App.vue:
 *
 * URL.createObjectURL(blob)
 *
 * Không dùng iframe trên mobile vì một số trình duyệt
 * mobile không render PDF Blob ổn định trong iframe.
 */
function openPdfOnMobile() {
  if (!props.pdfUrl) {
    notify(
      "Không tìm thấy file hợp đồng PDF.",
      "error",
      "Không thể mở hợp đồng",
    );
    return;
  }

  try {
    const newWindow = window.open(props.pdfUrl, "_blank");

    /**
     * Một số trình duyệt chặn window.open.
     *
     * Nếu bị chặn thì chuyển trực tiếp tới Blob URL
     * trong tab hiện tại.
     */
    if (!newWindow) {
      window.location.href = props.pdfUrl;
    }
  } catch (error) {
    console.error("Không thể mở PDF trên điện thoại:", error);

    notify(
      "Không thể mở file hợp đồng. Vui lòng thử lại.",
      "error",
      "Không thể mở hợp đồng",
    );
  }
}

/**
 * Mở PDF trong tab mới trên desktop.
 */
function openPdfInNewTab() {
  if (!props.pdfUrl) {
    notify(
      "Không tìm thấy file hợp đồng PDF.",
      "error",
      "Không thể mở hợp đồng",
    );
    return;
  }

  try {
    const newWindow = window.open(props.pdfUrl, "_blank");

    if (!newWindow) {
      notify(
        "Trình duyệt đang chặn cửa sổ mới. Vui lòng cho phép mở cửa sổ mới rồi thử lại.",
        "warning",
        "Không thể mở PDF",
      );
    }
  } catch (error) {
    console.error("Không thể mở PDF:", error);

    notify(
      "Không thể mở file hợp đồng. Vui lòng thử lại.",
      "error",
      "Không thể mở hợp đồng",
    );
  }
}

async function sendContract() {
  if (!props.hopDongId) {
    return;
  }

  try {
    sending.value = true;

    const response = await api.post(`/hop-dong/${props.hopDongId}/send-email`);

    const message =
      response.data?.message ?? "Hợp đồng đã được gửi thành công.";

    notify(message, "success", "Gửi hợp đồng thành công");
  } catch (error: any) {
    console.error("Không thể gửi hợp đồng:", error);

    const message =
      error?.response?.data?.message ?? "Không thể gửi hợp đồng qua email.";

    notify(
      Array.isArray(message) ? message.join("\n") : message,
      "error",
      "Không thể gửi hợp đồng",
    );
  } finally {
    sending.value = false;
  }
}

/**
 * Khi modal mở:
 * desktop → hiển thị loading cho iframe
 * mobile → không cần iframe
 */
watch(
  () => props.show,
  (visible) => {
    loading.value = visible && !isMobile.value;
  },
);

onBeforeUnmount(() => {
  loading.value = false;
});
</script>

<template>
  <Teleport to="body">
    <Transition name="hop-dong-pdf">
      <div v-if="show" class="pdf-overlay" @click.self="close">
        <div class="pdf-modal">
          <!-- HEADER -->
          <div class="pdf-header">
            <div class="pdf-title">
              {{ title }}
            </div>

            <button
              type="button"
              class="pdf-close"
              aria-label="Đóng"
              @click="close"
            >
              ×
            </button>
          </div>

          <!-- BODY -->
          <div class="pdf-body">
            <!-- ========================= -->
            <!-- MOBILE -->
            <!-- ========================= -->
            <div v-if="isMobile" class="mobile-pdf-container">
              <div class="mobile-pdf-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M6 2H14L19 7V22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />

                  <path
                    d="M14 2V7H19"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />

                  <path
                    d="M8 12H16"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />

                  <path
                    d="M8 16H14"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                </svg>
              </div>

              <h3 class="mobile-pdf-title">Hợp đồng thuê trọ</h3>

              <p class="mobile-pdf-description">
                Hợp đồng PDF đã được tải thành công. Nhấn nút bên dưới để mở
                bằng trình đọc PDF của điện thoại.
              </p>

              <button
                type="button"
                class="mobile-open-pdf-btn"
                @click="openPdfOnMobile"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M14 3H21V10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />

                  <path
                    d="M10 14L21 3"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />

                  <path
                    d="M21 14V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                <span>Mở hợp đồng PDF</span>
              </button>

              <p class="mobile-pdf-hint">
                Nếu trình duyệt hỏi quyền mở file hoặc tab mới, hãy cho phép để
                xem hợp đồng.
              </p>
            </div>

            <!-- ========================= -->
            <!-- DESKTOP / LAPTOP -->
            <!-- ========================= -->
            <template v-else>
              <div v-if="loading" class="pdf-loading">
                <div class="pdf-spinner"></div>

                <span> Đang tải hợp đồng... </span>
              </div>

              <iframe
                v-if="pdfUrl"
                class="pdf-frame"
                :src="pdfUrl"
                title="Hợp đồng thuê trọ"
                @load="loading = false"
              />
            </template>
          </div>

          <!-- FOOTER -->
          <div class="pdf-footer">
            <!-- Desktop -->
            <button
              v-if="!isMobile"
              type="button"
              class="pdf-open-new-btn"
              @click="openPdfInNewTab"
            >
              Mở tab mới
            </button>

            <button
              type="button"
              class="pdf-send-btn"
              :disabled="sending"
              @click="sendContract"
            >
              {{ sending ? "Đang gửi..." : "Gửi hợp đồng" }}
            </button>

            <button type="button" class="pdf-btn" @click="close">Đóng</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <AppNotification
    v-model:show="showNotification"
    :type="notificationType"
    :title="notificationTitle"
    :message="notificationMessage"
    :duration="5000"
  />
</template>

<style scoped>
.pdf-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(15, 23, 42, 0.58);

  backdrop-filter: blur(4px);
}

.pdf-modal {
  width: min(1100px, 96vw);
  height: min(92vh, 900px);

  display: flex;
  flex-direction: column;

  overflow: hidden;

  background: #ffffff;

  border: 1px solid #e2e8f0;
  border-radius: 16px;

  box-shadow:
    0 30px 80px rgba(15, 23, 42, 0.25),
    0 10px 30px rgba(15, 23, 42, 0.12);
}

.pdf-header {
  height: 58px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  flex-shrink: 0;

  padding: 0 18px;

  border-bottom: 1px solid #e2e8f0;

  background: #ffffff;
}

.pdf-title {
  color: #172033;

  font-size: 17px;

  font-weight: 700;
}

.pdf-close {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0;

  border: 0;
  border-radius: 8px;

  background: transparent;

  color: #64748b;

  font-size: 25px;
  line-height: 1;

  cursor: pointer;

  -webkit-tap-highlight-color: transparent;
}

.pdf-close:hover {
  background: #f1f5f9;

  color: #0f172a;
}

.pdf-body {
  position: relative;

  flex: 1;

  min-height: 0;

  overflow: hidden;

  background: #e2e8f0;
}

.pdf-frame {
  width: 100%;
  height: 100%;

  display: block;

  border: 0;

  background: #ffffff;
}

.pdf-loading {
  position: absolute;
  inset: 0;

  z-index: 2;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 12px;

  background: #f8fafc;

  color: #64748b;

  font-size: 14px;
}

.pdf-spinner {
  width: 34px;
  height: 34px;

  border: 3px solid #cbd5e1;

  border-top-color: #2563eb;

  border-radius: 50%;

  animation: pdf-spin 0.8s linear infinite;
}

@keyframes pdf-spin {
  to {
    transform: rotate(360deg);
  }
}

/* =============================== */
/* MOBILE PDF */
/* =============================== */

.mobile-pdf-container {
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  padding: 28px 20px;

  overflow-y: auto;

  background: #f8fafc;

  text-align: center;
}

.mobile-pdf-icon {
  width: 78px;
  height: 78px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 20px;

  border-radius: 20px;

  background: #e8f0fe;

  color: #2563eb;
}

.mobile-pdf-icon svg {
  width: 44px;
  height: 44px;
}

.mobile-pdf-title {
  margin: 0 0 10px;

  color: #172033;

  font-size: 20px;

  font-weight: 700;
}

.mobile-pdf-description {
  max-width: 420px;

  margin: 0 0 24px;

  color: #64748b;

  font-size: 14px;

  line-height: 1.6;
}

.mobile-open-pdf-btn {
  min-width: 210px;

  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 9px;

  padding: 12px 20px;

  border: 1px solid #2563eb;

  border-radius: 10px;

  background: #2563eb;

  color: #ffffff;

  font-size: 14px;

  font-weight: 600;

  cursor: pointer;

  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);

  -webkit-tap-highlight-color: transparent;
}

.mobile-open-pdf-btn svg {
  width: 19px;
  height: 19px;

  flex-shrink: 0;
}

.mobile-open-pdf-btn:hover {
  background: #1d4ed8;

  border-color: #1d4ed8;
}

.mobile-open-pdf-btn:active {
  transform: translateY(1px);
}

.mobile-pdf-hint {
  max-width: 360px;

  margin: 16px 0 0;

  color: #94a3b8;

  font-size: 12px;

  line-height: 1.5;
}

/* =============================== */
/* FOOTER */
/* =============================== */

.pdf-footer {
  min-height: 64px;

  display: flex;

  align-items: center;
  justify-content: flex-end;

  gap: 10px;

  flex-shrink: 0;

  padding: 12px 18px;

  border-top: 1px solid #e2e8f0;

  background: #ffffff;
}

.pdf-open-new-btn {
  min-width: 105px;

  padding: 9px 16px;

  border: 1px solid #cbd5e1;

  border-radius: 9px;

  background: #ffffff;

  color: #475569;

  font-size: 14px;

  font-weight: 600;

  cursor: pointer;
}

.pdf-open-new-btn:hover {
  background: #f8fafc;
}

.pdf-send-btn {
  min-width: 130px;

  padding: 9px 18px;

  border: 1px solid #2563eb;

  border-radius: 9px;

  background: #2563eb;

  color: #ffffff;

  font-size: 14px;

  font-weight: 600;

  cursor: pointer;
}

.pdf-send-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.pdf-send-btn:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

.pdf-btn {
  min-width: 90px;

  padding: 9px 18px;

  border: 1px solid #cbd5e1;

  border-radius: 9px;

  background: #ffffff;

  color: #475569;

  font-size: 14px;

  font-weight: 600;

  cursor: pointer;
}

.pdf-btn:hover {
  background: #f8fafc;
}

/* =============================== */
/* TRANSITION */
/* =============================== */

.hop-dong-pdf-enter-active,
.hop-dong-pdf-leave-active {
  transition: opacity 0.2s ease;
}

.hop-dong-pdf-enter-active .pdf-modal,
.hop-dong-pdf-leave-active .pdf-modal {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.hop-dong-pdf-enter-from,
.hop-dong-pdf-leave-to {
  opacity: 0;
}

.hop-dong-pdf-enter-from .pdf-modal,
.hop-dong-pdf-leave-to .pdf-modal {
  opacity: 0;

  transform: translateY(-10px) scale(0.98);
}

/* =============================== */
/* MOBILE */
/* =============================== */

@media (max-width: 768px) {
  .pdf-overlay {
    padding: 8px;
  }

  .pdf-modal {
    width: 100%;
    height: 96vh;

    border-radius: 12px;
  }

  .pdf-header {
    height: 54px;

    padding: 0 14px;
  }

  .pdf-title {
    font-size: 15px;
  }

  .pdf-footer {
    min-height: 60px;

    padding: 10px 12px;

    gap: 8px;
  }

  .pdf-send-btn {
    min-width: 0;

    flex: 1;

    padding: 9px 12px;

    font-size: 13px;
  }

  .pdf-btn {
    min-width: 75px;

    padding: 9px 12px;

    font-size: 13px;
  }

  .mobile-pdf-container {
    padding: 20px 16px;
  }

  .mobile-pdf-icon {
    width: 68px;
    height: 68px;

    margin-bottom: 16px;

    border-radius: 18px;
  }

  .mobile-pdf-icon svg {
    width: 38px;
    height: 38px;
  }

  .mobile-pdf-title {
    font-size: 18px;
  }

  .mobile-pdf-description {
    margin-bottom: 20px;

    font-size: 13px;
  }

  .mobile-open-pdf-btn {
    width: 100%;
    max-width: 300px;

    min-width: 0;

    padding: 12px 16px;
  }
}

@media (max-width: 768px) and (orientation: landscape) {
  .pdf-modal {
    height: 94vh;
  }

  .mobile-pdf-container {
    padding: 12px 20px;
  }

  .mobile-pdf-icon {
    width: 54px;
    height: 54px;

    margin-bottom: 8px;
  }

  .mobile-pdf-icon svg {
    width: 30px;
    height: 30px;
  }

  .mobile-pdf-title {
    margin-bottom: 5px;

    font-size: 16px;
  }

  .mobile-pdf-description {
    margin-bottom: 10px;
  }

  .mobile-pdf-hint {
    margin-top: 8px;
  }
}
</style>
