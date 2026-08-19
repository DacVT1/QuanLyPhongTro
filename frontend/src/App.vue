<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from './services/api'
import { getImageUrl } from './utils/image';
const cccdMatTruocPreviewUrl = ref('')
const cccdMatSauPreviewUrl = ref('')
const tabs = ['dashboard', 'nhaTro', 'phong', 'giuong', 'nguoiThue', 'hopDong', 'hoaDon']
const currentTab = ref('dashboard')

const summary = ref({
  totalNhaTro: 0,
  totalPhong: 0,
  totalGiuong: 0,
  totalHopDong: 0,
  totalHoaDon: 0,
})

const nhatroImg = ref('/images/nhatro.svg')

const fallbackSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='60' viewBox='0 0 80 60'><rect width='100%' height='100%' fill='%23e6f2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='12' fill='%230f172a'>Nha tro</text></svg>`
const fallbackUri = 'data:image/svg+xml;utf8,' + encodeURIComponent(fallbackSvg)

function onImageError() {
  nhatroImg.value = fallbackUri
}

function onImgError(event: Event) {
  const el = event.target as HTMLImageElement
  if (el && !el.dataset.fallbackApplied) {
    el.dataset.fallbackApplied = '1'
    el.src = fallbackUri
  }
}

const nhaTros = ref<any[]>([])
const phongs = ref<any[]>([])
const giuongs = ref<any[]>([])
const nguoiThues = ref<any[]>([])
const hopDongs = ref<any[]>([])
const hoaDons = ref<any[]>([])

const nhaTroForm = ref({
  maNhaTro: '',
  tenNhaTro: '',
  diaChi: '',
  soTang: 1,
  moTa: '',
})

const phongForm = ref({
  maPhong: '',
  tangSo: '',
  soGiuongToiDa: 8,
  loaiPhong: 'phong_tieu_chuan',
  dienTich: 25,
  nhaTroId: '',
})

const tangSoOptions = computed(() => {
  if (!phongForm.value.nhaTroId) {
    return []
  }

  const nhaTro = nhaTros.value.find(
    item => item.id === phongForm.value.nhaTroId
  )

  if (!nhaTro) {
    return []
  }

  const soTang = Number(nhaTro.soTang ?? 0)

  if (soTang <= 0) {
    return []
  }

  // Các tầng đã được sử dụng bởi phòng khác
  const usedFloors = phongs.value
    .filter(item => {
      if (item.nhaTro?.id !== phongForm.value.nhaTroId) {
        return false
      }

      // Khi sửa phòng thì không loại tầng hiện tại của chính phòng đó
      if (item.id === editingPhongId.value) {
        return false
      }

      return true
    })
    .map(item => {
      // Ưu tiên tangSo nếu backend đã lưu
      if (
        item.tangSo !== undefined &&
        item.tangSo !== null
      ) {
        return Number(item.tangSo)
      }

      // Hỗ trợ dữ liệu cũ: lấy từ CG_T1, CG_T2...
      const match = String(item.maPhong ?? '')
        .match(/_T(\d+)$/)

      return match ? Number(match[1]) : null
    })
    .filter(
      (floor): floor is number =>
        floor !== null && Number.isInteger(floor)
    )

  return Array.from(
    { length: soTang },
    (_, index) => index + 1
  ).filter(
    floor => !usedFloors.includes(floor)
  )
})

const giuongForm = ref({
  nhaTroId: '',
  phongId: '',
  maGiuong: '',
  trangThai: 'trong',
})

const nguoiThueForm = ref({
  hoTen: '',
  cccd: '',
  sdt: '',
  email: '',
  diaChi: '',
  ngaySinh: '',
  bienSoXe: '',
  cccdMatTruoc: null as File | null,
  cccdMatSau: null as File | null,
  cccdMatTruocUrl: '',
  cccdMatSauUrl: '',
})

const hopDongForm = ref({
  maHopDong: '',
  ngayBatDau: '',
  ngayKetThuc: '',
  tienThue: 0,
  chuKyThanhToan: 1,
  tienDatCoc: 0,
  ghiChu: '',
  giuongId: '',
  nguoiThueId: '',
  trangThai: 'active',
})

const hoaDonForm = ref({
  maHoaDon: '',
  thangThanhToan: '',
  tongTien: 0,
  trangThai: 'chua_thanh_toan',
  hopDongId: '',
})

const editingNhaTroId = ref<string | null>(null)
const editingPhongId = ref<string | null>(null)
const editingGiuongId = ref<string | null>(null)
const editingNguoiThueId = ref<string | null>(null)
const cccdMatTruocInput = ref<HTMLInputElement | null>(null)
const cccdMatSauInput = ref<HTMLInputElement | null>(null)
const cccdMatTruocUrl = ref('')
const cccdMatSauUrl = ref('')
const editingHopDongId = ref<string | null>(null)
const editingHoaDonId = ref<string | null>(null)

const giuongOptions = computed(() => {
  const allOptions = Array.from(
    { length: 8 },
    (_, index) => String(index + 1)
  )

  // Chưa chọn phòng
  if (!giuongForm.value.phongId) {
    return allOptions
  }

  const existingCodes = giuongs.value
    .filter(
      (item) =>
        item.phong?.id === giuongForm.value.phongId &&
        item.id !== editingGiuongId.value
    )
    .map((item) => String(item.maGiuong))

  const currentCode = String(
    giuongForm.value.maGiuong ?? ''
  )

  // Khi sửa, luôn giữ lại mã giường hiện tại
  const availableCodes = allOptions.filter(
    (code) => !existingCodes.includes(code)
  )

  if (
    editingGiuongId.value &&
    currentCode &&
    !availableCodes.includes(currentCode)
  ) {
    availableCodes.push(currentCode)
  }

  return availableCodes.sort(
    (a, b) => Number(a) - Number(b)
  )
})

const requiredLabel = (label: string) => `${label} *`

function getStatusText(status: string) {
  const map: Record<string, string> = {
    trong: 'Trống',
    da_thue: 'Đã thuê',
    bao_tri: 'Bảo trì',
    sap_tra_tro: 'Sắp trả trọ',
    active: 'Có hiệu lực',
    expired: 'Hết hiệu lực',
    chua_thanh_toan: 'Chưa thanh toán',
    da_thanh_toan: 'Đã thanh toán',
  }
  return map[status] ?? status
}

async function loadData() {
  try {
    const [nhaTroResponse, phongResponse, giuongResponse, nguoiThueResponse, hopDongResponse, hoaDonResponse, dashboardResponse] =
      await Promise.all([
        api.get('/nha-tro'),
        api.get('/phong'),
        api.get('/giuong'),
        api.get('/nguoi-thue'),
        api.get('/hop-dong'),
        api.get('/hoa-don'),
        api.get('/dashboard/summary'),
      ])

    nhaTros.value = nhaTroResponse.data
    phongs.value = phongResponse.data
    giuongs.value = giuongResponse.data
    nguoiThues.value = nguoiThueResponse.data
    hopDongs.value = hopDongResponse.data
    hoaDons.value = hoaDonResponse.data
    summary.value = dashboardResponse.data
  } catch (error) {
    console.error('Không thể nạp dữ liệu:', error)
  }
}

function resetNhaTroForm() {
  nhaTroForm.value = { maNhaTro: '',tenNhaTro: '', diaChi: '', soTang: 1, moTa: '' }
  editingNhaTroId.value = null
}

function resetPhongForm() {
  phongForm.value = {
    maPhong: '',
    tangSo: '',
    soGiuongToiDa: 8,
    loaiPhong: 'phong_tieu_chuan',
    dienTich: 25,
    nhaTroId: '',
  }
  editingPhongId.value = null
}

function handleNhaTroChange() {
  phongForm.value.tangSo = ''
}

function resetGiuongForm() {
  giuongForm.value = { nhaTroId: '', phongId: '', maGiuong: '', trangThai: 'trong' }
  editingGiuongId.value = null
}

function resetNguoiThueForm() {
  nguoiThueForm.value = {
    hoTen: '',
    cccd: '',
    sdt: '',
    email: '',
    diaChi: '',
    ngaySinh: '',
    bienSoXe: '',
    cccdMatTruoc: null,
    cccdMatSau: null,

    cccdMatTruocUrl: '',
    cccdMatSauUrl: '',
  }

  editingNguoiThueId.value = null

  if (cccdMatTruocInput.value) {
    cccdMatTruocInput.value.value = ''
  }

  if (cccdMatSauInput.value) {
    cccdMatSauInput.value.value = ''
  }

  if (cccdMatTruocPreviewUrl.value) {
  URL.revokeObjectURL(cccdMatTruocPreviewUrl.value)
  cccdMatTruocPreviewUrl.value = ''
}

if (cccdMatSauPreviewUrl.value) {
  URL.revokeObjectURL(cccdMatSauPreviewUrl.value)
  cccdMatSauPreviewUrl.value = ''
}
}

function resetHopDongForm() {
  hopDongForm.value = {
    maHopDong: '',
    ngayBatDau: '',
    ngayKetThuc: '',
    tienThue: 0,
    chuKyThanhToan: 1,
    tienDatCoc: 0,
    ghiChu: '',
    giuongId: '',
    nguoiThueId: '',
    trangThai: 'active',
  }

  editingHopDongId.value = null
}

function resetHoaDonForm() {
  hoaDonForm.value = {
    maHoaDon: '',
    thangThanhToan: '',
    tongTien: 0,
    trangThai: 'chua_thanh_toan',
    hopDongId: '',
  }
  editingHoaDonId.value = null
}

async function saveNhaTro() {
  const payload = { ...nhaTroForm.value }
  if (editingNhaTroId.value) {
    await api.patch(`/nha-tro/${editingNhaTroId.value}`, payload)
  } else {
    await api.post('/nha-tro', payload)
  }
  resetNhaTroForm()
  await loadData()
}

async function savePhong() {
  const payload = { ...phongForm.value, nhaTro: { id: phongForm.value.nhaTroId } }
  if (editingPhongId.value) {
    await api.patch(`/phong/${editingPhongId.value}`, payload)
  } else {
    await api.post('/phong', payload)
  }
  resetPhongForm()
  await loadData()
}

function requestDeletePhong(item: any) {
  deletePhongInfo.value = {
    id: item.id,
    maPhong: item.maPhong ?? 'Phòng',
    tenNhaTro: item.nhaTro?.tenNhaTro ?? '',
    soGiuong: Array.isArray(item.giuongs)
      ? item.giuongs.length
      : 0,
  }

  deletePhongErrorMessage.value = ''
  showDeletePhongModal.value = true
}

function closeDeletePhongModal() {
  showDeletePhongModal.value = false
  deletePhongErrorMessage.value = ''
}

function requestDeleteNguoiThue(item: any) {
  deleteNguoiThueInfo.value = {
    id: item.id,
    hoTen: item.hoTen ?? 'Người thuê',
    cccd: item.cccd ?? '',
  }

  deleteNguoiThueErrorMessage.value = ''

  showDeleteNguoiThueModal.value = true
}

function closeDeleteNguoiThueModal() {
  showDeleteNguoiThueModal.value = false
  deleteNguoiThueErrorMessage.value = ''
}

async function confirmDeletePhong() {
  const id = deletePhongInfo.value.id

  if (!id) {
    return
  }

  try {
    deletePhongErrorMessage.value = ''

    await api.delete(`/phong/${id}`)

    closeDeletePhongModal()

    if (editingPhongId.value === id) {
      resetPhongForm()
    }

    await loadData()
  } catch (error: any) {
    console.error('Không thể xóa phòng:', error)

    deletePhongErrorMessage.value =
      error?.response?.data?.message ??
      'Không thể xóa phòng. Vui lòng thử lại.'
  }
}

async function confirmDeleteNguoiThue() {
  const id = deleteNguoiThueInfo.value.id

  if (!id) {
    return
  }

  try {
    deleteNguoiThueErrorMessage.value = ''

    await api.delete(`/nguoi-thue/${id}`)

    closeDeleteNguoiThueModal()

    if (editingNguoiThueId.value === id) {
      resetNguoiThueForm()
    }

    await loadData()
  } catch (error: any) {
    console.error('Không thể xóa người thuê:', error)

    deleteNguoiThueErrorMessage.value =
      error?.response?.data?.message ??
      'Không thể xóa người thuê. Vui lòng thử lại.'
  }
}

async function saveGiuong() {
  const payload = {
    maGiuong: giuongForm.value.maGiuong,
    trangThai: giuongForm.value.trangThai,
    phong: {
      id: giuongForm.value.phongId,
    },
  }

  try {
    if (editingGiuongId.value) {
      await api.patch(`/giuong/${editingGiuongId.value}`, payload)
    } else {
      await api.post('/giuong', payload)
    }

    resetGiuongForm()
    await loadData()
  } catch (error: any) {
    console.error('Không thể lưu giường:', error)

    alert(
      error?.response?.data?.message ??
      'Không thể lưu giường. Vui lòng thử lại.'
    )
  }
}

function requestDeleteGiuong(item: any) {
  deleteGiuongInfo.value = {
    id: item.id,
    maGiuong: String(item.maGiuong ?? ''),
    maPhong: item.phong?.maPhong ?? '',
  }

  deleteGiuongErrorMessage.value = ''
  showDeleteGiuongModal.value = true
}

function closeDeleteGiuongModal() {
  showDeleteGiuongModal.value = false
  deleteGiuongErrorMessage.value = ''
}

async function confirmDeleteGiuong() {
  const id = deleteGiuongInfo.value.id

  if (!id) {
    return
  }

  try {
    deleteGiuongErrorMessage.value = ''

    await api.delete(`/giuong/${id}`)

    closeDeleteGiuongModal()

    if (editingGiuongId.value === id) {
      resetGiuongForm()
    }

    await loadData()
  } catch (error: any) {
    console.error('Không thể xóa giường:', error)

    deleteGiuongErrorMessage.value =
      error?.response?.data?.message ??
      'Không thể xóa giường. Vui lòng thử lại.'
  }
}

function handleCccdMatTruocChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null

  if (cccdMatTruocPreviewUrl.value) {
    URL.revokeObjectURL(cccdMatTruocPreviewUrl.value)
  }

  nguoiThueForm.value.cccdMatTruoc = file

  if (file) {
    cccdMatTruocPreviewUrl.value = URL.createObjectURL(file)
  } else {
    cccdMatTruocPreviewUrl.value = ''
  }
}

function handleCccdMatSauChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null

  if (cccdMatSauPreviewUrl.value) {
    URL.revokeObjectURL(cccdMatSauPreviewUrl.value)
  }

  nguoiThueForm.value.cccdMatSau = file

  if (file) {
    cccdMatSauPreviewUrl.value = URL.createObjectURL(file)
  } else {
    cccdMatSauPreviewUrl.value = ''
  }
}

async function saveNguoiThue() {
  const formData = new FormData()

  formData.append(
    'hoTen',
    nguoiThueForm.value.hoTen,
  )

  formData.append(
    'cccd',
    nguoiThueForm.value.cccd,
  )

  formData.append(
    'sdt',
    nguoiThueForm.value.sdt,
  )

  formData.append(
    'email',
    nguoiThueForm.value.email,
  )

  formData.append(
    'diaChi',
    nguoiThueForm.value.diaChi,
  )

  formData.append(
    'ngaySinh',
    nguoiThueForm.value.ngaySinh,
  )

  formData.append(
    'bienSoXe',
    nguoiThueForm.value.bienSoXe,
  )

  if (nguoiThueForm.value.cccdMatTruoc) {
    formData.append(
      'cccdMatTruoc',
      nguoiThueForm.value.cccdMatTruoc,
    )
  }

  if (nguoiThueForm.value.cccdMatSau) {
    formData.append(
      'cccdMatSau',
      nguoiThueForm.value.cccdMatSau,
    )
  }

  try {
    if (editingNguoiThueId.value) {
      await api.patch(
        `/nguoi-thue/${editingNguoiThueId.value}`,
        formData,
      )
    } else {
      await api.post(
        '/nguoi-thue',
        formData,
      )
    }

    // Lưu thành công -> clear toàn bộ form,
    // bao gồm cả 2 input file
    resetNguoiThueForm()

    await loadData()
  } catch (error: any) {
    console.error(
      'Không thể lưu người thuê:',
      error,
    )

    alert(
      error?.response?.data?.message ??
      'Không thể lưu thông tin người thuê. Vui lòng thử lại.',
    )
  }
}

async function saveHopDong() {
  if (!hopDongForm.value.maHopDong) {
    syncHopDongCode()
  }

  const payload = {
    maHopDong: hopDongForm.value.maHopDong,
    ngayBatDau:
      hopDongForm.value.ngayBatDau ||
      new Date().toISOString().slice(0, 10),
    ngayKetThuc:
      hopDongForm.value.ngayKetThuc || null,
    tienThue: Number(hopDongForm.value.tienThue || 0),
    chuKyThanhToan: Number(
      hopDongForm.value.chuKyThanhToan || 1,
    ),
    tienDatCoc: Number(
      hopDongForm.value.tienDatCoc || 0,
    ),
    ghiChu: hopDongForm.value.ghiChu || null,
    trangThai: hopDongForm.value.trangThai,
    giuong: {
      id: hopDongForm.value.giuongId,
    },
    nguoiThue: {
      id: hopDongForm.value.nguoiThueId,
    },
  }

  if (editingHopDongId.value) {
    await api.patch(
      `/hop-dong/${editingHopDongId.value}`,
      payload,
    )
  } else {
    await api.post('/hop-dong', payload)
  }

  resetHopDongForm()
  await loadData()
}

async function saveHoaDon() {
  if (!hoaDonForm.value.maHoaDon) {
    syncHoaDonCode()
  }

  const payload = {
    ...hoaDonForm.value,
    thangThanhToan: hoaDonForm.value.thangThanhToan || new Date().toISOString().slice(0, 10),
    hopDong: { id: hoaDonForm.value.hopDongId },
  }

  if (editingHoaDonId.value) {
    await api.patch(`/hoa-don/${editingHoaDonId.value}`, payload)
  } else {
    await api.post('/hoa-don', payload)
  }
  resetHoaDonForm()
  await loadData()
}

const showDeleteNhaTroModal = ref(false)
const showDeleteGiuongModal = ref(false)
const showDeletePhongModal = ref(false)

const deleteGiuongInfo = ref({
  id: '',
  maGiuong: '',
  maPhong: '',
})
const showDeleteNguoiThueModal = ref(false)

const deleteNguoiThueInfo = ref({
  id: '',
  hoTen: '',
  cccd: '',
})

const deleteNguoiThueErrorMessage = ref('')
const deleteGiuongErrorMessage = ref('')

const deletePhongInfo = ref({
  id: '',
  maPhong: '',
  tenNhaTro: '',
  soGiuong: 0,
})

const deletePhongErrorMessage = ref('')
const deleteNhaTroInfo = ref({
  id: '',
  tenNhaTro: '',
  soPhong: 0,
  soGiuong: 0,
  soHopDong: 0,
  soHoaDon: 0,
})

const deleteErrorMessage = ref('')

function closeDeleteNhaTroModal() {
  showDeleteNhaTroModal.value = false
  deleteErrorMessage.value = ''
}

async function deleteNhaTro(id: string) {
  try {
    deleteErrorMessage.value = ''

    const nhaTro = nhaTros.value.find((item) => item.id === id)

    deleteNhaTroInfo.value = {
      id,
      tenNhaTro: nhaTro?.tenNhaTro ?? 'Nhà trọ',
      soPhong: 0,
      soGiuong: 0,
      soHopDong: 0,
      soHoaDon: 0,
    }

    await api.delete(`/nha-tro/${id}`)

    closeDeleteNhaTroModal()

    if (editingNhaTroId.value === id) {
      resetNhaTroForm()
    }

    await loadData()
  } catch (error: any) {
    if (error.response?.status === 409) {
      const responseData = error.response?.data

      const data = responseData?.data ?? {}

      deleteNhaTroInfo.value = {
        id,
        tenNhaTro:
          data.tenNhaTro ??
          nhaTros.value.find((item) => item.id === id)?.tenNhaTro ??
          'Nhà trọ',
        soPhong: Number(data.soPhong ?? 0),
        soGiuong: Number(data.soGiuong ?? 0),
        soHopDong: Number(data.soHopDong ?? 0),
        soHoaDon: Number(data.soHoaDon ?? 0),
      }

      deleteErrorMessage.value =
        responseData?.message ??
        'Không thể xóa nhà trọ vì đang có dữ liệu liên quan.'

      showDeleteNhaTroModal.value = true

      return
    }

    console.error('Không thể xóa nhà trọ:', error)

    deleteErrorMessage.value =
      error.response?.data?.message ??
      'Có lỗi xảy ra khi xóa nhà trọ.'

    showDeleteNhaTroModal.value = true
  }
}

function requestDeleteNhaTro(item: any) {
  deleteNhaTroInfo.value = {
    id: item.id,
    tenNhaTro: item.tenNhaTro ?? 'Nhà trọ',
    soPhong: 0,
    soGiuong: 0,
    soHopDong: 0,
    soHoaDon: 0,
  }

  deleteErrorMessage.value = ''
  showDeleteNhaTroModal.value = true
}

async function confirmDeleteNhaTro() {
  const id = deleteNhaTroInfo.value.id

  if (!id) {
    return
  }

  await deleteNhaTro(id)
}

function editNhaTro(item: any) {
  editingNhaTroId.value = item.id
  nhaTroForm.value = {
    maNhaTro: item.maNhaTro ?? '',
    tenNhaTro: item.tenNhaTro ?? '',
    diaChi: item.diaChi ?? '',
    soTang: item.soTang ?? 1,
    moTa: item.moTa ?? '',
  }
  currentTab.value = 'nhaTro'
}

function editPhong(item: any) {
  editingPhongId.value = item.id
  phongForm.value = {
    maPhong: item.maPhong ?? '',
    tangSo: item.tangSo ?? '',
    soGiuongToiDa: item.soGiuongToiDa ?? 8,
    loaiPhong: item.loaiPhong ?? 'phong_tieu_chuan',
    dienTich: item.dienTich ?? 25,
    nhaTroId: item.nhaTro?.id ?? '',
  }
  currentTab.value = 'phong'
}

function editGiuong(item: any) {
  editingGiuongId.value = item.id

  giuongForm.value = {
    nhaTroId: item.phong?.nhaTro?.id ?? '',
    phongId: item.phong?.id ?? '',
    maGiuong: item.maGiuong != null
      ? String(item.maGiuong)
      : '',
    trangThai: item.trangThai ?? 'trong',
  }

  currentTab.value = 'giuong'
}

function editNguoiThue(item: any) {
  editingNguoiThueId.value = item.id

  nguoiThueForm.value = {
    hoTen: item.hoTen ?? '',
    cccd: item.cccd ?? '',
    sdt: item.sdt ?? '',
    email: item.email ?? '',
    diaChi: item.diaChi ?? '',
    ngaySinh: item.ngaySinh
      ? new Date(item.ngaySinh).toISOString().slice(0, 10)
      : '',
    bienSoXe: item.bienSoXe ?? '',

    // File mới, chưa chọn
    cccdMatTruoc: null,
    cccdMatSau: null,

    // Giữ lại URL ảnh đã upload
    cccdMatTruocUrl: getImageUrl(item.cccdMatTruoc),
    cccdMatSauUrl: getImageUrl(item.cccdMatSau),
  }

  if (cccdMatTruocInput.value) {
    cccdMatTruocInput.value.value = ''
  }

  if (cccdMatSauInput.value) {
    cccdMatSauInput.value.value = ''
  }

  currentTab.value = 'nguoiThue'
}

function editHopDong(item: any) {
  editingHopDongId.value = item.id

  hopDongForm.value = {
    maHopDong: item.maHopDong ?? '',

    ngayBatDau: item.ngayBatDau
      ? new Date(item.ngayBatDau)
          .toISOString()
          .slice(0, 10)
      : '',

    ngayKetThuc: item.ngayKetThuc
      ? new Date(item.ngayKetThuc)
          .toISOString()
          .slice(0, 10)
      : '',

    tienThue: Number(item.tienThue ?? 0),

    chuKyThanhToan: Number(
      item.chuKyThanhToan ?? 1,
    ),

    tienDatCoc: Number(
      item.tienDatCoc ?? 0,
    ),

    ghiChu: item.ghiChu ?? '',

    giuongId: item.giuong?.id ?? '',

    nguoiThueId: item.nguoiThue?.id ?? '',

    trangThai: item.trangThai ?? 'active',
  }

  currentTab.value = 'hopDong'
}

function editHoaDon(item: any) {
  editingHoaDonId.value = item.id
  hoaDonForm.value = {
    maHoaDon: item.maHoaDon ?? '',
    thangThanhToan: item.thangThanhToan ? new Date(item.thangThanhToan).toISOString().slice(0, 10) : '',
    tongTien: item.tongTien ?? 0,
    trangThai: item.trangThai ?? 'chua_thanh_toan',
    hopDongId: item.hopDong?.id ?? '',
  }
  currentTab.value = 'hoaDon'
}

function formatCurrency(value: number | string | undefined) {
  const numberValue = Number(value ?? 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numberValue)
}

const filteredPhongsByNhaTro = computed(() => {
  if (!giuongForm.value.nhaTroId) return []
  return phongs.value.filter((item) => item.nhaTro?.id === giuongForm.value.nhaTroId)
})

function handleNhaTroChangeForGiuong() {
  const selectedPhongStillValid = filteredPhongsByNhaTro.value.some(
    (item) => item.id === giuongForm.value.phongId
  )

  if (!selectedPhongStillValid) {
    giuongForm.value.phongId = ''
  }

  // Khi đổi nhà trọ thì reset mã giường
  giuongForm.value.maGiuong = ''
}

function normalizeCodePart(value: string) {
  return (value ?? '')
    .toString()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function generateHopDongCode(giuongId: string) {
  const giuong = giuongs.value.find((item) => item.id === giuongId)
  if (!giuong?.phong) return ''

  const nhaTroName = normalizeCodePart(giuong.phong.nhaTro?.tenNhaTro || nhaTros.value.find((item) => item.id === giuong.phong?.nhaTro?.id)?.tenNhaTro || 'NhaTro')
  const tangSo = normalizeCodePart(giuong.phong.maPhong || 'Tầng')
  const soGiuong = normalizeCodePart(giuong.maGiuong || '1')
  const prefix = `${nhaTroName}_${tangSo}_${soGiuong}`
  const sequence = hopDongs.value.filter((item) => item.maHopDong?.startsWith(prefix + '_')).length + 1
  return `${prefix}_${sequence}`
}

function generateHoaDonCode(hopDongId: string, thangThanhToan: string) {
  const hopDong = hopDongs.value.find((item) => item.id === hopDongId)
  if (!hopDong?.maHopDong) return ''
  const month = thangThanhToan ? new Date(thangThanhToan).toISOString().slice(0, 7) : new Date().toISOString().slice(0, 7)
  return `${hopDong.maHopDong}_${month}`
}

function syncHopDongCode() {
  if (!hopDongForm.value.giuongId) {
    hopDongForm.value.maHopDong = ''
    return
  }
  hopDongForm.value.maHopDong = generateHopDongCode(hopDongForm.value.giuongId)
}

function syncHoaDonCode() {
  if (!hoaDonForm.value.hopDongId) {
    hoaDonForm.value.maHoaDon = ''
    return
  }
  hoaDonForm.value.maHoaDon = generateHoaDonCode(hoaDonForm.value.hopDongId, hoaDonForm.value.thangThanhToan)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">N</div>
        <div>
          <h1>Nhà Trọ</h1>
          <small>Quản lý</small>
        </div>
      </div>

      <nav class="nav">
        <button
          v-for="tab in tabs"
          :key="tab"
          :class="['nav-item', { active: currentTab === tab }]"
          @click="currentTab = tab"
        >
          {{ tab === 'dashboard' ? 'Tổng quan' : tab === 'nhaTro' ? 'Nhà trọ' : tab === 'phong' ? 'Phòng' : tab === 'giuong' ? 'Giường' : tab === 'nguoiThue' ? 'Người thuê' : tab === 'hopDong' ? 'Hợp đồng' : 'Hóa đơn' }}
        </button>
      </nav>
    </aside>

    <main class="content">
      <header class="topbar">
        <div>
          <p class="eyebrow">Hệ thống</p>
          <h2>Quản lý nhà trọ</h2>
        </div>
        <button class="primary" @click="loadData">Làm mới dữ liệu</button>
      </header>

      <section v-if="currentTab === 'dashboard'" class="panel-grid">
        <div class="metric-card metric-nhatro highlight">
          <div class="metric-decor" aria-hidden="true"></div>
          <div class="metric-body">
            <span>Nhà trọ</span>
            <strong>{{ summary.totalNhaTro }}</strong>
          </div>
        </div>
        <div class="metric-card metric-phong">
          <div class="metric-decor" aria-hidden="true"></div>
          <div class="metric-body">
            <span>Phòng</span>
            <strong>{{ summary.totalPhong }}</strong>
          </div>
        </div>
        <div class="metric-card metric-giuong">
          <div class="metric-decor" aria-hidden="true"></div>
          <div class="metric-body">
            <span>Giường</span>
            <strong>{{ summary.totalGiuong }}</strong>
          </div>
        </div>
        <div class="metric-card metric-hopdong">
          <div class="metric-decor" aria-hidden="true"></div>
          <div class="metric-body">
            <span>Hợp đồng</span>
            <strong>{{ summary.totalHopDong }}</strong>
          </div>
        </div>
        <div class="metric-card metric-hoadon">
          <div class="metric-decor" aria-hidden="true"></div>
          <div class="metric-body">
            <span>Hóa đơn</span>
            <strong>{{ summary.totalHoaDon }}</strong>
          </div>
        </div>
      </section>

      <section v-else-if="currentTab === 'nhaTro'" class="panel-grid">
        <div class="panel">
          <h3>{{ editingNhaTroId ? 'Sửa nhà trọ' : 'Thêm nhà trọ' }}</h3>
          <form @submit.prevent="saveNhaTro" class="form-grid">
            <label>
  {{ requiredLabel('Mã nhà trọ') }}
  <input
    v-model="nhaTroForm.maNhaTro"
    placeholder="Ví dụ: CG"
    required
  />
</label>
            <label>
              {{ requiredLabel('Tên nhà trọ') }}
              <input v-model="nhaTroForm.tenNhaTro" placeholder="Tên nhà trọ" required />
            </label>
            <label>
              {{ requiredLabel('Địa chỉ') }}
              <input v-model="nhaTroForm.diaChi" placeholder="Địa chỉ" required />
            </label>
            <label>
              {{ requiredLabel('Số tầng') }}
              <input v-model.number="nhaTroForm.soTang" type="number" min="1" placeholder="Số tầng" required />
            </label>
            <label>
              {{ requiredLabel('Mô tả') }}
              <textarea v-model="nhaTroForm.moTa" placeholder="Mô tả" rows="3"></textarea>
            </label>
            <div class="actions">
              <button class="primary" type="submit">{{ editingNhaTroId ? 'Cập nhật' : 'Lưu' }}</button>
              <button class="secondary" type="button" @click="resetNhaTroForm">Hủy</button>
            </div>
          </form>
        </div>

        <div class="panel">
          <h3>Danh sách nhà trọ</h3>
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
              <tr v-for="item in nhaTros" :key="item.id">
                <td>{{ item.maNhaTro }}</td>
                <td>{{ item.tenNhaTro }}</td>
                <td>{{ item.diaChi }}</td>
                <td>{{ item.soTang }}</td>
                <td class="row-actions">
                  <button class="table-btn edit" @click="editNhaTro(item)">Sửa</button>
                  <button
  class="table-btn delete"
  @click="requestDeleteNhaTro(item)"
>
  Xóa
</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="currentTab === 'phong'" class="panel-grid">
        <div class="panel">
          <h3>{{ editingPhongId ? 'Sửa phòng' : 'Thêm phòng' }}</h3>
          <form @submit.prevent="savePhong" class="form-grid">
            <label>
  {{ requiredLabel('Nhà trọ') }}
  <select
    v-model="phongForm.nhaTroId"
    @change="handleNhaTroChange"
    required
  >
    <option value="">Chọn nhà trọ</option>
    <option
      v-for="item in nhaTros"
      :key="item.id"
      :value="item.id"
    >
      {{ item.tenNhaTro }}
    </option>
  </select>
</label>

<label>
  {{ requiredLabel('Tầng số') }}

  <select
    v-model="phongForm.tangSo"
    required
    :disabled="!phongForm.nhaTroId"
  >
    <option value="" disabled>
      -- Chọn tầng --
    </option>

    <option
      v-for="floor in tangSoOptions"
      :key="floor"
      :value="floor"
    >
      Tầng {{ floor }}
    </option>
  </select>
</label>
            <label>
              {{ requiredLabel('Số giường tối đa') }}
              <input v-model.number="phongForm.soGiuongToiDa" type="number" min="1" max="8" placeholder="Số giường tối đa" required />
            </label>
            <label>
              {{ requiredLabel('Loại phòng') }}
              <input v-model="phongForm.loaiPhong" placeholder="Loại phòng" required />
            </label>
            <label>
              {{ requiredLabel('Diện tích') }}
              <input v-model.number="phongForm.dienTich" type="number" min="1" placeholder="Diện tích" required />
            </label>
            <div class="actions">
              <button class="primary" type="submit">{{ editingPhongId ? 'Cập nhật' : 'Lưu' }}</button>
              <button class="secondary" type="button" @click="resetPhongForm">Hủy</button>
            </div>
          </form>
        </div>

        <div class="panel">
          <h3>Danh sách phòng</h3>
          <table>
            <thead>
              <tr>
                <th>Mã phòng</th>
                <th>Nhà trọ</th>
                <th>Tầng số</th>
                <th>Loại</th>
                <th>Số giường</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in phongs" :key="item.id">
                    <td>
      {{ item.maPhong }}
    </td>

    <td>
      {{ item.nhaTro?.tenNhaTro || item.nhaTro?.maNhaTro}}
    </td>
                <td>{{ item.tangSo }}</td>
                <td>{{ item.loaiPhong }}</td>
                <td>{{ item.soGiuongToiDa }}</td>
                <td class="row-actions">
                  <button class="table-btn edit" @click="editPhong(item)">Sửa</button>
                  <button
  type="button"
  class="table-btn delete"
  @click.stop="requestDeletePhong(item)"
>
  Xóa
</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="currentTab === 'giuong'" class="panel-grid">
        <div class="panel">
          <h3>{{ editingGiuongId ? 'Sửa giường' : 'Thêm giường' }}</h3>
          <form @submit.prevent="saveGiuong" class="form-grid">
            <label>
              {{ requiredLabel('Nhà trọ') }}
              <select v-model="giuongForm.nhaTroId" @change="handleNhaTroChangeForGiuong" required>
                <option value="">Chọn nhà trọ</option>
                <option v-for="item in nhaTros" :key="item.id" :value="item.id">{{ item.tenNhaTro }}</option>
              </select>
            </label>
            <label>
              {{ requiredLabel('Phòng') }}
              <select v-model="giuongForm.phongId" :disabled="!giuongForm.nhaTroId" @change="giuongForm.maGiuong = ''" required>
                <option value="">Chọn phòng</option>
                <option v-for="item in filteredPhongsByNhaTro" :key="item.id" :value="item.id">{{ item.maPhong }}</option>
              </select>
            </label>
            <label>
              {{ requiredLabel('Mã giường') }}
              <select
  v-model="giuongForm.maGiuong"
  :disabled="editingGiuongId !== null"
  required
>
  <option value="">Chọn mã giường</option>

  <option
    v-for="item in giuongOptions"
    :key="item"
    :value="item"
  >
    {{ item }}
  </option>
</select>
            </label>
            <label>
              {{ requiredLabel('Trạng thái') }}
              <select v-model="giuongForm.trangThai">
                <option value="trong">Trống</option>
                <option value="da_thue">Đã thuê</option>
                <option value="bao_tri">Bảo trì</option>
                <option value="sap_tra_tro">Sắp trả trọ</option>
              </select>
            </label>
            <div class="actions">
              <button class="primary" type="submit">{{ editingGiuongId ? 'Cập nhật' : 'Lưu' }}</button>
              <button class="secondary" type="button" @click="resetGiuongForm">Hủy</button>
            </div>
          </form>
        </div>

        <div class="panel">
          <h3>Danh sách giường</h3>
          <table>
            <thead>
              <tr>
                <th>Phòng</th>
                <th>Mã giường</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in giuongs" :key="item.id">
                <td>{{ item.phong?.maPhong }}</td>
                <td>{{ item.maGiuong }}</td>
                <td>{{ getStatusText(item.trangThai) }}</td>
                <td class="row-actions">
                  <button class="table-btn edit" @click="editGiuong(item)">Sửa</button>
                  <button
  type="button"
  class="table-btn delete"
  @click.stop="requestDeleteGiuong(item)"
>
  Xóa
</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="currentTab === 'nguoiThue'" class="panel-grid">
        <div class="panel">
          <h3>{{ editingNguoiThueId ? 'Sửa người thuê' : 'Thêm người thuê' }}</h3>
          <form @submit.prevent="saveNguoiThue" class="form-grid">
            <label>
              {{ requiredLabel('Họ tên') }}
              <input v-model="nguoiThueForm.hoTen" placeholder="Họ tên" required />
            </label>
            <label>
              {{ requiredLabel('CCCD') }}
              <input v-model="nguoiThueForm.cccd" placeholder="CCCD" required pattern="[0-9]{9,12}" />
            </label>
            <label>
              {{ requiredLabel('Số điện thoại') }}
              <input v-model="nguoiThueForm.sdt" placeholder="Số điện thoại" type="tel" required pattern="[0-9]{10,11}" />
            </label>
            <label>
              {{ requiredLabel('Email') }}
              <input v-model="nguoiThueForm.email" type="email" placeholder="Email" required />
            </label>
            <label>
              {{ requiredLabel('Địa chỉ') }}
              <input v-model="nguoiThueForm.diaChi" placeholder="Địa chỉ" required />
            </label>
            <label>
              {{ requiredLabel('Ngày sinh') }}
              <input v-model="nguoiThueForm.ngaySinh" type="date" required />
            </label>
            <label>
  Biển số xe
  <input
    v-model="nguoiThueForm.bienSoXe"
    type="text"
    placeholder="Ví dụ: 29A-123.45"
  />
</label>

<label>
  CCCD mặt trước

  <input
    ref="cccdMatTruocInput"
    type="file"
    accept="image/*"
    @change="handleCccdMatTruocChange"
  />

<div
  v-if="editingNguoiThueId && nguoiThueForm.cccdMatTruocUrl"
  class="cccd-current"
>
  <span>Ảnh hiện tại:</span>

  <a
    :href="nguoiThueForm.cccdMatTruocUrl"
    target="_blank"
    rel="noopener noreferrer"
  >
    Xem CCCD mặt trước
  </a>
</div>

<div v-if="cccdMatTruocPreviewUrl" class="cccd-current">
  <span>Ảnh mới:</span>

  <a
    :href="cccdMatTruocPreviewUrl"
    target="_blank"
    rel="noopener noreferrer"
  >
    Xem CCCD mặt trước
  </a>
</div>
</label>

<label>
  CCCD mặt sau

  <input
    ref="cccdMatSauInput"
    type="file"
    accept="image/*"
    @change="handleCccdMatSauChange"
  />

<div
  v-if="editingNguoiThueId && nguoiThueForm.cccdMatSauUrl"
  class="cccd-current"
>
  <span>Ảnh hiện tại:</span>

  <a
    :href="nguoiThueForm.cccdMatSauUrl"
    target="_blank"
    rel="noopener noreferrer"
  >
    Xem CCCD mặt sau
  </a>
</div>

<div v-if="cccdMatSauPreviewUrl" class="cccd-current">
  <span>Ảnh mới:</span>

  <a
    :href="cccdMatSauPreviewUrl"
    target="_blank"
    rel="noopener noreferrer"
  >
    Xem CCCD mặt sau
  </a>
</div>
</label>
            <div class="actions">
              <button class="primary" type="submit">{{ editingNguoiThueId ? 'Cập nhật' : 'Lưu' }}</button>
              <button class="secondary" type="button" @click="resetNguoiThueForm">Hủy</button>
            </div>
          </form>
        </div>

        <div class="panel">
          <h3>Danh sách người thuê</h3>
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>CCCD</th>
                <th>Số điện thoại</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in nguoiThues" :key="item.id">
                <td>{{ item.hoTen }}</td>
                <td>{{ item.cccd }}</td>
                <td>{{ item.sdt }}</td>
                <td class="row-actions">
                  <button class="table-btn edit" @click="editNguoiThue(item)">Sửa</button>
                  <button class="table-btn delete" @click="requestDeleteNguoiThue(item)">Xóa</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="currentTab === 'hopDong'" class="panel-grid">
        <div class="panel">
          <h3>{{ editingHopDongId ? 'Sửa hợp đồng' : 'Thêm hợp đồng' }}</h3>
          <form @submit.prevent="saveHopDong" class="form-grid">
            <label>
              {{ requiredLabel('Giường') }}
              <select v-model="hopDongForm.giuongId" @change="syncHopDongCode" required>
                <option value="">Chọn giường</option>
                <option v-for="item in giuongs" :key="item.id" :value="item.id">{{ item.maGiuong }} - {{ item.phong?.maPhong }}</option>
              </select>
            </label>
            <label>
              {{ requiredLabel('Người thuê') }}
              <select v-model="hopDongForm.nguoiThueId" required>
                <option value="">Chọn người thuê</option>
                <option v-for="item in nguoiThues" :key="item.id" :value="item.id">{{ item.hoTen }}</option>
              </select>
            </label>
            <label>
  {{ requiredLabel('Ngày bắt đầu') }}
  <input
    v-model="hopDongForm.ngayBatDau"
    type="date"
    required
  />
</label>

<label>
  Ngày kết thúc
  <input
    v-model="hopDongForm.ngayKetThuc"
    type="date"
  />
</label>

<label>
  {{ requiredLabel('Giá thuê trọn gói') }}
  <div class="currency-input">
    <input
      v-model.number="hopDongForm.tienThue"
      type="number"
      min="0"
      step="1000"
      placeholder="Giá thuê trọn gói"
      required
    />
    <span>VND</span>
  </div>
</label>

<label>
  {{ requiredLabel('Chu kỳ thanh toán') }}
  <select
    v-model.number="hopDongForm.chuKyThanhToan"
    required
  >
    <option :value="1">Hàng tháng</option>
    <option :value="3">3 tháng</option>
    <option :value="6">6 tháng</option>
    <option :value="12">12 tháng</option>
  </select>
</label>

<label>
  Đặt cọc
  <div class="currency-input">
    <input
      v-model.number="hopDongForm.tienDatCoc"
      type="number"
      min="0"
      step="1000"
      placeholder="Số tiền đặt cọc"
    />
    <span>VND</span>
  </div>
</label>

<label>
  {{ requiredLabel('Trạng thái') }}
  <select v-model="hopDongForm.trangThai">
    <option value="active">Có hiệu lực</option>
    <option value="expired">Hết hiệu lực</option>
    <option value="expired">Sắp hết hợp đồng</option>
  </select>
</label>

<label class="full-width">
  Ghi chú
  <textarea
    v-model="hopDongForm.ghiChu"
    rows="3"
    placeholder="Nhập ghi chú cho hợp đồng..."
  ></textarea>
</label>
            <div class="actions">
              <button class="primary" type="submit">{{ editingHopDongId ? 'Cập nhật' : 'Lưu' }}</button>
              <button class="secondary" type="button" @click="resetHopDongForm">Hủy</button>
            </div>
          </form>
        </div>

        <div class="panel">
          <h3>Danh sách hợp đồng</h3>
          <table>
            <thead>
              <tr>
                <th>Mã hợp đồng</th>
                <th>Người thuê</th>
                <th>Giường</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Giá thuê</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in hopDongs" :key="item.id">
                <td>{{ item.maHopDong }}</td>
                <td>{{ item.nguoiThue?.hoTen }}</td>
                <td>{{ item.giuong?.maGiuong }}</td>
                <td>
  {{ item.ngayBatDau
    ? new Date(item.ngayBatDau).toLocaleDateString('vi-VN')
    : ''
  }}
                </td>
                <td>
  {{ item.ngayKetThuc
    ? new Date(item.ngayKetThuc).toLocaleDateString('vi-VN')
    : 'Không xác định'
  }}
                </td>
                <td>{{ formatCurrency(item.tienThue) }}</td>
                <td class="row-actions">
                  <button class="table-btn edit" @click="editHopDong(item)">Sửa</button>
                  <button class="table-btn delete" @click="deleteItem('hop-dong', item.id)">Xóa</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="currentTab === 'hoaDon'" class="panel-grid">
        <div class="panel">
          <h3>{{ editingHoaDonId ? 'Sửa hóa đơn' : 'Thêm hóa đơn' }}</h3>
          <form @submit.prevent="saveHoaDon" class="form-grid">
            <label>
              {{ requiredLabel('Hợp đồng') }}
              <select v-model="hoaDonForm.hopDongId" @change="syncHoaDonCode" required>
                <option value="">Chọn hợp đồng</option>
                <option v-for="item in hopDongs" :key="item.id" :value="item.id">{{ item.maHopDong }}</option>
              </select>
            </label>
            <label>
              {{ requiredLabel('Tháng thanh toán') }}
              <input v-model="hoaDonForm.thangThanhToan" type="date" @change="syncHoaDonCode" required />
            </label>
            <label>
              {{ requiredLabel('Tổng tiền') }}
              <input v-model.number="hoaDonForm.tongTien" type="number" min="0" placeholder="Tổng tiền" required />
            </label>
            <label>
              {{ requiredLabel('Trạng thái') }}
              <select v-model="hoaDonForm.trangThai">
                <option value="chua_thanh_toan">Chưa thanh toán</option>
                <option value="da_thanh_toan">Đã thanh toán</option>
              </select>
            </label>
            <div class="actions">
              <button class="primary" type="submit">{{ editingHoaDonId ? 'Cập nhật' : 'Lưu' }}</button>
              <button class="secondary" type="button" @click="resetHoaDonForm">Hủy</button>
            </div>
          </form>
        </div>

        <div class="panel">
          <h3>Danh sách hóa đơn</h3>
          <table>
            <thead>
              <tr>
                <th>Mã hóa đơn</th>
                <th>Tháng</th>
                <th>Hợp đồng</th>
                <th>Tổng tiền</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in hoaDons" :key="item.id">
                <td>{{ item.maHoaDon }}</td>
                <td>{{ item.thangThanhToan ? new Date(item.thangThanhToan).toISOString().slice(0, 7) : '' }}</td>
                <td>{{ item.hopDong?.maHopDong }}</td>
                <td>{{ formatCurrency(item.tongTien) }}</td>
                <td class="row-actions">
                  <button class="table-btn edit" @click="editHoaDon(item)">Sửa</button>
                  <button class="table-btn delete" @click="deleteItem('hoa-don', item.id)">Xóa</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
        <!-- Modal xóa nhà trọ -->
    <div
      v-if="showDeleteNhaTroModal"
      class="modal-overlay"
      @click.self="closeDeleteNhaTroModal"
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
              {{ deleteNhaTroInfo.tenNhaTro }}
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
              <strong>Không thể xóa nhà trọ này!</strong>

              <p>
                Nhà trọ đang có dữ liệu liên quan.
                Bạn cần xử lý các dữ liệu này trước khi xóa.
              </p>
            </div>

            <div class="related-data">
              <div class="related-item">
                <span>Phòng</span>
                <strong>{{ deleteNhaTroInfo.soPhong }}</strong>
              </div>

              <div class="related-item">
                <span>Giường</span>
                <strong>{{ deleteNhaTroInfo.soGiuong }}</strong>
              </div>

              <div class="related-item">
                <span>Hợp đồng</span>
                <strong>{{ deleteNhaTroInfo.soHopDong }}</strong>
              </div>

              <div class="related-item">
                <span>Hóa đơn</span>
                <strong>{{ deleteNhaTroInfo.soHoaDon }}</strong>
              </div>
            </div>

            <p class="delete-modal-note">
              Việc xóa nhà trọ có thể ảnh hưởng đến các dữ liệu
              liên quan. Hãy xóa hoặc xử lý các dữ liệu liên quan
              trước khi thực hiện thao tác này.
            </p>
          </template>

          <template v-else>
            <p class="confirm-message">
              Bạn có chắc chắn muốn xóa nhà trọ
              <strong>{{ deleteNhaTroInfo.tenNhaTro }}</strong>?
            </p>

            <p class="delete-modal-note">
              Thao tác này không thể hoàn tác.
            </p>
          </template>

          <p
            v-if="deleteErrorMessage && deleteNhaTroInfo.soPhong === 0"
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
    <!-- Modal xóa phòng -->
<div
  v-if="showDeletePhongModal"
  class="modal-overlay"
  @click.self="closeDeletePhongModal"
>
  <div class="delete-modal">
    <!-- Header -->
    <div class="delete-modal-header">
      <div class="warning-icon">
        ⚠
      </div>

      <div>
        <h3>
          Xác nhận xóa phòng
        </h3>

        <p>
          {{ deletePhongInfo.maPhong }}
          <span v-if="deletePhongInfo.tenNhaTro">
            - {{ deletePhongInfo.tenNhaTro }}
          </span>
        </p>
      </div>
    </div>

    <!-- Body -->
    <div class="delete-modal-body">

      <template v-if="deletePhongInfo.soGiuong > 0">

        <div class="warning-message">
          <strong>Không thể xóa phòng này!</strong>

          <p>
            Phòng đang có dữ liệu giường liên quan.
            Bạn cần xử lý các dữ liệu này trước khi xóa.
          </p>
        </div>

        <div class="related-data">

          <div class="related-item">
            <span>Giường</span>

            <strong>
              {{ deletePhongInfo.soGiuong }}
            </strong>
          </div>

        </div>

        <p class="delete-modal-note">
          Hãy xóa hoặc xử lý các giường thuộc phòng
          trước khi thực hiện thao tác này.
        </p>

      </template>

      <template v-else>

        <p class="confirm-message">
          Bạn có chắc chắn muốn xóa phòng
          <strong>
            {{ deletePhongInfo.maPhong }}
          </strong>
          không?
        </p>

        <p class="delete-modal-note">
          Thao tác này không thể hoàn tác.
        </p>

      </template>

      <p
        v-if="deletePhongErrorMessage"
        class="error-message"
      >
        {{ deletePhongErrorMessage }}
      </p>

    </div>

    <!-- Footer -->
    <div class="delete-modal-actions">

      <button
        class="secondary"
        type="button"
        @click="closeDeletePhongModal"
      >
        Đóng
      </button>

      <button
        v-if="deletePhongInfo.soGiuong === 0"
        class="danger-button"
        type="button"
        @click="confirmDeletePhong"
      >
        Xác nhận xóa
      </button>

    </div>
  </div>
</div>
<!-- Modal xóa giường -->
<div
  v-if="showDeleteGiuongModal"
  class="modal-overlay"
  @click.self="closeDeleteGiuongModal"
>
  <div class="delete-modal">

    <!-- Header -->
    <div class="delete-modal-header">
      <div class="warning-icon">
        ⚠
      </div>

      <div>
        <h3>
          Xác nhận xóa giường
        </h3>

        <p>
          {{ deleteGiuongInfo.maGiuong }}
          <span v-if="deleteGiuongInfo.maPhong">
            - Phòng {{ deleteGiuongInfo.maPhong }}
          </span>
        </p>
      </div>
    </div>

    <!-- Body -->
    <div class="delete-modal-body">

      <p class="confirm-message">
        Bạn có chắc chắn muốn xóa giường
        <strong>
          {{ deleteGiuongInfo.maGiuong }}
        </strong>

        <span v-if="deleteGiuongInfo.maPhong">
          của phòng
          <strong>
            {{ deleteGiuongInfo.maPhong }}
          </strong>
        </span>

        không?
      </p>

      <p class="delete-modal-note">
        Thao tác này không thể hoàn tác.
      </p>

      <p
        v-if="deleteGiuongErrorMessage"
        class="error-message"
      >
        {{ deleteGiuongErrorMessage }}
      </p>

    </div>

    <!-- Footer -->
    <div class="delete-modal-actions">

      <button
        class="secondary"
        type="button"
        @click="closeDeleteGiuongModal"
      >
        Đóng
      </button>

      <button
        class="danger-button"
        type="button"
        @click="confirmDeleteGiuong"
      >
        Xác nhận xóa
      </button>

    </div>

  </div>
</div>
<!-- Modal xóa người thuê -->
<div
  v-if="showDeleteNguoiThueModal"
  class="modal-overlay"
  @click.self="closeDeleteNguoiThueModal"
>
  <div class="delete-modal">

    <div class="delete-modal-header">
      <div class="warning-icon">
        ⚠
      </div>

      <div>
        <h3>
          Xác nhận xóa người thuê
        </h3>

        <p>
          {{ deleteNguoiThueInfo.hoTen }}
          <span v-if="deleteNguoiThueInfo.cccd">
            - CCCD: {{ deleteNguoiThueInfo.cccd }}
          </span>
        </p>
      </div>
    </div>

    <div class="delete-modal-body">

      <p class="confirm-message">
        Bạn có chắc chắn muốn xóa người thuê
        <strong>
          {{ deleteNguoiThueInfo.hoTen }}
        </strong>
        không?
      </p>

      <p class="delete-modal-note">
        Thao tác này không thể hoàn tác.
      </p>

      <p
        v-if="deleteNguoiThueErrorMessage"
        class="error-message"
      >
        {{ deleteNguoiThueErrorMessage }}
      </p>

    </div>

    <div class="delete-modal-actions">

      <button
        class="secondary"
        type="button"
        @click="closeDeleteNguoiThueModal"
      >
        Đóng
      </button>

      <button
        class="danger-button"
        type="button"
        @click="confirmDeleteNguoiThue"
      >
        Xác nhận xóa
      </button>

    </div>

  </div>
</div>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  font-family: Inter, 'Segoe UI', sans-serif;
  color: #0f172a;
}

* {
  box-sizing: border-box;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: #0f172a;
  color: white;
  padding: 28px 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 30px;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  display: grid;
  place-items: center;
  font-weight: 700;
}

.brand h1 {
  margin: 0;
  font-size: 1.2rem;
}

.brand small {
  opacity: 0.7;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  border: none;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.08);
  color: white;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.nav-item.active {
  background: linear-gradient(135deg, #38bdf8, #2563eb);
}

.content {
  padding: 28px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.7rem;
  color: #64748b;
}

.topbar h2 {
  margin: 4px 0 0;
  font-size: 2rem;
}

.primary,
.secondary,
.table-btn {
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
}

.primary {
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  color: white;
}

.secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 22px;
}

.metric-card,
.panel {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;
}

.metric-card .metric-media {
  position: absolute;
  inset: 0;
  display: block;
}

.metric-card .metric-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0.12;
  transform: scale(1.02);
}

.metric-card .metric-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 2;
}

.metric-card .metric-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.0), rgba(255,255,255,0.0));
  z-index: 1;
}

.metric-card.highlight {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
}

.metric-card span {
  color: #475569;
}

.metric-card strong {
  font-size: 2rem;
}

/* Decorative colored blocks for metrics (no images) */
.metric-card .metric-decor {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 1;
  background-size: cover;
}

.metric-card.metric-nhatro .metric-decor {
  background-image: linear-gradient(135deg, #eff6ff, #dbeafe), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 10px);
}

.metric-card.metric-phong .metric-decor {
  background-image: linear-gradient(135deg, #fff7ed, #ffedd5), repeating-linear-gradient(180deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 8px);
}

.metric-card.metric-giuong .metric-decor {
  background-image: linear-gradient(135deg, #f0fdf4, #bbf7d0), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 12px);
}

.metric-card.metric-hopdong .metric-decor {
  background-image: linear-gradient(135deg, #fff1f2, #fed7e2), repeating-linear-gradient(180deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 6px);
}

.metric-card.metric-hoadon .metric-decor {
  background-image: linear-gradient(135deg, #f8fafc, #e6eef8), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 10px);
}

.full-width {
  grid-column: 1 / -1;
}

.nha-tro-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.nha-tro-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9));
  border: 1px solid rgba(148, 163, 184, 0.12);
  padding: 12px;
  border-radius: 12px;
}

.nha-tro-row {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.nha-tro-metric small {
  display: block;
  color: #64748b;
}

.nha-tro-metric strong {
  font-size: 1.25rem;
}

.panel h3 {
  margin-top: 0;
}

.relationship {
  font-size: 1.04rem;
  line-height: 1.7;
  margin: 0;
}

.form-grid {
  display: grid;
  gap: 12px;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 11px 12px;
  background: white;
}

textarea {
  resize: vertical;
}

.actions {
  display: flex;
  gap: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  table-layout: fixed;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Make tables scroll horizontally when container is too small */
.panel {
  overflow-x: auto;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
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

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    padding-bottom: 12px;
  }

  .content {
    padding: 16px;
  }
}
/* ================================
   MODAL XÓA NHÀ TRỌ
================================ */

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
}

.delete-modal {
  width: min(520px, 100%);

  background: white;
  border-radius: 18px;

  box-shadow:
    0 25px 50px rgba(15, 23, 42, 0.25),
    0 8px 20px rgba(15, 23, 42, 0.12);

  overflow: hidden;

  animation: modal-show 0.2s ease-out;
}

@keyframes modal-show {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.delete-modal-header {
  display: flex;
  align-items: center;
  gap: 14px;

  padding: 22px;

  border-bottom: 1px solid #e2e8f0;
}

.delete-modal-header h3 {
  margin: 0;

  font-size: 1.25rem;
  color: #0f172a;
}

.delete-modal-header p {
  margin: 5px 0 0;

  color: #64748b;
  font-size: 0.95rem;
}

.warning-icon {
  width: 46px;
  height: 46px;

  flex-shrink: 0;

  display: grid;
  place-items: center;

  border-radius: 50%;

  background: #fef3c7;
  color: #d97706;

  font-size: 1.5rem;
  font-weight: 700;
}

.delete-modal-body {
  padding: 22px;
}

.warning-message {
  padding: 14px 16px;

  border-radius: 12px;

  background: #fff7ed;
  border: 1px solid #fed7aa;

  color: #9a3412;
}

.warning-message strong {
  display: block;

  margin-bottom: 5px;
}

.warning-message p {
  margin: 0;

  line-height: 1.5;
}

.related-data {
  display: grid;

  grid-template-columns: repeat(2, 1fr);

  gap: 12px;

  margin-top: 16px;
}

.related-item {
  display: flex;

  align-items: center;
  justify-content: space-between;

  padding: 13px 15px;

  border-radius: 10px;

  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.related-item span {
  color: #475569;
}

.related-item strong {
  min-width: 32px;

  text-align: center;

  color: #dc2626;
  font-size: 1.1rem;
}

.delete-modal-note {
  margin: 16px 0 0;

  color: #64748b;

  font-size: 0.9rem;
  line-height: 1.5;
}

.confirm-message {
  margin: 0;

  font-size: 1rem;
  line-height: 1.6;
}

.confirm-message strong {
  color: #dc2626;
}

.error-message {
  margin-top: 14px;

  padding: 10px 12px;

  border-radius: 8px;

  background: #fee2e2;

  color: #b91c1c;

  font-size: 0.9rem;
}

.delete-modal-actions {
  display: flex;

  justify-content: flex-end;

  gap: 10px;

  padding: 16px 22px;

  border-top: 1px solid #e2e8f0;

  background: #f8fafc;
}

.danger-button {
  border: none;

  border-radius: 10px;

  padding: 10px 16px;

  cursor: pointer;

  font-weight: 600;

  background: #dc2626;
  color: white;

  transition: 0.2s ease;
}

.danger-button:hover {
  background: #b91c1c;
}

.currency-input {
  display: flex;
  align-items: center;
  position: relative;
}

.currency-input input {
  width: 100%;
  padding-right: 55px;
}

.currency-input span {
  position: absolute;
  right: 12px;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  pointer-events: none;
}

.full-width {
  grid-column: 1 / -1;
}

.full-width textarea {
  width: 100%;
  resize: vertical;
  min-height: 90px;
}

@media (max-width: 600px) {
  .related-data {
    grid-template-columns: 1fr;
  }

  .delete-modal-header {
    padding: 18px;
  }

  .delete-modal-body {
    padding: 18px;
  }

  .delete-modal-actions {
    padding: 14px 18px;
  }
}
</style>
