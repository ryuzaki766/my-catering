import { describe, it, expect } from 'vitest';
import { formatRupiah, formatTanggalIndonesia, formatTeksWhatsApp } from '../../src/utils/format.js';
import { KebutuhanBahanItem } from '../../src/types/index.js';

describe('Unit Tests: format.ts', () => {
  it('formatRupiah memformat angka ke format Rupiah Indonesia', () => {
    expect(formatRupiah(25000)).toBe('Rp 25.000');
    expect(formatRupiah(1480000)).toBe('Rp 1.480.000');
    expect(formatRupiah(0)).toBe('Rp 0');
  });

  it('formatTanggalIndonesia memformat tanggal YYYY-MM-DD ke teks bahasa Indonesia', () => {
    expect(formatTanggalIndonesia('2026-10-07')).toBe('7 Okt 2026');
    expect(formatTanggalIndonesia('2026-01-01')).toBe('1 Jan 2026');
  });

  it('TC-25: formatTeksWhatsApp menghasilkan teks daftar belanja yang siap dibagikan', () => {
    const items: KebutuhanBahanItem[] = [
      {
        bahan_id: '1',
        nama: 'Beras',
        satuan_dasar: 'g',
        total_dasar: 25500,
        satuan_tampilan: 'kg',
        total_tampilan: 25.5,
        tampilan_ramah: '25,5 kg',
        biaya: 357000,
      },
      {
        bahan_id: '2',
        nama: 'Ayam',
        satuan_dasar: 'g',
        total_dasar: 14800,
        satuan_tampilan: 'kg',
        total_tampilan: 14.8,
        tampilan_ramah: '14,8 kg',
        biaya: 562400,
      },
    ];

    const teks = formatTeksWhatsApp(
      'Catering Bu Rina',
      '2026-10-07',
      '2026-10-08',
      items,
      919400
    );

    expect(teks).toContain('DAFTAR BELANJA - CATERING BU RINA');
    expect(teks).toContain('7 Okt 2026 - 8 Okt 2026');
    expect(teks).toContain('• Beras: *25,5 kg* (Rp 357.000)');
    expect(teks).toContain('• Ayam: *14,8 kg* (Rp 562.400)');
    expect(teks).toContain('Perkiraan Biaya Bahan:* Rp 919.400');
  });
});
