// ===== Modal Cadangan & Pemulihan Data =====
import { useRef, useState } from 'react';
import { Modal, ToastHost } from '@/components/shared';
import { useStore } from '@/lib/store-context';
import { useToast } from '@/lib/toast';
import { pesanError, cadanganApi } from '@/lib/api';
import {
  bacaCadangan,
  namaFileCadangan,
  ringkasCadangan,
  unduhCadangan,
  type CadanganPayload,
} from '@/lib/cadangan';

export default function CadanganModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { muat } = useStore();
  const { toasts, push } = useToast();
  const [memuat, setMemuat] = useState<'ekspor' | 'impor' | null>(null);
  const [berkas, setBerkas] = useState<{ nama: string; isi: CadanganPayload } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tutup = () => {
    setBerkas(null);
    setGalat(null);
    setMemuat(null);
    onClose();
  };

  const ekspor = async () => {
    setMemuat('ekspor');
    setGalat(null);
    try {
      const data = await cadanganApi.ekspor();
      unduhCadangan(data, namaFileCadangan());
      push('Cadangan data berhasil diunduh ✓');
      tutup();
    } catch (err: unknown) {
      setGalat(pesanError(err, 'Gagal mengambil cadangan dari server.'));
    } finally {
      setMemuat(null);
    }
  };

  const pilihBerkas = async (file: File | null | undefined) => {
    setGalat(null);
    setBerkas(null);
    if (!file) return;
    try {
      const teks = await file.text();
      setBerkas({ nama: file.name, isi: bacaCadangan(teks) });
    } catch (err: unknown) {
      setGalat(err instanceof Error ? err.message : 'Berkas tidak bisa dibaca.');
    }
  };

  const pulihkan = async () => {
    if (!berkas) return;
    setMemuat('impor');
    setGalat(null);
    try {
      const hasil = await cadanganApi.impor(berkas.isi);
      await muat();
      push(
        `Data dipulihkan: ${hasil.bahan} bahan, ${hasil.menu} menu, ${hasil.pelanggan} pelanggan, ${hasil.pesanan} pesanan ✓`
      );
      tutup();
    } catch (err: unknown) {
      setGalat(pesanError(err, 'Gagal memulihkan data dari berkas.'));
    } finally {
      setMemuat(null);
    }
  };

  return (
    <>
      <Modal open={open} onClose={tutup} title="Cadangan & Pemulihan Data" wide>
        <div className="space-y-4">
        {/* Ekspor */}
        <section className="rounded-2xl bg-cream p-4">
          <p className="font-display text-base font-extrabold text-ink">💾 Unduh cadangan</p>
          <p className="mt-1 text-sm text-ink-soft">
            Simpan seluruh data usaha — bahan, menu, resep, pelanggan, dan pesanan (termasuk riwayat
            harga tiap pesanan) — sebagai berkas JSON. Simpan sebagai arsip atau pindahkan ke
            perangkat lain.
          </p>
          <button
            onClick={ekspor}
            disabled={memuat !== null}
            className="btn-arrow mt-3 rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-terra/30 transition hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {memuat === 'ekspor' ? (
              'Menyiapkan…'
            ) : (
              <>
                Unduh cadangan (.json) <span className="arr">→</span>
              </>
            )}
          </button>
        </section>

        {/* Impor */}
        <section className="rounded-2xl border border-terra/40 bg-terra-soft/40 p-4">
          <p className="font-display text-base font-extrabold text-ink">♻️ Pulihkan dari berkas</p>
          <p className="mt-1 text-sm text-ink-soft">
            Pilih berkas hasil unduhan cadangan. <b>Seluruh data usaha saat ini akan DIGANTI</b>{' '}
            dengan isi berkas — pastikan sudah mengunduh cadangan terbaru bila tidak ingin kehilangan
            perubahan terakhir.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              void pilihBerkas(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={memuat !== null}
              className="rounded-full border border-cream-deep bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:border-terra hover:text-terra disabled:cursor-not-allowed disabled:opacity-40"
            >
              Pilih berkas…
            </button>
            {berkas && (
              <button
                onClick={pulihkan}
                disabled={memuat !== null}
                className="rounded-full bg-terra-deep px-5 py-2.5 text-sm font-bold text-white transition hover:bg-terra disabled:cursor-not-allowed disabled:opacity-40"
              >
                {memuat === 'impor' ? 'Memulihkan…' : 'Pulihkan sekarang'}
              </button>
            )}
          </div>
          {berkas && (
            <p className="mt-2 text-xs font-semibold text-ink">
              📄 {berkas.nama} — {ringkasCadangan(berkas.isi)}
            </p>
          )}
        </section>

        {galat && (
          <p role="alert" className="rounded-2xl bg-terra-soft px-3 py-2 text-sm font-semibold text-terra">
            {galat}
          </p>
        )}
        </div>
      </Modal>
      {/* ToastHost di luar Modal supaya notifikasi tetap terlihat setelah modal tertutup */}
      <ToastHost toasts={toasts} />
    </>
  );
}
