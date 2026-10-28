import { z } from 'zod';
import { parseAngka } from './angka';

export const SATUAN_DASAR = ['g', 'ml', 'butir'] as const;

export const BATAS_ANGKA = {
  MIN_JUMLAH_PORSI: 1,
  MAX_JUMLAH_PORSI: 50_000,
  MIN_HARGA: 0,
  MAX_HARGA: 500_000_000,
  MIN_TAKARAN: 0.01,
  MAX_TAKARAN: 10_000,
};

// Helper preprocess mengubah input string/number ke number bersih
const angkaSchema = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => {
    const parsed = parseAngka(val);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, schema);

// Skema validasi jumlah porsi pesanan
export const jumlahPorsiInputSchema = angkaSchema(
  z
    .number({ message: 'Jumlah harus berupa angka' })
    .int('Jumlah harus bilangan bulat')
    .min(BATAS_ANGKA.MIN_JUMLAH_PORSI, `Jumlah minimal ${BATAS_ANGKA.MIN_JUMLAH_PORSI} porsi`)
    .max(BATAS_ANGKA.MAX_JUMLAH_PORSI, `Jumlah maksimal ${BATAS_ANGKA.MAX_JUMLAH_PORSI.toLocaleString('id-ID')} porsi`)
);

// Skema validasi harga (jual atau bahan)
export const hargaInputSchema = angkaSchema(
  z
    .number({ message: 'Harga harus berupa angka' })
    .min(BATAS_ANGKA.MIN_HARGA, 'Harga tidak boleh negatif')
    .max(BATAS_ANGKA.MAX_HARGA, `Harga maksimal Rp ${BATAS_ANGKA.MAX_HARGA.toLocaleString('id-ID')}`)
);

// Skema validasi takaran resep (bisa desimal)
export const takaranInputSchema = angkaSchema(
  z
    .number({ message: 'Takaran harus berupa angka' })
    .min(BATAS_ANGKA.MIN_TAKARAN, `Takaran minimal ${BATAS_ANGKA.MIN_TAKARAN}`)
    .max(BATAS_ANGKA.MAX_TAKARAN, `Takaran maksimal ${BATAS_ANGKA.MAX_TAKARAN.toLocaleString('id-ID')}`)
);

// Skema validasi DP dinamis terhadap total tagihan
export const validasiDp = (dpInput: string | number, totalTagihan: number): { valid: boolean; pesan?: string } => {
  const raw = String(dpInput).trim();
  if (raw === '' || raw === '0') return { valid: true };

  const parsed = parseAngka(raw);
  if (Number.isNaN(parsed)) {
    return { valid: false, pesan: 'DP harus berupa angka valid (tidak boleh huruf atau negatif)' };
  }

  if (!Number.isInteger(parsed)) {
    return { valid: false, pesan: 'DP tidak boleh bilangan pecahan' };
  }

  if (parsed < 0) {
    return { valid: false, pesan: 'DP tidak boleh negatif' };
  }

  if (parsed > totalTagihan) {
    return {
      valid: false,
      pesan: `DP tidak boleh melebihi total pesanan (${new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(totalTagihan)})`,
    };
  }

  return { valid: true };
};
