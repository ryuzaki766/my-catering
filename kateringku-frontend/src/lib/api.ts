// ===== KateringKu API Client =====
// Semua fetch ke backend melalui sini — token JWT otomatis terlampir

import type { CadanganPayload, HasilImporCadangan } from './cadangan';

const BASE = '/api'; // menggunakan Vite proxy → http://localhost:3001/api

export class ApiError extends Error {
  pesan: string;
  status: number;
  /** Bisa berisi apa pun (mis. objek validasi dari backend) — sengaja `unknown`. */
  details?: unknown;

  constructor(pesan: string, status: number, details?: unknown) {
    super(pesan);
    this.name = 'ApiError';
    this.pesan = pesan;
    this.status = status;
    this.details = details;
  }
}

/**
 * Ambil pesan error yang ramah untuk ditampilkan ke user.
 * - Error dari backend sudah berbentuk `ApiError` (pesan berbahasa Indonesia) → pakai apa adanya.
 * - Selain itu (gangguan jaringan, error tak terduga) → pesan generik dari pemanggil,
 *   supaya user tidak melihat "Failed to fetch" / "undefined".
 */
export function pesanError(err: unknown, fallback = 'Terjadi kesalahan'): string {
  if (err instanceof ApiError && err.pesan) return err.pesan;
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('kateringku-token');

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    // Jangan pernah pakai/simpan cache HTTP → respons selalu 200 segar (tanpa 304)
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => ({ pesan: 'Respons tidak valid dari server' }));

  if (!res.ok) {
    throw new ApiError(json.pesan ?? `Error ${res.status}`, res.status, json.details);
  }

  // Backend selalu membungkus respons dalam { sukses, data, pesan }
  return (json.data ?? json) as T;
}

// ===== Auth =====
export const authApi = {
  register: (email: string, password: string, nama_usaha: string) =>
    apiFetch<{ token: string; user: { id: string; email: string }; usaha: { id: string; nama: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, nama_usaha }) }
    ),
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: { id: string; email: string }; usaha: { id: string; nama: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  me: () =>
    apiFetch<{ user: { id: string; email: string }; usaha: { id: string; nama: string } | null }>('/auth/me'),
};

// ===== Bahan =====
// Backend mewajibkan field `harga_per_satuan` (bukan `harga`) dan hanya menerima
// satuan dasar: 'g' | 'ml' | 'butir'. Konversi dari kg/liter dilakukan di store.
export const bahanApi = {
  getAll: () => apiFetch<BahanAPI[]>('/bahan'),
  create: (b: { nama: string; satuan: string; harga_per_satuan: number }) =>
    apiFetch<BahanAPI>('/bahan', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<{ nama: string; satuan: string; harga_per_satuan: number }>) =>
    apiFetch<BahanAPI>(`/bahan/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string) => apiFetch<null>(`/bahan/${id}`, { method: 'DELETE' }),
};

// ===== Menu =====
// Backend tidak menyimpan `emoji` (tidak ada kolomnya di DB), jadi tidak dikirim.
export const menuApi = {
  getAll: () => apiFetch<MenuAPI[]>('/menu'),
  create: (m: { nama: string; harga_jual: number; aktif?: boolean }) =>
    apiFetch<MenuAPI>('/menu', { method: 'POST', body: JSON.stringify(m) }),
  update: (id: string, m: Partial<{ nama: string; harga_jual: number; aktif: boolean }>) =>
    apiFetch<MenuAPI>(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(m) }),
  delete: (id: string) => apiFetch<null>(`/menu/${id}`, { method: 'DELETE' }),
  getResep: (menuId: string) => apiFetch<ResepItemAPI[]>(`/menu/${menuId}/resep`),
  updateResep: (menuId: string, items: { bahan_id: string; takaran: number }[]) =>
    apiFetch<ResepItemAPI[]>(`/menu/${menuId}/resep`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    }),
  deleteResepItem: (menuId: string, bahanId: string) =>
    apiFetch<null>(`/menu/${menuId}/resep/${bahanId}`, { method: 'DELETE' }),
};

// ===== Pelanggan =====
export const pelangganApi = {
  getAll: () => apiFetch<PelangganAPI[]>('/pelanggan'),
  create: (p: { nama: string; kontak?: string }) =>
    apiFetch<PelangganAPI>('/pelanggan', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: string, p: Partial<{ nama: string; kontak: string }>) =>
    apiFetch<PelangganAPI>(`/pelanggan/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  delete: (id: string) => apiFetch<null>(`/pelanggan/${id}`, { method: 'DELETE' }),
};

// ===== Pesanan =====
export const pesananApi = {
  getAll: () => apiFetch<PesananAPI[]>('/pesanan'),
  create: (p: {
    pelanggan_id?: string | null;
    // Backend mewajibkan `nama_pelanggan` untuk pelanggan baru (bukan `nama_pelanggan_baru`)
    nama_pelanggan?: string;
    tanggal_kirim: string;
    dp: number;
    catatan?: string;
    items: { menu_id: string; jumlah: number }[];
  }) => apiFetch<PesananAPI>('/pesanan', { method: 'POST', body: JSON.stringify(p) }),
  // Semua field opsional — field yang tidak dikirim tetap apa adanya (edit parsial)
  update: (id: string, p: {
    pelanggan_id?: string | null;
    nama_pelanggan?: string;
    tanggal_kirim?: string;
    dp?: number;
    catatan?: string;
    items?: { menu_id: string; jumlah: number }[];
  }) => apiFetch<PesananAPI>(`/pesanan/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  advanceStatus: (id: string) =>
    apiFetch<PesananAPI>(`/pesanan/${id}/advance-status`, { method: 'POST' }),
  updateStatus: (id: string, status: string) =>
    apiFetch<PesananAPI>(`/pesanan/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  batal: (id: string) =>
    apiFetch<PesananAPI>(`/pesanan/${id}/batal`, { method: 'POST' }),
  delete: (id: string) => apiFetch<null>(`/pesanan/${id}`, { method: 'DELETE' }),
};

// ===== Dashboard =====
export const dashboardApi = {
  get: () => apiFetch<DashboardAPI>('/dashboard'),
};

// ===== Produksi =====
export const produksiApi = {
  get: (params?: { dari?: string; sampai?: string; preset?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<ProduksiAPI[]>(`/produksi${q ? `?${q}` : ''}`);
  },
};

// ===== Belanja =====
export const belanjaApi = {
  get: (params?: { dari?: string; sampai?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<BelanjaAPI>(`/belanja${q ? `?${q}` : ''}`);
  },
};

// ===== Onboarding =====
export const onboardingApi = {
  seed: () => apiFetch<null>('/onboarding/seed', { method: 'POST' }),
};

// ===== Cadangan (ekspor & impor data) =====
export const cadanganApi = {
  ekspor: () => apiFetch<CadanganPayload>('/cadangan'),
  impor: (c: CadanganPayload) =>
    apiFetch<HasilImporCadangan>('/cadangan', { method: 'POST', body: JSON.stringify(c) }),
};

// ===== Tipe Respons Backend =====
export interface BahanAPI {
  id: string;
  nama: string;
  satuan: string;
  harga_per_satuan: number;
}

export interface ResepItemAPI {
  bahan_id: string;
  takaran: number;
  nama_bahan?: string;
  satuan?: string;
  harga?: number;
  subtotal?: number;
}

export interface MenuAPI {
  id: string;
  nama: string;
  harga_jual: number;
  aktif: boolean;
  emoji?: string; // opsional — backend tidak menyimpan emoji, frontend tampilkan default 🍽️
  hpp?: number;
  laba_kotor?: number;
  margin_persen?: number;
  resep?: ResepItemAPI[];
}

export interface PelangganAPI {
  id: string;
  nama: string;
  kontak: string;
}

export interface ItemPesananAPI {
  menu_id: string;
  jumlah: number;
  harga_jual_snapshot: number;
  hpp_snapshot: number;
  nama_menu?: string;
}

export interface PesananAPI {
  id: string;
  pelanggan_id: string;
  nama_pelanggan?: string;
  tanggal_kirim: string;
  status: string;
  dp: number;
  catatan: string;
  items: ItemPesananAPI[];
  dibuat_pada: string;
}

export interface DashboardAPI {
  pesanan_hari_ini: number;
  porsi_hari_ini: number;
  omzet_bulan_ini: number;
  laba_bulan_ini: number;
  margin_bulan_ini: number;
  pesanan_terdekat: PesananAPI[];
}

export interface ProduksiAPI {
  menu_id: string;
  nama_menu: string;
  total_porsi: number;
}

export interface BelanjaAPI {
  baris: {
    bahan_id: string;
    nama_bahan: string;
    satuan: string;
    jumlah_dibutuhkan: number;
    estimasi_biaya: number;
  }[];
  total_biaya: number;
  teks_whatsapp: string;
}
