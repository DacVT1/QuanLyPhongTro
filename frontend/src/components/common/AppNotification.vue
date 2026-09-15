<script setup lang="ts">
import { watch, onUnmounted } from "vue";

type Props = {
  show: boolean;
  title?: string;
  message: string;
  duration?: number;
};

const props = withDefaults(defineProps<Props>(), {
  title: "Thành công",
  duration: 2500,
});

const emit = defineEmits<{
  "update:show": [value: boolean];
}>();

let timer: number | null = null;

function close() {
  emit("update:show", false);

  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
}

watch(
  () => props.show,
  (visible) => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }

    if (visible && props.duration > 0) {
      timer = window.setTimeout(() => {
        emit("update:show", false);
        timer = null;
      }, props.duration);
    }
  },
);

onUnmounted(() => {
  if (timer !== null) {
    window.clearTimeout(timer);
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="app-notification">
      <div v-if="show" class="app-notification-overlay" @click.self="close">
        <div class="app-notification" role="alertdialog" aria-modal="true">
          <div class="app-notification-icon">
            <span>✓</span>
          </div>

          <div class="app-notification-body">
            <h3>{{ title }}</h3>

            <p>{{ message }}</p>
          </div>

          <button
            type="button"
            class="app-notification-close"
            aria-label="Đóng"
            @click="close"
          >
            ×
          </button>

          <div class="app-notification-progress">
            <span
              :style="{
                animationDuration: `${duration}ms`,
              }"
            ></span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.app-notification-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(15, 23, 42, 0.35);

  backdrop-filter: blur(2px);
}

.app-notification {
  position: relative;

  display: flex;
  align-items: flex-start;
  gap: 14px;

  width: min(440px, 100%);

  padding: 22px 48px 22px 22px;

  background: #ffffff;

  border: 1px solid #dcfce7;
  border-radius: 16px;

  box-shadow:
    0 20px 50px rgba(15, 23, 42, 0.16),
    0 8px 20px rgba(15, 23, 42, 0.08);

  overflow: hidden;
}

.app-notification-icon {
  flex: 0 0 44px;

  width: 44px;
  height: 44px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #dcfce7;
  color: #16a34a;
}

.app-notification-icon span {
  font-size: 25px;
  font-weight: 700;
  line-height: 1;
}

.app-notification-body {
  min-width: 0;
  padding-top: 1px;
}

.app-notification-body h3 {
  margin: 0 0 5px;

  color: #172033;

  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
}

.app-notification-body p {
  margin: 0;

  color: #64748b;

  font-size: 14px;
  line-height: 1.55;
}

.app-notification-close {
  position: absolute;
  top: 10px;
  right: 12px;

  width: 30px;
  height: 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0;

  border: none;
  border-radius: 8px;

  background: transparent;
  color: #94a3b8;

  font-size: 24px;
  line-height: 1;

  cursor: pointer;

  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.app-notification-close:hover {
  background: #f1f5f9;
  color: #334155;
}

.app-notification-progress {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;

  height: 3px;

  background: #f0fdf4;
}

.app-notification-progress span {
  display: block;

  width: 100%;
  height: 100%;

  transform-origin: left;

  background: #22c55e;

  animation-name: app-notification-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes app-notification-progress {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}

.app-notification-enter-active,
.app-notification-leave-active {
  transition: opacity 0.2s ease;
}

.app-notification-enter-active .app-notification,
.app-notification-leave-active .app-notification {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.app-notification-enter-from,
.app-notification-leave-to {
  opacity: 0;
}

.app-notification-enter-from .app-notification,
.app-notification-leave-to .app-notification {
  opacity: 0;
  transform: translateY(-10px) scale(0.97);
}
</style>
