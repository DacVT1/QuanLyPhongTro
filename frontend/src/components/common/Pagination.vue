<script setup lang="ts">
defineProps<{
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  "update:currentPage": [page: number];
}>();

function goToPage(page: number, totalPages: number) {
  const targetPage = Math.min(Math.max(page, 1), totalPages);

  emit("update:currentPage", targetPage);
}
</script>

<template>
  <div v-if="totalPages > 1" class="pagination">
    <button
      type="button"
      class="pagination-btn"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1, totalPages)"
    >
      Trước
    </button>

    <button
      v-for="page in totalPages"
      :key="page"
      type="button"
      class="pagination-btn"
      :class="{
        active: currentPage === page,
      }"
      @click="goToPage(page, totalPages)"
    >
      {{ page }}
    </button>

    <button
      type="button"
      class="pagination-btn"
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1, totalPages)"
    >
      Sau
    </button>
  </div>
</template>
