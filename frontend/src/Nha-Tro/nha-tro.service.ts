import api from "../services/api";
import type { NhaTro, NhaTroForm } from "./types";

export async function getNhaTros(): Promise<NhaTro[]> {
  const response = await api.get("/nha-tro");

  return response.data;
}

export async function createNhaTro(
  payload: NhaTroForm,
): Promise<NhaTro> {
  const response = await api.post("/nha-tro", payload);

  return response.data;
}

export async function updateNhaTro(
  id: string,
  payload: NhaTroForm,
): Promise<NhaTro> {
  const response = await api.patch(
    `/nha-tro/${id}`,
    payload,
  );

  return response.data;
}

export async function deleteNhaTro(
  id: string,
): Promise<void> {
  await api.delete(`/nha-tro/${id}`);
}