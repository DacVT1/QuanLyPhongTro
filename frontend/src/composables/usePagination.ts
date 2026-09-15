import { computed, ref, watch, type Ref } from "vue";

export function usePagination<T>(source: Ref<T[]>, pageSize = 10) {
  const currentPage = ref(1);

  const totalPages = computed(() => {
    return Math.max(Math.ceil(source.value.length / pageSize), 1);
  });

  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize;

    return source.value.slice(start, start + pageSize);
  });

  const goToPage = (page: number) => {
    currentPage.value = Math.min(Math.max(page, 1), totalPages.value);
  };

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
    }
  };

  const previousPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--;
    }
  };

  const resetPage = () => {
    currentPage.value = 1;
  };

  watch(
    source,
    () => {
      if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value;
      }
    },
    { deep: true },
  );

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    pageSize,
  };
}
