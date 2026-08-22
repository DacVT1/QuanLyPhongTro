export interface NhaTro {
  id: string;
  maNhaTro: string;
  tenNhaTro: string;
  diaChi: string;
  soTang: number;
  moTa?: string | null;
}

export interface NhaTroForm {
  maNhaTro: string;
  tenNhaTro: string;
  diaChi: string;
  soTang: number;
  moTa: string;
}

export interface DeleteNhaTroInfo {
  id: string;
  tenNhaTro: string;
  soPhong: number;
  soGiuong: number;
  soHopDong: number;
  soHoaDon: number;
}