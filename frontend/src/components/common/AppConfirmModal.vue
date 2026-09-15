<script setup lang="ts">
type Props = {
  show: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

withDefaults(defineProps<Props>(), {
  title: "Xác nhận thao tác",
  confirmText: "Xác nhận",
  cancelText: "Hủy",
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  confirm: [];
}>();

function close() {
  emit("update:show", false);
}

function handleConfirm() {
  emit("confirm");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="app-confirm">
      <div v-if="show" class="app-confirm-overlay" @click.self="close">
        <div class="app-confirm-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            class="app-confirm-close"
            aria-label="Đóng"
            @click="close"
          >
            ×
          </button>

          <div class="app-confirm-icon">
            <span>!</span>
          </div>

          <div class="app-confirm-content">
            <h3>{{ title }}</h3>

            <p>{{ message }}</p>
          </div>

          <div class="app-confirm-actions">
            <button
              type="button"
              class="app-confirm-btn app-confirm-cancel"
              @click="close"
            >
              {{ cancelText }}
            </button>

            <button
              type="button"
              class="app-confirm-btn app-confirm-submit"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.app-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
}

.app-confirm-modal {
  position: relative;
  width: min(480px, 100%);
  padding: 30px 28px 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow:
    0 24px 60px rgba(15, 23, 42, 0.2),
    0 8px 24px rgba(15, 23, 42, 0.1);
  text-align: center;
}

.app-confirm-close {
  position: absolute;
  top: 12px;
  right: 14px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.app-confirm-close:hover {
  background: #f1f5f9;
  color: #334155;
}

.app-confirm-icon {
  width: 58px;
  height: 58px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fef3c7;
  color: #d97706;
}

.app-confirm-icon span {
  font-size: 30px;
  font-weight: 800;
}

.app-confirm-content h3 {
  margin: 0 0 8px;
  color: #172033;
  font-size: 19px;
  font-weight: 700;
}

.app-confirm-content p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-line;
}

.app-confirm-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
}

.app-confirm-btn {
  min-width: 120px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.app-confirm-btn:hover {
  transform: translateY(-1px);
}

.app-confirm-cancel {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
}

.app-confirm-cancel:hover {
  background: #f8fafc;
}

.app-confirm-submit {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
}

.app-confirm-submit:hover {
  background: #1d4ed8;
}

.app-confirm-enter-active,
.app-confirm-leave-active {
  transition: opacity 0.2s ease;
}

.app-confirm-enter-active .app-confirm-modal,
.app-confirm-leave-active .app-confirm-modal {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.app-confirm-enter-from,
.app-confirm-leave-to {
  opacity: 0;
}

.app-confirm-enter-from .app-confirm-modal,
.app-confirm-leave-to .app-confirm-modal {
  opacity: 0;
  transform: translateY(-10px) scale(0.97);
}

@media (max-width: 480px) {
  .app-confirm-modal {
    padding: 26px 20px 20px;
  }

  .app-confirm-actions {
    flex-direction: column-reverse;
  }

  .app-confirm-btn {
    width: 100%;
  }
}
</style>
