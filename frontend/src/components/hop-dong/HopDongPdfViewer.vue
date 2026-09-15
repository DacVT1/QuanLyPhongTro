<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";

interface Props {
  show: boolean;
  pdfUrl: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "HỢP ĐỒNG THUÊ TRỌ",
});

const emit = defineEmits<{
  "update:show": [value: boolean];
}>();

const loading = ref(false);

function close() {
  emit("update:show", false);
}

watch(
  () => props.show,
  (visible) => {
    loading.value = visible;
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

          <div class="pdf-body">
            <div v-if="loading" class="pdf-loading">
              <div class="pdf-spinner"></div>
              <span>Đang tải hợp đồng...</span>
            </div>

            <iframe
              v-if="pdfUrl"
              class="pdf-frame"
              :src="pdfUrl"
              title="Hợp đồng thuê trọ"
              @load="loading = false"
            />
          </div>

          <div class="pdf-footer">
            <button type="button" class="pdf-btn" @click="close">Đóng</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pdf-overlay {
  position: fixed;
  inset: 0;
  z-index: 10050;

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

  border: 0;
  border-radius: 8px;

  background: transparent;
  color: #64748b;

  font-size: 25px;
  line-height: 1;

  cursor: pointer;
}

.pdf-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.pdf-body {
  position: relative;

  flex: 1;

  min-height: 0;

  background: #e2e8f0;
}

.pdf-frame {
  width: 100%;
  height: 100%;

  display: block;

  border: 0;
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

.pdf-footer {
  display: flex;
  justify-content: flex-end;

  padding: 12px 18px;

  border-top: 1px solid #e2e8f0;
  background: #ffffff;
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

@keyframes pdf-spin {
  to {
    transform: rotate(360deg);
  }
}

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

@media (max-width: 768px) {
  .pdf-overlay {
    padding: 8px;
  }

  .pdf-modal {
    width: 100%;
    height: 96vh;
    border-radius: 12px;
  }

  .pdf-title {
    font-size: 15px;
  }
}
</style>
