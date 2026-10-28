// ===== Konteks store KateringKu =====
// Dipisah dari `store.tsx` (yang memuat komponen StoreProvider) supaya berkas
// ini hanya berisi tipe + hook. Jika digabung, React Refresh tidak bisa
// hot-reload dan selalu melakukan reload penuh tiap kali file disimpan
// (lihat rule react-refresh/only-export-components).
import { createContext, useContext } from 'react';
import type { Bahan, DB, Menu, Pelanggan, StatusPesanan } from './model';

// Bentuk data form pesanan (dipakai simpan baru & ubah)
export interface PayloadPesanan {
  pelangganId?: string;
  namaPelangganBaru?: string;
  tanggalKirim: string;
  dp: number;
  catatan: string;
  items: { menuId: string; jumlah: number }[];
}

export interface Store {
  db: DB;
  loading: boolean;
  error: string | null;
  bahanMap: Map<string, Bahan>;
  menuMap: Map<string, Menu>;
  pelangganMap: Map<string, Pelanggan>;
  tambahBahan: (b: Omit<Bahan, 'id'>) => Promise<Bahan>;
  ubahBahan: (id: string, patch: Partial<Bahan>) => Promise<void>;
  hapusBahan: (id: string) => Promise<void>;
  tambahMenu: (m: Omit<Menu, 'id'>) => Promise<void>;
  ubahMenu: (id: string, patch: Partial<Menu>) => Promise<void>;
  hapusMenu: (id: string) => Promise<void>;
  tambahPelanggan: (p: Omit<Pelanggan, 'id'>) => Promise<Pelanggan>;
  ubahPelanggan: (id: string, patch: Partial<Pelanggan>) => Promise<void>;
  hapusPelanggan: (id: string) => Promise<void>;
  tambahPesanan: (p: PayloadPesanan) => Promise<void>;
  ubahPesanan: (id: string, p: PayloadPesanan) => Promise<void>;
  ubahStatus: (id: string, s: StatusPesanan) => Promise<void>;
  ubahDp: (id: string, dp: number) => void;
  hapusPesanan: (id: string) => Promise<void>;
  muat: () => Promise<void>;
}

export const StoreCtx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(StoreCtx);
  if (!s) throw new Error('StoreProvider belum dipasang');
  return s;
}
