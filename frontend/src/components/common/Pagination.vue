<script setup lang="ts">
import { computed } from "vue";

type Props = {
  currentPage: number;
  totalPages: number;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:currentPage": [page: number];
}>();

/**
 * Hiển thị tối đa 3 trang:
 * - Trang trước
 * - Trang hiện tại
 * - Trang sau
 *
 * Ví dụ:
 * Trang 1/10  -> 1 2 3
 * Trang 2/10  -> 1 2 3
 * Trang 5/10  -> 4 5 6
 * Trang 9/10  -> 8 9 10
 * Trang 10/10 -> 8 9 10
 */
const visiblePages = computed(() => {
  const total = props.totalPages;
  const current = props.currentPage;

  if (total <= 0) {
    return [];
  }

  // Tổng số trang <= 3 thì hiển thị tất cả
  if (total <= 3) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  // Mặc định: trang trước + trang hiện tại + trang sau
  let startPage = current - 1;

  // Đang ở trang đầu
  if (startPage < 1) {
    startPage = 1;
  }

  // Đang ở trang cuối
  if (startPage + 2 > total) {
    startPage = total - 2;
  }

  return [startPage, startPage + 1, startPage + 2];
});

function goToPage(page: number) {
  const targetPage = Math.min(Math.max(page, 1), props.totalPages);

  if (targetPage === props.currentPage) {
    return;
  }

  emit("update:currentPage", targetPage);
}
</script>

<template>
  <div v-if="totalPages > 1" class="pagination">
    <!-- Trang trước -->
    <button
      type="button"
      class="pagination-btn pagination-nav-btn"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
    >
      Trước
    </button>

    <!-- 3 trang: trước - hiện tại - sau -->
    <button
      v-for="page in visiblePages"
      :key="page"
      type="button"
      class="pagination-btn"
      :class="{
        active: currentPage === page,
      }"
      :aria-current="currentPage === page ? 'page' : undefined"
      @click="goToPage(page)"
    >
      {{ page }}
    </button>

    <!-- Trang sau -->
    <button
      type="button"
      class="pagination-btn pagination-nav-btn"
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1)"
    >
      Sau
    </button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding-bottom: 4px;
  flex-wrap: wrap;
}

.pagination-btn {
  min-width: 38px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #172033;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
  font-weight: 600;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-nav-btn {
  min-width: 68px;
}
</style>
