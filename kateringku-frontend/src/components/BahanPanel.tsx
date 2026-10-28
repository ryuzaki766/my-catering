import { useState } from 'react';
import { useStore } from '@/lib/store-context';
import type { Bahan, Satuan } from '@/lib/model';
import { SATUAN_LIST, satuanTampilan } from '@/lib/model';
import { pesanError } from '@/lib/api';
import { Modal, ToastHost } from '@/components/shared';
import { useToast } from '@/lib/toast';
import { parseAngka, formatRupiah } from '@/lib/angka';
import { BATAS_ANGKA } from '@/lib/schemas';

const isCurah = (s: Satuan) => s === 'g' || s === 'ml';
const rupiah = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');
const hargaTampil = (b: Bahan) => rupiah(isCurah(b.satuan) ? b.harga * 1000 : b.harga);

/**
 * Pengelolaan bahan baku. Dulu halaman tersendiri; sekarang menjadi tab
 * "Bahan" di halaman Menu agar resep & bahan dikelola dalam satu tempat.
 */
export default function BahanPanel() {
  const { db, tambahBahan, ubahBahan, hapusBahan } = useStore();
  const { toasts, push } = useToast();
  const [edit, setEdit] = useState<Bahan | null>(null);
  const [openBaru, setOpenBaru] = useState(false);
  const [cari, setCari] = useState('');

  const list = db.bahan.filter((b) => b.nama.toLowerCase().includes(cari.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="🔍 Cari bahan…"
          className="min-w-[12rem] flex-1 rounded-full border border-cream-deep bg-cream-card px-5 py-3 text-sm outline-none focus:border-terra md:max-w-sm"
        />
        <button
          onClick={() => setOpenBaru(true)}
          className="btn-arrow rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-terra/30 transition hover:bg-terra-deep"
        >
          + Bahan baru <span className="arr">→</span>
        </button>
      </div>

      <p className="text-xs text-ink-soft">
        Ubah harga di sini — HPP semua menu langsung ikut dihitung ulang.
      </p>

      <div className="overflow-hidden rounded-3xl border border-cream-deep bg-cream-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-cream-deep bg-cream text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3">Bahan</th>
              <th className="px-4 py-3">Satuan</th>
              <th className="px-4 py-3 text-right">Harga / satuan</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-deep">
            {list.map((b) => (
              <tr key={b.id} className="group transition hover:bg-cream">
                <td className="px-4 py-3 font-bold text-ink">{b.nama}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-mustard-soft px-2.5 py-1 text-xs font-bold text-mustard-deep">
                    {satuanTampilan(b.satuan)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-display font-extrabold text-terra">{hargaTampil(b)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEdit(b)}
                    className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-ink opacity-100 transition hover:bg-terra-soft hover:text-terra md:opacity-0 md:group-hover:opacity-100"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            {cari ? `Tidak ditemukan bahan “${cari}”.` : 'Belum ada bahan. Tambahkan bahan baru untuk mulai menyusun resep.'}
          </p>
        )}
      </div>

      <FormBahan
        bahan={edit}
        open={!!edit || openBaru}
        onClose={() => {
          setEdit(null);
          setOpenBaru(false);
        }}
        onSimpan={async (data) => {
          try {
            if (edit) {
              await ubahBahan(edit.id, data);
              push(`Bahan ${data.nama} diperbarui — HPP menu ikut berubah ✨`);
            } else {
              await tambahBahan(data);
              push('Bahan baru ditambahkan 🧺');
            }
            setEdit(null);
            setOpenBaru(false);
          } catch (err) {
            push(pesanError(err, 'Gagal menyimpan bahan'), 'error');
          }
        }}
        onHapus={async (id) => {
          if (!window.confirm(`Hapus bahan "${edit?.nama ?? ''}"? Tindakan ini tidak bisa dibatalkan.`)) {
            return;
          }
          try {
            await hapusBahan(id);
            push('Bahan dihapus');
            setEdit(null);
            setOpenBaru(false);
          } catch (err) {
            push(pesanError(err, 'Gagal menghapus bahan'), 'error');
          }
        }}
      />
      <ToastHost toasts={toasts} />
    </div>
  );
}

function FormBahan({
  bahan,
  open,
  onClose,
  onSimpan,
  onHapus,
}: {
  bahan: Bahan | null;
  open: boolean;
  onClose: () => void;
  onSimpan: (b: Omit<Bahan, 'id'>) => void | Promise<void>;
  onHapus: (id: string) => void | Promise<void>;
}) {
  const [nama, setNama] = useState('');
  const [satuan, setSatuan] = useState<Satuan>('kg');
  const [harga, setHarga] = useState('');
  const [lastKey, setLastKey] = useState('');

  // Sinkronkan isi form dengan bahan yang sedang diedit (React "adjust state
  // when props change"): dijalankan saat render, hanya bila kuncinya berubah.
  const key = `${open}-${bahan?.id ?? 'baru'}`;
  if (key !== lastKey) {
    setLastKey(key);
    setNama(bahan?.nama ?? '');
    if (bahan) {
      // Backend menyimpan satuan dasar (g/ml/butir), tampilan selalu kg/liter.
      // Kembalikan ke satuan tampilan yang ditawarkan form: kg / liter / butir.
      if (bahan.satuan === 'g') {
        setSatuan('kg');
        setHarga(String(bahan.harga * 1000)); // per gram → per kg
      } else if (bahan.satuan === 'ml') {
        setSatuan('l');
        setHarga(String(bahan.harga * 1000)); // per ml → per liter
      } else {
        setSatuan(bahan.satuan); // butir (atau satuan lain yang tak dikonversi)
        setHarga(String(bahan.harga));
      }
    } else {
      setSatuan('kg'); // default bahan baru: kg (lebih umum dipakai)
      setHarga('');
    }
  }

  const parsedHarga = parseAngka(harga);
  // Harus rupiah bulat — aturan yang sama dengan form Menu. Angka desimal
  // (mis. 13,5) ditolak karena backend menyimpan 4 desimal per satuan dasar:
  // "13,5 per kg" → 0,0135/g → dibulatkan jadi 0,01 → tampil kembali Rp10/kg.
  const hargaValid =
    harga.trim() !== '' &&
    !isNaN(parsedHarga) &&
    Number.isInteger(parsedHarga) &&
    parsedHarga >= BATAS_ANGKA.MIN_HARGA &&
    parsedHarga <= BATAS_ANGKA.MAX_HARGA;

  const hargaNumerik = !isNaN(parsedHarga) ? parsedHarga : 0;

  // Alasan tombol Simpan masih nonaktif. Tanpa keterangan, tombol yang diam
  // saja terasa seperti bug "tidak bisa disimpan".
  const pesanHarga =
    harga.trim() === '' || hargaValid
      ? null
      : isNaN(parsedHarga)
        ? 'Harga harus berupa angka, mis. 13500'
        : !Number.isInteger(parsedHarga)
          ? 'Harga harus rupiah bulat tanpa desimal, mis. 13500'
          : `Harga maksimal Rp ${BATAS_ANGKA.MAX_HARGA.toLocaleString('id-ID')}`;

  return (
    <Modal open={open} onClose={onClose} title={bahan ? `Edit: ${bahan.nama}` : 'Bahan baru'}>
      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-ink-soft">Nama bahan</span>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="cth: Daging Sapi"
            className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-3 py-2.5 text-sm outline-none focus:border-terra"
          />
        </label>
        <div>
          <span className="text-xs font-bold text-ink-soft">Satuan</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SATUAN_LIST.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSatuan(s)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  satuan === s
                    ? 'bg-terra text-white shadow-md shadow-terra/30'
                    : 'bg-cream text-ink-soft hover:bg-cream-deep'
                }`}
              >
                {satuanTampilan(s)}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft">Harga per {satuanTampilan(satuan)} (Rp)</span>
            {!isNaN(parsedHarga) && parsedHarga > 0 && (
              <span className="text-[11px] font-bold text-leaf-deep">{formatRupiah(parsedHarga)}</span>
            )}
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
            placeholder="0"
            className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${
              harga && !hargaValid
                ? 'border-terra bg-terra-soft/30 text-terra focus:border-terra'
                : 'border-cream-deep bg-white focus:border-terra text-ink'
            }`}
          />
          {pesanHarga && (
            <p role="alert" className="mt-1 text-xs font-semibold text-terra">
              {pesanHarga}
            </p>
          )}
        </label>
        <div className="flex items-center justify-between">
          {bahan ? (
            <button type="button" onClick={() => onHapus(bahan.id)} className="text-xs font-bold text-terra hover:underline">
              Hapus bahan
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => nama.trim() && hargaValid && onSimpan({ nama: nama.trim(), satuan, harga: hargaNumerik })}
            disabled={!nama.trim() || !hargaValid}
            className="btn-arrow rounded-full bg-terra px-6 py-3 text-sm font-bold text-white shadow-lg shadow-terra/30 transition hover:bg-terra-deep disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Simpan <span className="arr">→</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
