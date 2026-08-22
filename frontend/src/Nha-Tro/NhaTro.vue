<script setup lang="ts">
import { ref } from "vue";

import {
  createNhaTro,
  updateNhaTro,
  deleteNhaTro,
} from "./nha-tro.service";

import type {
  NhaTro,
  NhaTroForm,
  DeleteNhaTroInfo,
} from "./types";

const props = defineProps<{
  nhaTros: NhaTro[];
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const editingNhaTroId = ref<string | null>(null);

const showNhaTroForm = ref(false);

const nhaTroForm = ref<NhaTroForm>({
  maNhaTro: "",
  tenNhaTro: "",
  diaChi: "",
  soTang: 1,
  moTa: "",
});

const showDeleteNhaTroModal = ref(false);

const deleteErrorMessage = ref("");

const deleteNhaTroInfo = ref<DeleteNhaTroInfo>({
  id: "",
  tenNhaTro: "",
  soPhong: 0,
  soGiuong: 0,
  soHopDong: 0,
  soHoaDon: 0,
});

function resetNhaTroForm() {
  nhaTroForm.value = {
    maNhaTro: "",
    tenNhaTro: "",
    diaChi: "",
    soTang: 1,
    moTa: "",
  };

  editingNhaTroId.value = null;
}

function openAddNhaTroForm() {
  resetNhaTroForm();

  showNhaTroForm.value = true;
}

function closeNhaTroForm() {
  resetNhaTroForm();

  showNhaTroForm.value = false;
}

function editNhaTro(item: NhaTro) {
  editingNhaTroId.value = item.id;

  nhaTroForm.value = {
    maNhaTro: item.maNhaTro ?? "",
    tenNhaTro: item.tenNhaTro ?? "",
    diaChi: item.diaChi ?? "",
    soTang: Number(item.soTang ?? 1),
    moTa: item.moTa ?? "",
  };

  showNhaTroForm.value = true;
}

async function saveNhaTro() {
  try {
    const payload = {
      ...nhaTroForm.value,
      soTang: Number(nhaTroForm.value.soTang),
    };

    if (editingNhaTroId.value) {
      await updateNhaTro(
        editingNhaTroId.value,
        payload,
      );
    } else {
      await createNhaTro(payload);
    }

    resetNhaTroForm();

    showNhaTroForm.value = false;

    emit("refresh");
  } catch (error: any) {
    console.error(
      "Không thể lưu nhà trọ:",
      error,
    );

    alert(
      error?.response?.data?.message ??
        "Không thể lưu nhà trọ. Vui lòng thử lại.",
    );
  }
}

function requestDeleteNhaTro(item: NhaTro) {
  deleteNhaTroInfo.value = {
    id: item.id,
    tenNhaTro:
      item.tenNhaTro ?? "Nhà trọ",
    soPhong: 0,
    soGiuong: 0,
    soHopDong: 0,
    soHoaDon: 0,
  };

  deleteErrorMessage.value = "";

  showDeleteNhaTroModal.value = true;
}

function closeDeleteNhaTroModal() {
  showDeleteNhaTroModal.value = false;

  deleteErrorMessage.value = "";
}

async function confirmDeleteNhaTro() {
  const id = deleteNhaTroInfo.value.id;

  if (!id) {
    return;
  }

  try {
    deleteErrorMessage.value = "";

    await deleteNhaTro(id);

    closeDeleteNhaTroModal();

    if (editingNhaTroId.value === id) {
      resetNhaTroForm();

      showNhaTroForm.value = false;
    }

    emit("refresh");
  } catch (error: any) {
    console.error(
      "Không thể xóa nhà trọ:",
      error,
    );

    if (error?.response?.status === 409) {
      const responseData =
        error.response?.data;

      const data =
        responseData?.data ?? {};

      deleteNhaTroInfo.value = {
        id,

        tenNhaTro:
          data.tenNhaTro ??
          props.nhaTros.find(
            (item) => item.id === id,
          )?.tenNhaTro ??
          "Nhà trọ",

        soPhong: Number(
          data.soPhong ?? 0,
        ),

        soGiuong: Number(
          data.soGiuong ?? 0,
        ),

        soHopDong: Number(
          data.soHopDong ?? 0,
        ),

        soHoaDon: Number(
          data.soHoaDon ?? 0,
        ),
      };

      deleteErrorMessage.value =
        responseData?.message ??
        "Không thể xóa nhà trọ vì đang có dữ liệu liên quan.";

      showDeleteNhaTroModal.value = true;

      return;
    }

    deleteErrorMessage.value =
      error?.response?.data?.message ??
      "Có lỗi xảy ra khi xóa nhà trọ.";

    showDeleteNhaTroModal.value = true;
  }
}
</script>

<template>
  <section class="panel-grid">
    <!-- ===================================================
         FORM THÊM / SỬA NHÀ TRỌ
         =================================================== -->
    <div
      v-if="showNhaTroForm"
      class="panel"
    >
      <h3>
        {{
          editingNhaTroId
            ? "Sửa nhà trọ"
            : "Thêm nhà trọ"
        }}
      </h3>

      <form
        @submit.prevent="saveNhaTro"
        class="form-grid"
      >
        <label>
          Mã nhà trọ *

          <input
            v-model="nhaTroForm.maNhaTro"
            placeholder="Ví dụ: CG"
            required
          />
        </label>

        <label>
          Tên nhà trọ *

          <input
            v-model="nhaTroForm.tenNhaTro"
            placeholder="Tên nhà trọ"
            required
          />
        </label>

        <label>
          Địa chỉ *

          <input
            v-model="nhaTroForm.diaChi"
            placeholder="Địa chỉ"
            required
          />
        </label>

        <label>
          Số tầng *

          <input
            v-model.number="nhaTroForm.soTang"
            type="number"
            min="1"
            placeholder="Số tầng"
            required
          />
        </label>

        <label>
          Mô tả *

          <textarea
            v-model="nhaTroForm.moTa"
            placeholder="Mô tả"
            rows="3"
          ></textarea>
        </label>

        <div class="actions">
          <button
            class="primary"
            type="submit"
          >
            {{
              editingNhaTroId
                ? "Cập nhật"
                : "Lưu"
            }}
          </button>

          <button
            class="secondary"
            type="button"
            @click="closeNhaTroForm"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>

    <!-- ===================================================
         DANH SÁCH NHÀ TRỌ
         =================================================== -->
    <div
      v-else
      class="panel"
    >
      <div class="panel-header">
        <h3>Danh sách nhà trọ</h3>

        <button
          type="button"
          class="primary"
          @click="openAddNhaTroForm"
        >
          Thêm nhà trọ
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên</th>
            <th>Địa chỉ</th>
            <th>Số tầng</th>
            <th>Hành động</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in props.nhaTros"
            :key="item.id"
          >
            <td>
              {{ item.maNhaTro }}
            </td>

            <td>
              {{ item.tenNhaTro }}
            </td>

            <td>
              {{ item.diaChi }}
            </td>

            <td>
              {{ item.soTang }}
            </td>

            <td class="row-actions">
              <button
                type="button"
                class="table-btn edit"
                @click="editNhaTro(item)"
              >
                Sửa
              </button>

              <button
                type="button"
                class="table-btn delete"
                @click="requestDeleteNhaTro(item)"
              >
                Xóa
              </button>
            </td>
          </tr>

          <tr
            v-if="props.nhaTros.length === 0"
          >
            <td
              colspan="5"
              style="text-align: center"
            >
              Chưa có nhà trọ
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===================================================
         MODAL XÓA NHÀ TRỌ
         =================================================== -->
    <div
      v-if="showDeleteNhaTroModal"
      class="modal-overlay"
      @click.self="
        closeDeleteNhaTroModal
      "
    >
      <div class="delete-modal">
        <div class="delete-modal-header">
          <div class="warning-icon">
            ⚠
          </div>

          <div>
            <h3>
              Xác nhận xóa nhà trọ
            </h3>

            <p>
              {{
                deleteNhaTroInfo.tenNhaTro
              }}
            </p>
          </div>
        </div>

        <div class="delete-modal-body">
          <template
            v-if="
              deleteNhaTroInfo.soPhong > 0 ||
              deleteNhaTroInfo.soGiuong > 0 ||
              deleteNhaTroInfo.soHopDong > 0 ||
              deleteNhaTroInfo.soHoaDon > 0
            "
          >
            <div class="warning-message">
              <strong>
                Không thể xóa nhà trọ này!
              </strong>

              <p>
                Nhà trọ đang có dữ liệu
                liên quan.
              </p>
            </div>

            <div class="related-data">
              <div class="related-item">
                <span>Phòng</span>

                <strong>
                  {{
                    deleteNhaTroInfo.soPhong
                  }}
                </strong>
              </div>

              <div class="related-item">
                <span>Giường</span>

                <strong>
                  {{
                    deleteNhaTroInfo.soGiuong
                  }}
                </strong>
              </div>

              <div class="related-item">
                <span>Hợp đồng</span>

                <strong>
                  {{
                    deleteNhaTroInfo.soHopDong
                  }}
                </strong>
              </div>

              <div class="related-item">
                <span>Hóa đơn</span>

                <strong>
                  {{
                    deleteNhaTroInfo.soHoaDon
                  }}
                </strong>
              </div>
            </div>

            <p class="delete-modal-note">
              Hãy xử lý các dữ liệu liên
              quan trước khi xóa nhà trọ.
            </p>
          </template>

          <template v-else>
            <p class="confirm-message">
              Bạn có chắc chắn muốn xóa nhà
              trọ
              <strong>
                {{
                  deleteNhaTroInfo.tenNhaTro
                }}
              </strong>
              không?
            </p>

            <p class="delete-modal-note">
              Thao tác này không thể hoàn tác.
            </p>
          </template>

          <p
            v-if="deleteErrorMessage"
            class="error-message"
          >
            {{ deleteErrorMessage }}
          </p>
        </div>

        <div class="delete-modal-actions">
          <button
            class="secondary"
            type="button"
            @click="closeDeleteNhaTroModal"
          >
            Đóng
          </button>

          <button
            v-if="
              deleteNhaTroInfo.soPhong === 0 &&
              deleteNhaTroInfo.soGiuong === 0 &&
              deleteNhaTroInfo.soHopDong === 0 &&
              deleteNhaTroInfo.soHoaDon === 0
            "
            class="danger-button"
            type="button"
            @click="confirmDeleteNhaTro"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.panel {
  padding: 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.panel h3 {
  margin: 0 0 18px;
  color: #172033;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
}

input,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 11px 12px;
  background: white;
  color: #0f172a;
  outline: none;
}

input:focus,
textarea:focus {
  border-color: #3b82f6;
  box-shadow:
    0 0 0 3px
    rgba(59, 130, 246, 0.12);
}

textarea {
  resize: vertical;
}

.actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
}

button {
  border: none;
  border-radius: 9px;
  padding: 10px 14px;
  cursor: pointer;
}

.primary {
  background: #2563eb;
  color: white;
}

.secondary {
  background: #e2e8f0;
  color: #334155;
}

table {
  width: 100%;
  margin-top: 10px;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

th {
  background: #f8fafc;
  color: #475569;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.table-btn.edit {
  background: #dbeafe;
  color: #1d4ed8;
}

.table-btn.delete {
  background: #fee2e2;
  color: #b91c1c;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.5);
  z-index: 2000;
}

.delete-modal {
  width: min(520px, 100%);
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 20px 50px
    rgba(15, 23, 42, 0.2);
}

.delete-modal-header {
  display: flex;
  gap: 14px;
  padding: 20px;
}

.warning-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #fef3c7;
}

.delete-modal-body {
  padding: 0 20px 20px;
}

.warning-message {
  padding: 14px;
  border-radius: 10px;
  background: #fff7ed;
  color: #9a3412;
}

.related-data {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 14px;
}

.related-item {
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

.related-item span {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
}

.related-item strong {
  display: block;
  margin-top: 4px;
}

.delete-modal-note {
  color: #64748b;
  font-size: 0.85rem;
}

.error-message {
  color: #dc2626;
  font-size: 0.85rem;
}

.delete-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
}

.danger-button {
  background: #dc2626;
  color: white;
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .related-data {
    grid-template-columns: repeat(2, 1fr);
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>