import { useState } from 'react';
import { useStore } from '@/lib/store-context';
import type { Bahan, Menu, ResepItem, Satuan } from '@/lib/model';
import { rp, hppPerPorsi, fmtJumlah, SATUAN_LIST, satuanTampilan } from '@/lib/model';
import { pesanError } from '@/lib/api';
import { Modal, ToastHost } from '@/components/shared';
import BahanPanel from '@/components/BahanPanel';
import { useToast } from '@/lib/toast';
import { parseAngka, formatRupiah } from '@/lib/angka';
import { BATAS_ANGKA } from '@/lib/schemas';

export default function MenuPage() {
  const { db, bahanMap, tambahMenu, ubahMenu, hapusMenu } = useStore();
  const { toasts, push } = useToast();
  const [tab, setTab] = useState<'menu' | 'bahan'>('menu');
  const [editId, setEditId] = useState<string | null>(null);
  const [openBaru, setOpenBaru] = useState(false);

  const editing = db.menu.find((m) => m.id === editId) ?? null;

  return (
    <div className="space-y-5">
      <header className="up-show flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Menu & Bahan</h1>
          <p className="text-sm text-ink-soft">
            Susun menu, resep, dan bahan baku dalam satu tempat — HPP & margin ter-update otomatis.
          </p>
        </div>
        {tab === 'menu' && (
          <button
            onClick={() => setOpenBaru(true)}
            className="btn-arrow rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-terra/30 transition hover:bg-terra-deep"
          >
            + Menu baru <span className="arr">→</span>
          </button>
        )}
      </header>

      {/* tab Menu | Bahan — bahan kini satu tempat dengan resep */}
      <div
        className="up-show flex gap-1 rounded-2xl border border-cream-deep bg-cream-card p-1 sm:w-fit"
        style={{ animationDelay: '0.06s' }}
        role="tablist"
        aria-label="Menu dan bahan"
      >
        {([
          { key: 'menu' as const, label: '🍽️ Menu', jumlah: db.menu.length },
          { key: 'bahan' as const, label: '🧅 Bahan', jumlah: db.bahan.length },
        ]).map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition ${
              tab === t.key ? 'bg-terra text-white shadow-md shadow-terra/30' : 'text-ink-soft hover:bg-cream'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                tab === t.key ? 'bg-white/25' : 'bg-cream-deep text-ink-soft'
              }`}
            >
              {t.jumlah}
            </span>
          </button>
        ))}
      </div>

      {tab === 'bahan' ? (
        <BahanPanel />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
        {db.menu.map((m, i) => {
          const hpp = hppPerPorsi(m, bahanMap);
          const margin = m.hargaJual - hpp;
          const marginPct = m.hargaJual > 0 ? (margin / m.hargaJual) * 100 : 0;
          const sehat = marginPct >= 30;
          const tipis = marginPct >= 15 && marginPct < 30;
          return (
            <article
              key={m.id}
              className="up-show lift rounded-3xl border border-cream-deep bg-cream-card p-5"
              style={{ animationDelay: `${0.07 * i}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="floaty flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-2xl" style={{ ['--rot' as string]: i % 2 ? '4deg' : '-4deg', animationDelay: `${i * 0.7}s` }}>
                    {m.emoji}
                  </span>
                  <div>
                    <h2 className="font-display text-base font-bold leading-tight text-ink">{m.nama}</h2>
                    <p className="text-xs font-semibold text-ink-soft">{rp(m.hargaJual)} / porsi</p>
                  </div>
                </div>
                {m.resep.length === 0 ? (
                  <span className="rounded-full bg-mustard-soft px-2.5 py-1 text-[11px] font-bold text-mustard-deep">
                    ⚠️ Belum ada resep
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      sehat
                        ? 'bg-leaf-soft text-leaf-deep'
                        : tipis
                          ? 'bg-mustard-soft text-mustard-deep'
                          : 'bg-terra-soft text-terra-deep'
                    }`}
                  >
                    {sehat ? 'Margin sehat' : tipis ? 'Margin tipis' : 'Rugi / terlalu murah'}
                  </span>
                )}
              </div>

              {/* HPP breakdown */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-cream p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">HPP/porsi</p>
                  <p className="font-display text-sm font-extrabold text-ink">{m.resep.length ? rp(hpp) : '—'}</p>
                </div>
                <div className="rounded-2xl bg-cream p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Margin</p>
                  <p className={`font-display text-sm font-extrabold ${margin >= 0 ? 'text-leaf-deep' : 'text-terra-deep'}`}>
                    {m.resep.length ? rp(margin) : '—'}
                  </p>
                </div>
                <div className="rounded-2xl bg-cream p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Margin %</p>
                  <p className={`font-display text-sm font-extrabold ${marginPct >= 30 ? 'text-leaf-deep' : 'text-mustard-deep'}`}>
                    {m.resep.length ? `${marginPct.toFixed(0)}%` : '—'}
                  </p>
                </div>
              </div>

              {m.resep.length > 0 && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-deep">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.max(0, marginPct))}%`,
                      background: sehat ? '#16ac7a' : tipis ? '#dfa43d' : '#d5593f',
                    }}
                  />
                </div>
              )}

              {/* komposisi singkat */}
              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                {m.resep.length > 0
                  ? m.resep
                      .map((r) => {
                        const b = bahanMap.get(r.bahanId);
                        return b ? `${b.nama} ${fmtJumlah(r.takaran, b.satuan)}` : '';
                      })
                      .filter(Boolean)
                      .join(' · ')
                  : 'Resep kosong — tambahkan bahan agar HPP & daftar belanja bisa dihitung.'}
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setEditId(m.id)}
                  className="btn-arrow rounded-full bg-ink px-4 py-2 text-xs font-bold text-cream transition hover:bg-terra"
                >
                  Edit resep & harga <span className="arr">→</span>
                </button>
                <button
                  onClick={async () => {
                    try {
                      await ubahMenu(m.id, { aktif: !m.aktif });
                      push(m.aktif ? `Menu "${m.nama}" dinonaktifkan` : `Menu "${m.nama}" diaktifkan`);
                    } catch (err) {
                      push(pesanError(err, 'Gagal mengubah status menu'), 'error');
                    }
                  }}
                  className="rounded-full border border-cream-deep px-4 py-2 text-xs font-bold text-ink-soft transition hover:border-ink"
                >
                  {m.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </article>
          );
        })}
          </div>

          <FormMenu
            menu={editing}
            open={!!editing || openBaru}
            onClose={() => {
              setEditId(null);
              setOpenBaru(false);
            }}
            onToast={push}
            onSimpan={async (data, id) => {
              try {
                if (id) {
                  await ubahMenu(id, data);
                  push('Menu diperbarui — HPP dihitung ulang ✨');
                } else {
                  // Icon tidak lagi dipilih user — pakai default 🍽️ (backend tidak menyimpan emoji)
                  await tambahMenu({ ...data, aktif: true, emoji: '🍽️' });
                  push('Menu baru ditambahkan 🎉');
                }
                setEditId(null);
                setOpenBaru(false);
              } catch (err) {
                // Modal tetap terbuka agar user bisa memperbaiki input
                push(pesanError(err, 'Gagal menyimpan menu'), 'error');
              }
            }}
            onHapus={async (id) => {
              try {
                await hapusMenu(id);
                setEditId(null);
                push('Menu dihapus');
              } catch (err) {
                push(pesanError(err, 'Gagal menghapus menu'), 'error');
              }
            }}
          />
        </>
      )}
      <ToastHost toasts={toasts} />
    </div>
  );
}

type BahanItem = ReturnType<typeof useStore>['db']['bahan'][number];

/**
 * Input bahan: bisa diketik untuk mencari, atau dibuka seperti dropdown biasa.
 * Memilih dari bahan yang sudah ada, atau membuat bahan baru langsung dari sini
 * lewat opsi "＋ Bahan baru" (jadi tidak perlu pindah halaman).
 */
function BahanCombobox({
  value,
  onChange,
  bahan,
  onBahanBaru,
}: {
  value: string;
  onChange: (id: string) => void;
  bahan: BahanItem[];
  onBahanBaru: (nama: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const selected = bahan.find((b) => b.id === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? bahan.filter((b) => b.nama.toLowerCase().includes(q)) : bahan;

  const pilih = (b: BahanItem) => {
    onChange(b.id);
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
    <div className="relative min-w-0 flex-1">
      <input
        value={open ? query : (selected?.nama ?? '')}
        placeholder={open ? (selected?.nama ?? 'Ketik nama bahan…') : 'Ketik / pilih bahan…'}
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
        className="w-full rounded-2xl border border-cream-deep bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-terra"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-faint">▼</span>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-cream-deep bg-white p-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs font-medium text-ink-soft">
              Tidak ada bahan yang cocok{query.trim() ? ` dengan “${query.trim()}”` : ''}. Buat lewat opsi di bawah.
            </li>
          ) : (
            filtered.map((b, idx) => (
              <li
                key={b.id}
                role="option"
                aria-selected={b.id === value}
                // mousedown (bukan click) supaya terjadi sebelum input kehilangan fokus
                onMouseDown={(e) => {
                  e.preventDefault();
                  pilih(b);
                }}
                onMouseEnter={() => setActive(idx)}
                className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm ${
                  idx === active ? 'bg-terra-soft text-ink' : 'text-ink-soft'
                } ${b.id === value ? 'font-bold' : ''}`}
              >
                <span>{b.nama}</span>
                <span className="text-xs text-ink-faint">{satuanTampilan(b.satuan)}</span>
              </li>
            ))
          )}
          <li
            role="option"
            aria-selected={false}
            onMouseDown={(e) => {
              // Jangan biarkan input kehilangan fokus sebelum form bahan baru terbuka
              e.preventDefault();
              onBahanBaru(query.trim());
              setOpen(false);
              setQuery('');
            }}
            className="mt-1 cursor-pointer rounded-xl border-t border-cream-deep px-3 py-2 text-sm font-bold text-terra transition hover:bg-terra-soft"
          >
            ＋ Bahan baru{query.trim() ? ` «${query.trim()}»` : ''}
          </li>
        </ul>
      )}
    </div>
  );
}

function FormMenu({
  menu,
  open,
  onClose,
  onSimpan,
  onHapus,
  onToast,
}: {
  menu: Menu | null;
  open: boolean;
  onClose: () => void;
  onSimpan: (data: Omit<Menu, 'id' | 'aktif' | 'emoji'>, id?: string) => void | Promise<void>;
  onHapus: (id: string) => void | Promise<void>;
  onToast: (pesan: string, tipe?: 'sukses' | 'error') => void;
}) {
  const { db, tambahBahan } = useStore();
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [resep, setResep] = useState<ResepItem[]>([]);
  // Baris resep yang sedang dibuatkan bahan barunya (index + nama awal).
  const [bahanBaru, setBahanBaru] = useState<{ index: number; nama: string } | null>(null);
  const [lastKey, setLastKey] = useState<string>('');

  // sinkron saat menu berubah / modal dibuka
  const key = `${open}-${menu?.id ?? 'baru'}`;
  if (key !== lastKey) {
    setLastKey(key);
    setNama(menu?.nama ?? '');
    setHarga(menu ? String(menu.hargaJual) : '');
    setResep(menu?.resep ?? []);
  }

  const setResepItem = (i: number, patch: Partial<ResepItem>) =>
    setResep((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const parsedHarga = parseAngka(harga);
  const hargaValid =
    harga.trim() !== '' &&
    !isNaN(parsedHarga) &&
    Number.isInteger(parsedHarga) &&
    parsedHarga >= BATAS_ANGKA.MIN_HARGA &&
    parsedHarga <= BATAS_ANGKA.MAX_HARGA;

  const takaranSemuaValid = resep.every(
    (r) => r.takaran >= BATAS_ANGKA.MIN_TAKARAN && r.takaran <= BATAS_ANGKA.MAX_TAKARAN
  );

  const bahanIds = resep.map((r) => r.bahanId);
  const adaBahanDuplikat = new Set(bahanIds).size !== bahanIds.length;

  const hppPreview = resep.reduce((s, r) => {
    const b = db.bahan.find((x) => x.id === r.bahanId);
    return s + (b ? r.takaran * b.harga : 0);
  }, 0);

  const hargaNumerik = !isNaN(parsedHarga) ? parsedHarga : 0;

  return (
    <Modal open={open} onClose={onClose} title={menu ? `Edit: ${menu.nama}` : 'Menu baru'} wide>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
          <label className="block">
            <span className="text-xs font-bold text-ink-soft">Nama menu</span>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="cth: Nasi Box Ayam Geprek"
              className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-3 py-2.5 text-sm outline-none focus:border-terra"
            />
          </label>
          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-soft">Harga jual per porsi (Rp)</span>
              {!isNaN(parsedHarga) && parsedHarga > 0 && (
                <span className="text-[11px] font-bold text-leaf-deep">
                  {formatRupiah(parsedHarga)}
                </span>
              )}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              placeholder="25000"
              className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${
                harga && !hargaValid
                  ? 'border-terra bg-terra-soft/30 text-terra focus:border-terra'
                  : 'border-cream-deep bg-white focus:border-terra text-ink'
              }`}
            />
            {harga && !hargaValid && (
              <p role="alert" className="mt-1 text-xs font-semibold text-terra">
                Harga harus berupa angka bulat positif (Rp 0 – Rp 500.000.000)
              </p>
            )}
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft">Resep per porsi</span>
            <button
              onClick={() => setResep((rs) => [...rs, { bahanId: db.bahan[0]?.id ?? '', takaran: 10 }])}
              className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-terra transition hover:bg-terra-soft"
            >
              + Tambah bahan
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {resep.length === 0 && (
              <p className="rounded-2xl bg-mustard-soft px-3 py-2 text-xs font-medium text-mustard-deep">
                ⚠️ Resep kosong: menu ini tidak akan masuk hitungan daftar belanja.
              </p>
            )}
            {adaBahanDuplikat && (
              <p className="rounded-2xl bg-terra-soft px-3 py-2 text-xs font-semibold text-terra">
                ⚠️ Ada bahan yang terduplikasi di resep. Pilih bahan yang berbeda untuk tiap baris.
              </p>
            )}
            {resep.map((r, i) => {
              const b = db.bahan.find((x) => x.id === r.bahanId);
              const takaranInvalid = r.takaran < BATAS_ANGKA.MIN_TAKARAN || r.takaran > BATAS_ANGKA.MAX_TAKARAN;
              return (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <BahanCombobox
                    value={r.bahanId}
                    onChange={(id) => setResepItem(i, { bahanId: id })}
                    bahan={db.bahan}
                    onBahanBaru={(namaAwal) => setBahanBaru({ index: i, nama: namaAwal })}
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      // Tak-terkendali: teks ketikan dipertahankan apa adanya.
                      // Tadinya `value` diambil dari hasil parseAngka → tiap
                      // ketikan diubah jadi angka dulu lalu ditulis balik, jadi
                      // "0," atau "13.5" langsung tersingkir saat mengetik.
                      // Modal mengembalikan null saat tertutup, sehingga baris
                      // ini di-remount tiap dibuka dan `defaultValue` selalu
                      // tersinkron dari state terbaru.
                      defaultValue={r.takaran ? String(r.takaran) : ''}
                      onChange={(e) => {
                        const v = parseAngka(e.target.value);
                        setResepItem(i, { takaran: isNaN(v) ? 0 : v });
                      }}
                      placeholder="0"
                      className={`w-24 rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${
                        takaranInvalid
                          ? 'border-terra bg-terra-soft/30 text-terra focus:border-terra'
                          : 'border-cream-deep bg-white focus:border-terra text-ink'
                      }`}
                    />
                    <span className="w-12 text-xs font-bold text-ink-soft">{b ? satuanTampilan(b.satuan) : '—'}</span>
                  </div>
                  <button
                    onClick={() => setResep((rs) => rs.filter((_, j) => j !== i))}
                    className="rounded-full p-1.5 text-ink-faint transition hover:bg-terra-soft hover:text-terra"
                  >
                    ✕
                  </button>
                  {takaranInvalid && (
                    <span className="text-[11px] font-semibold text-terra">
                      (min {BATAS_ANGKA.MIN_TAKARAN})
                    </span>
                  )}
                </div>
              );
            })}
            {bahanBaru && (
              <FormBahanMini
                key={`${bahanBaru.index}-${bahanBaru.nama}`}
                namaAwal={bahanBaru.nama}
                onBatal={() => setBahanBaru(null)}
                onSimpan={async (b) => {
                  try {
                    const dibuat = await tambahBahan(b);
                    setResepItem(bahanBaru.index, { bahanId: dibuat.id });
                    setBahanBaru(null);
                    onToast(`Bahan ${dibuat.nama} ditambahkan 🧺`);
                  } catch (err) {
                    onToast(pesanError(err, 'Gagal menambah bahan'), 'error');
                    throw err;
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* preview HPP live */}
        <div className="flex items-center justify-between rounded-2xl bg-cream p-4">
          <div className="text-sm">
            <p className="text-xs font-bold text-ink-soft">HPP per porsi</p>
            <p className="font-display text-lg font-extrabold text-ink">{rp(hppPreview)}</p>
          </div>
          <div className="text-sm text-right">
            <p className="text-xs font-bold text-ink-soft">Margin</p>
            <p
              className={`font-display text-lg font-extrabold ${
                hargaNumerik - hppPreview >= 0 ? 'text-leaf-deep' : 'text-terra-deep'
              }`}
            >
              {rp(hargaNumerik - hppPreview)}{' '}
              <span className="text-xs">
                ({hargaNumerik > 0 ? (((hargaNumerik - hppPreview) / hargaNumerik) * 100).toFixed(0) : 0}%)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          {menu ? (
            <button onClick={() => onHapus(menu.id)} className="text-xs font-bold text-terra hover:underline">
              Hapus menu
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={() =>
              nama.trim() &&
              hargaValid &&
              takaranSemuaValid &&
              !adaBahanDuplikat &&
              onSimpan({ nama: nama.trim(), hargaJual: hargaNumerik, resep }, menu?.id)
            }
            disabled={!nama.trim() || !hargaValid || !takaranSemuaValid || adaBahanDuplikat}
            className="btn-arrow rounded-full bg-terra px-6 py-3 text-sm font-bold text-white shadow-lg shadow-terra/30 transition hover:bg-terra-deep disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Simpan menu <span className="arr">→</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Form singkat bahan baru di dalam form Menu, supaya tidak perlu pindah tab
 * saat resep membutuhkan bahan yang belum terdaftar. Setelah tersimpan,
 * bahan langsung terpilih di baris resep yang memicunya.
 */
function FormBahanMini({
  namaAwal,
  onBatal,
  onSimpan,
}: {
  namaAwal: string;
  onBatal: () => void;
  onSimpan: (b: Omit<Bahan, 'id'>) => Promise<void>;
}) {
  const [nama, setNama] = useState(namaAwal);
  const [satuan, setSatuan] = useState<Satuan>('kg');
  const [harga, setHarga] = useState('');
  const [proses, setProses] = useState(false);

  const parsed = parseAngka(harga);
  const hargaValid =
    harga.trim() !== '' &&
    !isNaN(parsed) &&
    Number.isInteger(parsed) &&
    parsed >= BATAS_ANGKA.MIN_HARGA &&
    parsed <= BATAS_ANGKA.MAX_HARGA;

  const simpan = async () => {
    if (!nama.trim() || !hargaValid || proses) return;
    setProses(true);
    try {
      await onSimpan({ nama: nama.trim(), satuan, harga: parsed });
    } catch {
      // Pesan galat sudah ditampilkan pemanggil; form tetap terbuka.
    } finally {
      setProses(false);
    }
  };

  return (
    <div className="rounded-2xl border border-terra/40 bg-terra-soft/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <p className="text-xs font-bold text-terra">＋ Bahan baru</p>
        <p className="text-[11px] text-ink-soft">Langsung terpakai di baris ini</p>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="text-[11px] font-bold text-ink-soft">Nama bahan</span>
          <input
            autoFocus
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="cth: Daging Sapi"
            className="mt-0.5 w-full rounded-xl border border-cream-deep bg-white px-3 py-2 text-sm outline-none focus:border-terra"
          />
        </label>
        <div>
          <span className="text-[11px] font-bold text-ink-soft">Satuan</span>
          <div className="mt-0.5 flex gap-1">
            {SATUAN_LIST.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSatuan(s)}
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                  satuan === s ? 'bg-terra text-white' : 'bg-cream text-ink-soft hover:bg-cream-deep'
                }`}
              >
                {satuanTampilan(s)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <label className="min-w-[10rem] flex-1">
          <span className="text-[11px] font-bold text-ink-soft">Harga per {satuanTampilan(satuan)} (Rp)</span>
          <input
            type="text"
            inputMode="numeric"
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
            placeholder="0"
            className="mt-0.5 w-full rounded-xl border border-cream-deep bg-white px-3 py-2 text-sm outline-none focus:border-terra"
          />
        </label>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onBatal}
            className="rounded-full px-4 py-2 text-xs font-bold text-ink-soft transition hover:bg-cream"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={simpan}
            disabled={!nama.trim() || !hargaValid || proses}
            className="rounded-full bg-terra px-4 py-2 text-xs font-bold text-white shadow-md shadow-terra/30 transition hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {proses ? 'Menyimpan…' : 'Simpan bahan'}
          </button>
        </div>
      </div>
      {harga.trim() !== '' && !hargaValid && (
        <p role="alert" className="mt-1 text-[11px] font-semibold text-terra">
          Harga harus angka bulat Rp {BATAS_ANGKA.MIN_HARGA.toLocaleString('id-ID')} – Rp{' '}
          {BATAS_ANGKA.MAX_HARGA.toLocaleString('id-ID')}
        </p>
      )}
    </div>
  );
}