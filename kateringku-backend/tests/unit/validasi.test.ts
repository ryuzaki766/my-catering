import { describe, it, expect } from 'vitest';
import {
  buatBahanSchema,
  buatPesananSchema,
  daftarSchema,
} from '../../src/utils/validasi.js';

describe('Unit Tests: validasi.ts (Skema Zod)', () => {
  it('TC-06: Menolak harga bahan negatif', () => {
    const data = {
      nama: 'Beras',
      satuan: 'g',
      harga_per_satuan: -100,
    };
    const result = buatBahanSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('tidak boleh negatif');
    }
  });

  it('TC-12: Menolak pesanan tanpa item', () => {
    const data = {
      nama_pelanggan: 'Bu Ani',
      tanggal_kirim: '2026-10-07',
      dp: 0,
      items: [],
    };
    const result = buatPesananSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Isi minimal satu menu');
    }
  });

  it('Menolak pendaftaran dengan email tidak valid atau password pendek', () => {
    const data = {
      email: 'bukan-email',
      password: '123',
      nama_usaha: 'Usaha',
    };
    const result = daftarSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('Menolak jumlah porsi 0, pecahan, atau melebihi 50.000', () => {
    const valid = buatPesananSchema.safeParse({
      nama_pelanggan: 'Budi',
      tanggal_kirim: '2026-10-20',
      dp: 10000,
      items: [{ menu_id: '123e4567-e89b-12d3-a456-426614174000', jumlah: 0 }],
    });
    expect(valid.success).toBe(false);

    const pecahan = buatPesananSchema.safeParse({
      nama_pelanggan: 'Budi',
      tanggal_kirim: '2026-10-20',
      dp: 10000,
      items: [{ menu_id: '123e4567-e89b-12d3-a456-426614174000', jumlah: 2.5 }],
    });
    expect(pecahan.success).toBe(false);

    const berlebih = buatPesananSchema.safeParse({
      nama_pelanggan: 'Budi',
      tanggal_kirim: '2026-10-20',
      dp: 10000,
      items: [{ menu_id: '123e4567-e89b-12d3-a456-426614174000', jumlah: 60000 }],
    });
    expect(berlebih.success).toBe(false);
  });

  it('Menolak DP negatif atau pecahan', () => {
    const negatif = buatPesananSchema.safeParse({
      nama_pelanggan: 'Budi',
      tanggal_kirim: '2026-10-20',
      dp: -500,
      items: [{ menu_id: '123e4567-e89b-12d3-a456-426614174000', jumlah: 5 }],
    });
    expect(negatif.success).toBe(false);

    const pecahan = buatPesananSchema.safeParse({
      nama_pelanggan: 'Budi',
      tanggal_kirim: '2026-10-20',
      dp: 1500.75,
      items: [{ menu_id: '123e4567-e89b-12d3-a456-426614174000', jumlah: 5 }],
    });
    expect(pecahan.success).toBe(false);
  });
});
