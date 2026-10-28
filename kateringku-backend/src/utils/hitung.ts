import { SatuanDasar } from '../types/index.js';

export interface ItemResepHitung {
  takaran: number;
  harga_per_satuan: number;
}

/**
 * Menghitung HPP per porsi berdasarkan resep dan harga bahan.
 * Rumus: sum(takaran x harga_per_satuan)
 */
export function hitungHpp(resepItems: ItemResepHitung[]): number {
  if (!resepItems || resepItems.length === 0) return 0;
  const total = resepItems.reduce((acc, item) => {
    return acc + Number(item.takaran || 0) * Number(item.harga_per_satuan || 0);
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Menghitung laba kotor per porsi: harga_jual - HPP
 */
export function hitungLabaKotor(hargaJual: number, hpp: number): number {
  return Number(hargaJual) - Number(hpp);
}

/**
 * Menghitung persentase margin keuntungan:
 * Rumus: ((harga_jual - HPP) / harga_jual) * 100%
 */
export function hitungMarginPersen(hargaJual: number, hpp: number): number {
  if (!hargaJual || hargaJual <= 0) return 0;
  const laba = hitungLabaKotor(hargaJual, hpp);
  const margin = (laba / hargaJual) * 100;
  return Math.round(margin * 10) / 10;
}

export interface KonversiSatuanResult {
  satuan_dasar: SatuanDasar;
  total_dasar: number;
  satuan_tampilan: string;
  total_tampilan: number;
  tampilan_ramah: string;
}

/**
 * Mengonversi satuan dasar (g, ml, butir) ke tampilan ramah pengguna (kg, liter, butir).
 * Sesuai spesifikasi wireframe & TC-19:
 * 6000 g -> 6 kg
 * 25500 g -> 25,5 kg
 * 2100 ml -> 2,1 liter
 * 50 butir -> 50 butir
 */
export function konversiSatuan(totalDasar: number, satuan: SatuanDasar): KonversiSatuanResult {
  const nilai = Number(totalDasar) || 0;

  if (satuan === 'g') {
    if (nilai >= 1000) {
      const kg = Math.round((nilai / 1000) * 100) / 100;
      const formatted = kg.toString().replace('.', ',');
      return {
        satuan_dasar: 'g',
        total_dasar: nilai,
        satuan_tampilan: 'kg',
        total_tampilan: kg,
        tampilan_ramah: `${formatted} kg`,
      };
    }
    const formatted = nilai.toString().replace('.', ',');
    return {
      satuan_dasar: 'g',
      total_dasar: nilai,
      satuan_tampilan: 'g',
      total_tampilan: nilai,
      tampilan_ramah: `${formatted} g`,
    };
  }

  if (satuan === 'ml') {
    if (nilai >= 1000) {
      const liter = Math.round((nilai / 1000) * 100) / 100;
      const formatted = liter.toString().replace('.', ',');
      return {
        satuan_dasar: 'ml',
        total_dasar: nilai,
        satuan_tampilan: 'liter',
        total_tampilan: liter,
        tampilan_ramah: `${formatted} liter`,
      };
    }
    const formatted = nilai.toString().replace('.', ',');
    return {
      satuan_dasar: 'ml',
      total_dasar: nilai,
      satuan_tampilan: 'ml',
      total_tampilan: nilai,
      tampilan_ramah: `${formatted} ml`,
    };
  }

  // butir
  return {
    satuan_dasar: 'butir',
    total_dasar: nilai,
    satuan_tampilan: 'butir',
    total_tampilan: nilai,
    tampilan_ramah: `${nilai} butir`,
  };
}
