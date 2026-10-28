import { useMemo, useState } from 'react';
import { useStore, type PayloadPesanan } from '@/lib/store-context';
import { pesanError } from '@/lib/api';
import type {
  ItemPesanan,
  Menu,
  Pesanan,
  StatusPesanan,
} from '@/lib/model';
import {
  STATUS_LABEL,
  STATUS_ORDER,
  fmtTanggal,
  labaPesanan,
  rp,
  totalPorsi,
  totalTagihan,
} from '@/lib/model';
import { AnimatedNumber, EmptyState, Modal, StatusBadge, ToastHost } from '@/components/shared';
import { useToast } from '@/lib/toast';
import { parseAngka, formatRupiah } from '@/lib/angka';
import { validasiDp, BATAS_ANGKA } from '@/lib/schemas';

const NEXT_STATUS: Partial<Record<StatusPesanan, StatusPesanan>> = {
  baru: 'diproses',
  diproses: 'terkirim',
  terkirim: 'lunas',
};

export default function PesananPage() {
  const { db, pelangganMap, menuMap, tambahPesanan, ubahPesanan, ubahStatus, hapusPesanan } = useStore();
  const { toasts, push } = useToast();
  const [filter, setFilter] = useState<StatusPesanan | 'semua'>('semua');
  const [openForm, setOpenForm] = useState(false);
  const [editPesanan, setEditPesanan] = useState<Pesanan | null>(null);
  const [popId, setPopId] = useState<string | null>(null);

  const list = useMemo(
    () =>
      db.pesanan
        .filter((p) => filter === 'semua' || p.status === filter)
        .sort((a, b) => b.tanggalKirim.localeCompare(a.tanggalKirim)),
    [db.pesanan, filter]
  );

  const majukan = async (p: Pesanan) => {
    const next = NEXT_STATUS[p.status];
    if (!next) return;
    try {
      await ubahStatus(p.id, next);
      setPopId(p.id);
      setTimeout(() => setPopId(null), 500);
      push(`Status "${STATUS_LABEL[next]}" — ${pelangganMap.get(p.pelangganId)?.nama || p.namaPelanggan || ''}`);
    } catch (err: unknown) {
      push(`Gagal: ${pesanError(err)}`);
    }
  };

  return (
    <div className="space-y-5">
      <header className="up-show flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Pesanan 🧾</h1>
          <p className="text-sm text-ink-soft">Catat, pantau status, dan lihat untung tiap pesanan.</p>
        </div>
        <button
          onClick={() => setOpenForm(true)}
          className="btn-arrow rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-terra/30 transition hover:bg-terra-deep"
        >
          + Pesanan baru <span className="arr">→</span>
        </button>
      </header>

      {/* filter status */}
      <div className="up-show flex gap-2 overflow-x-auto pb-1" style={{ animationDelay: '0.1s' }}>
        {(['semua', ...STATUS_ORDER, 'batal'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as StatusPesanan | 'semua')}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              filter === s ? 'bg-ink text-cream shadow-md' : 'bg-cream-card text-ink-soft hover:bg-cream-deep'
            }`}
          >
            {s === 'semua' ? 'Semua' : STATUS_LABEL[s as StatusPesanan]}
            <span className="ml-1.5 opacity-60">
              {s === 'semua'
                ? db.pesanan.length
                : db.pesanan.filter((p) => p.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState emoji="🧺" judul="Belum ada pesanan" sub="Catat pesanan pertama kamu dengan tombol di atas." />
      ) : (
        <div className="space-y-3">
          {list.map((p, i) => {
            const tagihan = totalTagihan(p);
            const laba = labaPesanan(p);
            const margin = tagihan > 0 ? (laba / tagihan) * 100 : 0;
            const sisa = tagihan - p.dp;
            const next = NEXT_STATUS[p.status];
            return (
              <article
                key={p.id}
                className="up-show lift rounded-3xl border border-cream-deep bg-cream-card p-4 md:p-5"
                style={{ animationDelay: `${0.06 * i}s` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-cream">
                      <span className="font-display text-base font-extrabold leading-none text-terra">
                        {p.tanggalKirim.slice(8)}
                      </span>
                      <span className="text-[9px] font-bold uppercase text-ink-faint">
                        {new Date(p.tanggalKirim + 'T00:00:00').toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-ink md:text-base">
                        {pelangganMap.get(p.pelangganId)?.nama || p.namaPelanggan || 'Pelanggan'}
                      </p>
                      <p className="text-xs text-ink-soft">
                        Kirim {fmtTanggal(p.tanggalKirim)} · {totalPorsi(p)} porsi
                      </p>
                      <StatusBadge status={p.status} pop={popId === p.id} />
                    </div>
                  </div>
                  <div className="text-right">
                    <AnimatedNumber value={tagihan} format={rp} className="font-display text-lg font-extrabold text-ink" />
                    <p className={`text-xs font-bold ${laba >= 0 ? 'text-leaf-deep' : 'text-terra-deep'}`}>
                      Laba {rp(laba)} ({margin.toFixed(0)}%)
                    </p>
                  </div>
                </div>

                {/* item */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.items.map((it: ItemPesanan, j: number) => (
                    <span key={j} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink">
                      {menuMap.get(it.menuId)?.emoji} {menuMap.get(it.menuId)?.nama} × {it.jumlah}
                    </span>
                  ))}
                </div>

                {p.catatan && (
                  <p className="mt-3 rounded-2xl bg-mustard-soft px-3 py-2 text-xs font-medium text-mustard-deep">
                    📝 {p.catatan}
                  </p>
                )}

                {/* DP bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-ink-soft">DP masuk {rp(p.dp)}</span>
                    <span className={sisa > 0 ? 'text-terra' : 'text-leaf-deep'}>
                      {sisa > 0 ? `Sisa ${rp(sisa)}` : 'Lunas ✓'}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream-deep">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-leaf to-mustard transition-all duration-700"
                      style={{ width: `${tagihan > 0 ? Math.min(100, (p.dp / tagihan) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* aksi */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.status !== 'batal' && (
                    <button
                      onClick={() => {
                        setEditPesanan(p);
                        setOpenForm(true);
                      }}
                      className="rounded-full border border-cream-deep px-4 py-2 text-xs font-bold text-ink-soft transition hover:border-terra hover:text-terra"
                    >
                      Ubah
                    </button>
                  )}
                  {next && (
                    <button
                      onClick={() => majukan(p)}
                      className="btn-arrow rounded-full bg-ink px-4 py-2 text-xs font-bold text-cream transition hover:bg-terra"
                    >
                      Tandai {STATUS_LABEL[next]} <span className="arr">→</span>
                    </button>
                  )}
                  {p.status === 'baru' && (
                    <button
                      onClick={async () => {
                        try {
                          await ubahStatus(p.id, 'batal');
                          push('Pesanan dibatalkan');
                        } catch (err: unknown) {
                          push(`Gagal: ${pesanError(err)}`);
                        }
                      }}
                      className="rounded-full border border-cream-deep px-4 py-2 text-xs font-bold text-ink-soft transition hover:border-terra hover:text-terra"
                    >
                      Batalkan
                    </button>
                  )}
                  {(p.status === 'batal' || p.status === 'lunas') && (
                    <button
                      onClick={async () => {
                        try {
                          await hapusPesanan(p.id);
                          push('Pesanan dihapus');
                        } catch (err: unknown) {
                          push(`Gagal: ${pesanError(err)}`);
                        }
                      }}
                      className="rounded-full border border-cream-deep px-4 py-2 text-xs font-bold text-ink-faint transition hover:border-terra hover:text-terra"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <FormPesanan
        // Key berganti saat buka/ubah — form selalu mulai dari isi pesanan yang tepat
        key={`${editPesanan?.id ?? 'baru'}-${openForm}`}
        open={openForm}
        edit={editPesanan}
        onClose={() => {
          setOpenForm(false);
          setEditPesanan(null);
        }}
        onSimpan={async (data) => {
          const sedangEdit = editPesanan;
          try {
            if (sedangEdit) await ubahPesanan(sedangEdit.id, data);
            else await tambahPesanan(data);
            setOpenForm(false);
            setEditPesanan(null);
            push(sedangEdit ? 'Pesanan diperbarui ✓' : 'Pesanan tersimpan 🎉');
          } catch (err: unknown) {
            push(`Gagal menyimpan: ${pesanError(err)}`);
          }
        }}
      />
      <ToastHost toasts={toasts} />
    </div>
  );
}

// ===== Form input pesanan (target PRD: <= 5 ketukan inti) =====
function FormPesanan({
  open,
  edit,
  onClose,
  onSimpan,
}: {
  open: boolean;
  /** Diisi saat mode ubah — form diisi ulang dari pesanan tersebut */
  edit?: Pesanan | null;
  onClose: () => void;
  onSimpan: (p: PayloadPesanan) => Promise<void>;
}) {
  const { db, menuMap } = useStore();
  // Nilai awal dihitung saat mount; key di pemanggil memaksa remount tiap buka/ubah
  const [pelangganId, setPelangganId] = useState(() => edit?.pelangganId ?? '');
  const [namaBaru, setNamaBaru] = useState(() => (edit && !edit.pelangganId ? edit.namaPelanggan : ''));
  const [tanggal, setTanggal] = useState(() => edit?.tanggalKirim ?? '');
  const [dp, setDp] = useState(() => (edit ? String(edit.dp) : ''));
  const [catatan, setCatatan] = useState(() => edit?.catatan ?? '');
  const [keranjang, setKeranjang] = useState<Record<string, number>>(() =>
    edit ? Object.fromEntries(edit.items.map((it) => [it.menuId, it.jumlah])) : {}
  );
  const [menuId, setMenuId] = useState('');
  const [jumlah, setJumlah] = useState('');

  const menuAktif = db.menu.filter((m) => m.aktif);
  const totalItem = Object.values(keranjang).reduce((a, b) => a + b, 0);
  const estimasi = Object.entries(keranjang).reduce((s, [id, n]) => s + (menuMap.get(id)?.hargaJual ?? 0) * n, 0);

  const dpAngka = parseAngka(dp);
  const dpValidasi = validasiDp(dp, estimasi);
  const parsedJumlah = parseAngka(jumlah);
  const jumlahValid =
    !jumlah ||
    (!isNaN(parsedJumlah) &&
      Number.isInteger(parsedJumlah) &&
      parsedJumlah >= BATAS_ANGKA.MIN_JUMLAH_PORSI &&
      parsedJumlah <= BATAS_ANGKA.MAX_JUMLAH_PORSI);

  // Ketik menu + jumlah, lalu Tambah — tanpa tombol +/−
  const tambahItem = () => {
    const n = parseAngka(jumlah);
    if (!menuId || isNaN(n) || !Number.isInteger(n) || n < BATAS_ANGKA.MIN_JUMLAH_PORSI || n > BATAS_ANGKA.MAX_JUMLAH_PORSI) {
      return;
    }
    setKeranjang((k) => ({ ...k, [menuId]: Math.min(BATAS_ANGKA.MAX_JUMLAH_PORSI, (k[menuId] ?? 0) + n) }));
    setMenuId('');
    setJumlah('');
  };

  // Ubah jumlah dengan mengetik langsung (hapus item bila 0/kosong)
  const setJumlahItem = (id: string, rawVal: string | number) =>
    setKeranjang((k) => {
      const n = parseAngka(rawVal);
      const kk = { ...k };
      if (isNaN(n) || n <= 0) delete kk[id];
      else kk[id] = Math.min(BATAS_ANGKA.MAX_JUMLAH_PORSI, Math.floor(n));
      return kk;
    });

  const hapusItem = (id: string) =>
    setKeranjang((k) => {
      const kk = { ...k };
      delete kk[id];
      return kk;
    });

  const simpan = async () => {
    if (!pelangganId && !namaBaru.trim()) return;
    if (!tanggal || totalItem === 0 || !dpValidasi.valid) return;

    const items = Object.entries(keranjang).map(([menuId, jm]) => ({ menuId, jumlah: jm }));
    await onSimpan({
      pelangganId: pelangganId || undefined,
      namaPelangganBaru: !pelangganId && namaBaru.trim() ? namaBaru.trim() : undefined,
      tanggalKirim: tanggal,
      dp: !isNaN(dpAngka) && dpAngka > 0 ? dpAngka : 0,
      catatan,
      items,
    });
    setPelangganId('');
    setNamaBaru('');
    setTanggal('');
    setDp('');
    setCatatan('');
    setKeranjang({});
    setMenuId('');
    setJumlah('');
  };

  return (
    <Modal open={open} onClose={onClose} title={edit ? 'Ubah pesanan' : 'Pesanan baru'} wide>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold text-ink-soft">Pelanggan</span>
            <select
              value={pelangganId}
              onChange={(e) => setPelangganId(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-terra"
            >
              <option value="">— pilih / isi baru di samping —</option>
              {db.pelanggan.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-ink-soft">…atau nama pelanggan baru</span>
            <input
              value={namaBaru}
              onChange={(e) => setNamaBaru(e.target.value)}
              placeholder="cth: Bu Sari — Pengajian"
              className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-3 py-2.5 text-sm outline-none focus:border-terra"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold text-ink-soft">Tanggal kirim</span>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-3 py-2.5 text-sm outline-none focus:border-terra"
            />
          </label>
          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-soft">DP (Rp)</span>
              {!isNaN(dpAngka) && dpAngka > 0 && (
                <span className="text-[11px] font-bold text-leaf-deep">
                  {formatRupiah(dpAngka)}
                </span>
              )}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={dp}
              onChange={(e) => setDp(e.target.value)}
              placeholder="0"
              className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${
                !dpValidasi.valid
                  ? 'border-terra bg-terra-soft/30 text-terra focus:border-terra'
                  : 'border-cream-deep bg-white focus:border-terra text-ink'
              }`}
            />
            {!dpValidasi.valid && (
              <p role="alert" className="mt-1 text-xs font-semibold text-terra">
                {dpValidasi.pesan}
              </p>
            )}
          </label>
        </div>

        <div>
          <p className="text-xs font-bold text-ink-soft">Pilih menu & jumlah porsi</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
            <MenuCombobox value={menuId} onChange={setMenuId} menus={menuAktif} menuMap={menuMap} />
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="Porsi (1-50.000)"
                className={`w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${
                  !jumlahValid
                    ? 'border-terra bg-terra-soft/30 text-terra focus:border-terra'
                    : 'border-cream-deep bg-white focus:border-terra text-ink'
                }`}
              />
              {!jumlahValid && (
                <p role="alert" className="mt-1 text-[10px] font-semibold text-terra">
                  Bulat (1–50.000)
                </p>
              )}
            </div>
            <button
              onClick={tambahItem}
              disabled={!menuId || !jumlahValid || !jumlah}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cream transition hover:bg-terra disabled:cursor-not-allowed disabled:opacity-40"
            >
              Tambah
            </button>
          </div>

          {Object.keys(keranjang).length === 0 ? (
            <p className="mt-2 text-xs text-ink-soft">Belum ada menu dipilih — ketik nama menu di atas lalu tekan Tambah.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {Object.entries(keranjang).map(([id, n]) => {
                const m = menuMap.get(id);
                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-terra bg-terra-soft p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">
                        {m?.emoji} {m?.nama}
                      </p>
                      <p className="text-xs text-ink-soft">{rp(m?.hargaJual ?? 0)}/porsi</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={n}
                        onChange={(e) => setJumlahItem(id, e.target.value)}
                        aria-label={`Jumlah porsi ${m?.nama}`}
                        className="w-20 rounded-2xl border border-cream-deep bg-white px-3 py-2 text-sm font-bold text-ink outline-none focus:border-terra"
                      />
                      <span className="text-xs font-semibold text-ink-soft">porsi</span>
                      <span className="text-xs font-bold text-ink">{rp((m?.hargaJual ?? 0) * n)}</span>
                      <button
                        onClick={() => hapusItem(id)}
                        aria-label={`Hapus ${m?.nama}`}
                        className="rounded-full p-1.5 text-ink-faint transition hover:bg-terra-soft hover:text-terra"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <label className="block">
          <span className="text-xs font-bold text-ink-soft">Catatan (opsional)</span>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={2}
            placeholder="cth: sambal terpisah, antar sebelum jam 10"
            className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-3 py-2.5 text-sm outline-none focus:border-terra"
          />
        </label>

        <div className="flex items-center justify-between rounded-2xl bg-cream p-4">
          <div>
            <p className="text-xs font-bold text-ink-soft">Total ({totalItem} porsi)</p>
            <p className="font-display text-xl font-extrabold text-ink">{rp(estimasi)}</p>
          </div>
          <button
            onClick={() => { simpan(); }}
            disabled={!(pelangganId || namaBaru.trim()) || !tanggal || totalItem === 0 || !dpValidasi.valid}
            className="btn-arrow rounded-full bg-terra px-6 py-3 text-sm font-bold text-white shadow-lg shadow-terra/30 transition hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {edit ? 'Simpan perubahan' : 'Simpan pesanan'} <span className="arr">→</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Input pemilihan menu: ketik untuk mencari, pilih dengan klik/Enter.
 * Menampilkan emoji + nama + harga agar mudah dikenali.
 */
function MenuCombobox({
  value,
  onChange,
  menus,
  menuMap,
}: {
  value: string;
  onChange: (id: string) => void;
  menus: Menu[];
  menuMap: Map<string, Menu>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const selected = menuMap.get(value);
  const q = query.trim().toLowerCase();
  const filtered = q ? menus.filter((m) => m.nama.toLowerCase().includes(q)) : menus;

  const pilih = (m: Menu) => {
    onChange(m.id);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && filtered[active]) pilih(filtered[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="relative min-w-0">
      <input
        value={open ? query : (selected ? `${selected.emoji} ${selected.nama}` : '')}
        placeholder={open ? 'Ketik nama menu…' : 'Ketik / pilih menu…'}
        onFocus={() => {
          setQuery('');
          setActive(0);
          setOpen(true);
        }}
        onBlur={() => {
          setOpen(false);
          setQuery('');
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className="w-full rounded-2xl border border-cream-deep bg-white px-3 py-2.5 text-sm outline-none focus:border-terra"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-faint">▼</span>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-cream-deep bg-white p-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs font-medium text-ink-soft">
              Menu “{query}” tidak ditemukan atau tidak aktif.
            </li>
          ) : (
            filtered.map((m, idx) => (
              <li
                key={m.id}
                role="option"
                aria-selected={m.id === value}
                // mousedown (bukan click) supaya terjadi sebelum input kehilangan fokus
                onMouseDown={(e) => {
                  e.preventDefault();
                  pilih(m);
                }}
                onMouseEnter={() => setActive(idx)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
                  idx === active ? 'bg-terra-soft text-ink' : 'text-ink-soft'
                } ${m.id === value ? 'font-bold' : ''}`}
              >
                <span className="truncate">
                  {m.emoji} {m.nama}
                </span>
                <span className="shrink-0 text-xs text-ink-faint">{rp(m.hargaJual)}/porsi</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
