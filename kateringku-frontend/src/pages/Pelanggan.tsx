import { useState } from 'react';
import { useStore } from '@/lib/store-context';
import type { Pelanggan } from '@/lib/model';
import { pesanError } from '@/lib/api';
import { EmptyState, Modal, ToastHost } from '@/components/shared';
import { useToast } from '@/lib/toast';

export default function PelangganPage() {
  const { db, tambahPelanggan, ubahPelanggan, hapusPelanggan } = useStore();
  const { toasts, push } = useToast();
  const [edit, setEdit] = useState<Pelanggan | null>(null);
  const [openBaru, setOpenBaru] = useState(false);
  const [cari, setCari] = useState('');

  const list = db.pelanggan.filter((p) =>
    p.nama.toLowerCase().includes(cari.toLowerCase()) ||
    p.kontak.toLowerCase().includes(cari.toLowerCase())
  );

  // Hitung berapa pesanan yang dimiliki tiap pelanggan
  const pesananCount = (pelangganId: string) =>
    db.pesanan.filter((p) => p.pelangganId === pelangganId && p.status !== 'batal').length;

  return (
    <div className="space-y-5">
      <header className="up-show flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Pelanggan 👥</h1>
          <p className="text-sm text-ink-soft">Kelola daftar pelanggan dan riwayat pesanannya.</p>
        </div>
        <button
          onClick={() => setOpenBaru(true)}
          className="btn-arrow rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-terra/30 transition hover:bg-terra-deep"
        >
          + Pelanggan baru <span className="arr">→</span>
        </button>
      </header>

      {/* Search */}
      <div className="up-show" style={{ animationDelay: '0.08s' }}>
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="🔍 Cari nama atau kontak…"
          className="w-full rounded-full border border-cream-deep bg-cream-card px-5 py-3 text-sm outline-none focus:border-terra md:max-w-sm"
        />
      </div>

      {/* Statistik kecil */}
      <div className="up-show grid grid-cols-2 gap-3 sm:grid-cols-3" style={{ animationDelay: '0.12s' }}>
        <div className="rounded-3xl border border-cream-deep bg-cream-card p-4">
          <p className="font-display text-2xl font-extrabold text-ink">{db.pelanggan.length}</p>
          <p className="mt-0.5 text-xs font-medium text-ink-soft">Total pelanggan</p>
        </div>
        <div className="rounded-3xl border border-cream-deep bg-cream-card p-4">
          <p className="font-display text-2xl font-extrabold text-ink">
            {db.pelanggan.filter((p) => pesananCount(p.id) > 0).length}
          </p>
          <p className="mt-0.5 text-xs font-medium text-ink-soft">Pernah pesan</p>
        </div>
        <div className="rounded-3xl border border-cream-deep bg-cream-card p-4 col-span-2 sm:col-span-1">
          <p className="font-display text-2xl font-extrabold text-ink">
            {db.pesanan.filter((p) => p.status !== 'batal').length}
          </p>
          <p className="mt-0.5 text-xs font-medium text-ink-soft">Total pesanan aktif</p>
        </div>
      </div>

      {/* Daftar pelanggan */}
      {list.length === 0 && !cari ? (
        <EmptyState
          emoji="👥"
          judul="Belum ada pelanggan"
          sub="Tambah pelanggan pertama atau buat pesanan — pelanggan baru otomatis tersimpan."
        />
      ) : list.length === 0 ? (
        <div className="py-8 text-center text-sm text-ink-soft">
          Tidak ditemukan pelanggan "<strong>{cari}</strong>"
        </div>
      ) : (
        <div className="up-show overflow-hidden rounded-3xl border border-cream-deep bg-cream-card" style={{ animationDelay: '0.18s' }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cream-deep bg-cream text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                <th className="px-4 py-3">Nama</th>
                <th className="hidden px-4 py-3 sm:table-cell">Kontak</th>
                <th className="px-4 py-3 text-center">Pesanan</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-deep">
              {list.map((p) => {
                const count = pesananCount(p.id);
                return (
                  <tr key={p.id} className="group transition hover:bg-cream">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terra-soft font-display text-sm font-extrabold text-terra">
                          {p.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-ink">{p.nama}</p>
                          {/* Kontak tampil di mobile */}
                          {p.kontak && (
                            <p className="text-xs text-ink-soft sm:hidden">{p.kontak}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">
                      {p.kontak || <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {count > 0 ? (
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-cobalt-soft px-2 text-xs font-bold text-cobalt-deep">
                          {count}
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEdit(p)}
                        className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-ink opacity-100 transition hover:bg-terra-soft hover:text-terra md:opacity-0 md:group-hover:opacity-100"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <FormPelanggan
        pelanggan={edit}
        open={!!edit || openBaru}
        onClose={() => {
          setEdit(null);
          setOpenBaru(false);
        }}
        onSimpan={async (data) => {
          try {
            if (edit) {
              await ubahPelanggan(edit.id, data);
              push(`Data ${data.nama} diperbarui ✨`);
            } else {
              await tambahPelanggan(data);
              push('Pelanggan baru ditambahkan 🎉');
            }
            setEdit(null);
            setOpenBaru(false);
          } catch (err: unknown) {
            push(`Gagal: ${pesanError(err)}`);
          }
        }}
        onHapus={async (id) => {
          try {
            await hapusPelanggan(id);
            setEdit(null);
            push('Pelanggan dihapus');
          } catch (err: unknown) {
            push(`Gagal menghapus: ${pesanError(err)}`);
          }
        }}
      />
      <ToastHost toasts={toasts} />
    </div>
  );
}

function FormPelanggan({
  pelanggan,
  open,
  onClose,
  onSimpan,
  onHapus,
}: {
  pelanggan: Pelanggan | null;
  open: boolean;
  onClose: () => void;
  onSimpan: (p: Omit<Pelanggan, 'id'>) => Promise<void>;
  onHapus: (id: string) => Promise<void>;
}) {
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastKey, setLastKey] = useState('');

  const key = `${open}-${pelanggan?.id ?? 'baru'}`;
  if (key !== lastKey) {
    setLastKey(key);
    setNama(pelanggan?.nama ?? '');
    setKontak(pelanggan?.kontak ?? '');
  }

  const simpan = async () => {
    if (!nama.trim()) return;
    setLoading(true);
    await onSimpan({ nama: nama.trim(), kontak: kontak.trim() });
    setLoading(false);
  };

  const hapus = async () => {
    if (!pelanggan) return;
    setLoading(true);
    await onHapus(pelanggan.id);
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pelanggan ? `Edit: ${pelanggan.nama}` : 'Pelanggan baru'}
    >
      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-ink-soft">Nama pelanggan</span>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="cth: Bu Sari"
            className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-3 py-2.5 text-sm outline-none focus:border-terra"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-ink-soft">Kontak (WhatsApp / telepon — opsional)</span>
          <input
            value={kontak}
            onChange={(e) => setKontak(e.target.value)}
            placeholder="cth: 0812-3456-7890"
            className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-3 py-2.5 text-sm outline-none focus:border-terra"
          />
        </label>
        <div className="flex items-center justify-between pt-1">
          {pelanggan ? (
            <button
              onClick={hapus}
              disabled={loading}
              className="text-xs font-bold text-terra hover:underline disabled:opacity-40"
            >
              Hapus pelanggan
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={simpan}
            disabled={!nama.trim() || loading}
            className="btn-arrow rounded-full bg-terra px-6 py-3 text-sm font-bold text-white shadow-lg shadow-terra/30 transition hover:bg-terra-deep disabled:opacity-40"
          >
            {loading ? 'Menyimpan…' : <>Simpan <span className="arr">→</span></>}
          </button>
        </div>
      </div>
    </Modal>
  );
}
