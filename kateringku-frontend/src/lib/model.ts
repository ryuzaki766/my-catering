// ===== Model data & aturan bisnis KateringKu (sesuai PRD bagian 8 & 10) =====

// Satuan yang didukung backend (enum `satuan_dasar` di DB): g, ml, butir.
// kg & l boleh dipilih user, asalkan dikonversi otomatis lewat `keSatuanDasar`.
// `buah`/`ikat` sengaja TIDAK ada di tipe ini: tidak ada satuan itu di database
// (backend hanya menerima g, ml, butir) sehingga tidak bisa muncul di data apa pun.
export type Satuan = 'g' | 'kg' | 'ml' | 'l' | 'butir';
export type SatuanDasar = 'g' | 'ml' | 'butir';
// Pilihan satuan yang ditawarkan ke user di form bahan.
// Opsi B: hanya "tampilan ramah" (kg, liter, butir) — sesuai cara aplikasi
// menampilkan harga (selalu per kg/liter). Nilai g/ml tetap ada pada tipe
// `Satuan` karena itulah satuan dasar yang dikembalikan backend; frontend
// mengonversinya lewat `keSatuanDasar` (kg→g, l→ml).
// Pilihan g/ml sengaja TIDAK ditawarkan: pilihan itu tidak pernah terlihat di
// layar karena disimpan sebagai g/ml lalu selalu dirender kembali sebagai
// kg/liter — memunculkan bug "satuan tidak bisa diubah".
export const SATUAN_LIST: Satuan[] = ['kg', 'l', 'butir'];

// Satuan dasar yang dikirim server (g/ml) ditampilkan dengan satuan yang dipakai
// pengguna saat mengisi bahan: g → kg, ml → liter, butir tetap butir.
// Angkanya TIDAK dikonversi di label ini; hanya namanya yang diseragamkan.
export function satuanTampilan(s: Satuan): 'kg' | 'liter' | 'butir' {
  if (s === 'g' || s === 'kg') return 'kg';
  if (s === 'ml' || s === 'l') return 'liter';
  return 'butir';
}

export interface Bahan {
  id: string;
  nama: string;
  satuan: Satuan;
  harga: number; // harga per satuan
}

export interface ResepItem {
  bahanId: string;
  takaran: number; // dalam satuan bahan
}

export interface Menu {
  id: string;
  nama: string;
  hargaJual: number;
  aktif: boolean;
  emoji: string;
  resep: ResepItem[];
}

export interface Pelanggan {
  id: string;
  nama: string;
  kontak: string;
}

export type StatusPesanan = 'baru' | 'diproses' | 'terkirim' | 'lunas' | 'batal';
export const STATUS_ORDER: StatusPesanan[] = ['baru', 'diproses', 'terkirim', 'lunas'];
export const STATUS_LABEL: Record<StatusPesanan, string> = {
  baru: 'Baru',
  diproses: 'Diproses',
  terkirim: 'Terkirim',
  lunas: 'Lunas',
  batal: 'Batal',
};

export interface ItemPesanan {
  menuId: string;
  jumlah: number;
  hargaJualSnapshot: number;
  hppSnapshot: number; // HPP per porsi saat pesanan dibuat
}

export interface Pesanan {
  id: string;
  pelangganId: string;
  // Snapshot nama pelanggan dari backend — dipakai sebagai cadangan tampilan
  // kalau data pelanggannya sudah tidak ada lagi di daftar (sama seperti
  // snapshot harga pada tiap item pesanan).
  namaPelanggan: string;
  tanggalKirim: string; // YYYY-MM-DD
  status: StatusPesanan;
  dp: number;
  catatan: string;
  items: ItemPesanan[];
  dibuatPada: string;
}

export interface DB {
  bahan: Bahan[];
  menu: Menu[];
  pelanggan: Pelanggan[];
  pesanan: Pesanan[];
}

// ===== konversi satuan (PRD: g/kg dan ml/l otomatis) =====
const FAKTOR: Partial<Record<Satuan, { dasar: Satuan; kali: number }>> = {
  kg: { dasar: 'g', kali: 1000 },
  l: { dasar: 'ml', kali: 1000 },
};
export function konversi(nilai: number, dari: Satuan, ke: Satuan): number | null {
  if (dari === ke) return nilai;
  const fDari = FAKTOR[dari];
  if (fDari && fDari.dasar === ke) return nilai * fDari.kali;
  const fKe = FAKTOR[ke];
  if (fKe && fKe.dasar === dari) return nilai / fKe.kali;
  return null; // tidak kompatibel
}

// ===== konversi input user → satuan dasar yang dipahami backend (g, ml, butir) =====
// User memilih kg/liter dengan harga per kg/liter; backend menyimpan harga per g/ml,
// jadi faktor konversinya DIBALIK dari konversi jumlah (harga per kg ÷ 1000 = harga per g).
export function keSatuanDasar(
  satuan: Satuan,
  harga: number
): { satuan: SatuanDasar; harga: number } | null {
  if (satuan === 'g' || satuan === 'ml' || satuan === 'butir') return { satuan, harga };
  const f = FAKTOR[satuan];
  if (!f) return null; // pertahanan: satuan di luar daftar (g/ml/butir sudah keluar di atas)
  return { satuan: f.dasar as SatuanDasar, harga: harga / f.kali };
}

// ===== HPP per porsi = SUM(takaran x harga_satuan_bahan) =====
export function hppPerPorsi(menu: Menu, bahanMap: Map<string, Bahan>): number {
  let total = 0;
  for (const r of menu.resep) {
    const b = bahanMap.get(r.bahanId);
    if (!b) continue;
    total += r.takaran * b.harga;
  }
  return total;
}

// ===== daftar belanja: kebutuhan_bahan = SUM(porsi x takaran), digabung per bahan =====
export interface BarisBelanja {
  bahan: Bahan;
  jumlah: number; // dalam satuan bahan
  estimasiBiaya: number;
}
export interface HasilBelanja {
  baris: BarisBelanja[];
  totalBiaya: number;
  menuTanpaResep: { nama: string; porsi: number }[];
  totalPorsi: number;
}

export function hitungBelanja(
  pesananList: Pesanan[],
  menuMap: Map<string, Menu>,
  bahanMap: Map<string, Bahan>
): HasilBelanja {
  const akumulasi = new Map<string, number>();
  const tanpaResep = new Map<string, number>();
  let totalPorsi = 0;

  for (const p of pesananList) {
    if (p.status === 'batal') continue;
    for (const it of p.items) {
      const m = menuMap.get(it.menuId);
      if (!m) continue;
      totalPorsi += it.jumlah;
      if (m.resep.length === 0) {
        tanpaResep.set(m.nama, (tanpaResep.get(m.nama) ?? 0) + it.jumlah);
        continue;
      }
      for (const r of m.resep) {
        akumulasi.set(r.bahanId, (akumulasi.get(r.bahanId) ?? 0) + r.takaran * it.jumlah);
      }
    }
  }

  const baris: BarisBelanja[] = [];
  let totalBiaya = 0;
  for (const [bahanId, jumlah] of akumulasi) {
    const b = bahanMap.get(bahanId);
    if (!b) continue;
    const biaya = jumlah * b.harga;
    totalBiaya += biaya;
    baris.push({ bahan: b, jumlah, estimasiBiaya: biaya });
  }
  baris.sort((a, b) => b.estimasiBiaya - a.estimasiBiaya);

  return {
    baris,
    totalBiaya,
    menuTanpaResep: [...tanpaResep.entries()].map(([nama, porsi]) => ({ nama, porsi })),
    totalPorsi,
  };
}

// ===== ringkasan pesanan =====
export function totalTagihan(p: Pesanan): number {
  return p.items.reduce((s, it) => s + it.jumlah * it.hargaJualSnapshot, 0);
}
export function totalModal(p: Pesanan): number {
  return p.items.reduce((s, it) => s + it.jumlah * it.hppSnapshot, 0);
}
export function labaPesanan(p: Pesanan): number {
  return totalTagihan(p) - totalModal(p);
}
export function totalPorsi(p: Pesanan): number {
  return p.items.reduce((s, it) => s + it.jumlah, 0);
}

// ===== format =====
export function rp(n: number): string {
  return 'Rp' + Math.round(n).toLocaleString('id-ID');
}
export function fmtJumlah(n: number, satuan: Satuan): string {
  // tampilkan kg/l bila besar agar enak dibaca
  if ((satuan === 'g' && n >= 1000) || (satuan === 'ml' && n >= 1000)) {
    const v = n / 1000;
    return `${v.toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${satuan === 'g' ? 'kg' : 'l'}`;
  }
  return `${n.toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${satuan}`;
}
export function fmtTanggal(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
}
export function fmtTanggalPanjang(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
export function hariIni(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function tambahHari(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
