import { useMemo } from 'react';
import { useStore } from '@/lib/store-context';
import {
  fmtTanggal,
  hariIni,
  labaPesanan,
  rp,
  tambahHari,
  totalPorsi,
  totalTagihan,
} from '@/lib/model';
import { AnimatedNumber, StatusBadge, SectionLabel } from '@/components/shared';
import type { PageKey } from '@/components/Layout';

export default function Dashboard({ go }: { go: (p: PageKey) => void }) {
  const { db, pelangganMap, menuMap } = useStore();
  const today = hariIni();

  const pesananAktif = db.pesanan.filter((p) => p.status !== 'batal');
  const hariIniList = pesananAktif.filter((p) => p.tanggalKirim === today);
  const bulanIni = pesananAktif.filter((p) => p.tanggalKirim.slice(0, 7) === today.slice(0, 7));

  const omzetBulan = bulanIni.reduce((s, p) => s + totalTagihan(p), 0);
  const labaBulan = bulanIni.reduce((s, p) => s + labaPesanan(p), 0);
  const porsiHariIni = hariIniList.reduce((s, p) => s + totalPorsi(p), 0);

  // grafik omzet 7 hari ke belakang
  const minggu = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const tgl = tambahHari(today, i - 6);
      const omzet = pesananAktif
        .filter((p) => p.tanggalKirim === tgl)
        .reduce((s, p) => s + totalTagihan(p), 0);
      return { tgl, omzet };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.pesanan, today]);
  const maxOmzet = Math.max(...minggu.map((m) => m.omzet), 1);

  // menu terlaris bulan ini
  const terlaris = useMemo(() => {
    const hitung = new Map<string, number>();
    for (const p of bulanIni)
      for (const it of p.items) hitung.set(it.menuId, (hitung.get(it.menuId) ?? 0) + it.jumlah);
    return [...hitung.entries()]
      .map(([id, porsi]) => ({ menu: menuMap.get(id), porsi }))
      .filter((x) => x.menu)
      .sort((a, b) => b.porsi - a.porsi)
      .slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.pesanan, menuMap, today]);

  const stats = [
    {
      label: 'Pesanan hari ini',
      nilai: hariIniList.length,
      format: (n: number) => `${Math.round(n)} pesanan`,
      warna: '#316ad3',
      icon: '🧾',
      aksi: () => go('pesanan'),
    },
    {
      label: 'Porsi harus dimasak',
      nilai: porsiHariIni,
      format: (n: number) => `${Math.round(n)} porsi`,
      warna: '#dfa43d',
      icon: '🍳',
      aksi: () => go('produksi'),
    },
    {
      label: 'Omzet bulan ini',
      nilai: omzetBulan,
      format: (n: number) => rp(n),
      warna: '#d5593f',
      icon: '💰',
      aksi: () => go('pesanan'),
    },
    {
      label: 'Laba bulan ini',
      nilai: labaBulan,
      format: (n: number) => rp(n),
      warna: '#16ac7a',
      icon: '📈',
      aksi: () => go('menu'),
    },
  ];

  const jam = new Date().getHours();
  const sapa = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 19 ? 'Selamat sore' : 'Selamat malam';

  return (
    <div className="space-y-6">
      {/* Hero */}
      <header className="up-show relative overflow-hidden rounded-3xl bg-ink p-6 text-cream md:p-8">
        <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[120px] opacity-20 floaty" style={{ ['--rot' as string]: '8deg' }}>
          🍱
        </div>
        <div className="pointer-events-none absolute bottom-2 right-24 select-none text-4xl opacity-25 floaty" style={{ animationDelay: '1.2s', ['--rot' as string]: '-10deg' }}>
          🌶️
        </div>
        <SectionLabel color="#dfa43d" icon="✦" text="Ringkasan usaha" />
        <h1 className="mt-3 font-display text-2xl font-extrabold md:text-3xl">
          {sapa}, Bu Rina 👋
        </h1>
        <p className="mt-1 max-w-md text-sm text-cream/70">
          {hariIniList.length > 0
            ? `Ada ${hariIniList.length} pesanan (${porsiHariIni} porsi) yang harus dikirim hari ini. Semangat masaknya!`
            : 'Belum ada pengiriman hari ini. Waktu yang pas untuk menyiapkan stok bahan.'}
        </p>
        <button
          onClick={() => go('pesanan')}
          className="btn-arrow mt-5 rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-terra/40 transition hover:bg-terra-deep"
        >
          Catat pesanan baru <span className="arr">→</span>
        </button>
      </header>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <button
            key={s.label}
            onClick={s.aksi}
            className="up-show lift rounded-3xl border border-cream-deep bg-cream-card p-4 text-left md:p-5"
            style={{ animationDelay: `${0.08 * i + 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{s.icon}</span>
              <span className="h-2 w-2 rounded-full" style={{ background: s.warna }} />
            </div>
            <AnimatedNumber
              value={s.nilai}
              format={s.format}
              className="mt-3 block font-display text-lg font-extrabold leading-tight text-ink md:text-xl"
            />
            <p className="mt-0.5 text-xs font-medium text-ink-soft">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Grafik omzet 7 hari */}
        <section className="up-show rounded-3xl border border-cream-deep bg-cream-card p-5 lg:col-span-3" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink">Omzet 7 hari terakhir</h2>
            <span className="rounded-full bg-leaf-soft px-2.5 py-1 text-[11px] font-bold text-leaf-deep">
              {rp(omzetBulan)} bulan ini
            </span>
          </div>
          <div className="mt-5 flex h-36 items-end gap-2.5">
            {minggu.map((m, i) => {
              const isToday = m.tgl === today;
              const h = m.omzet > 0 ? Math.max((m.omzet / maxOmzet) * 100, 8) : 4;
              return (
                <div key={m.tgl} className="group flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-ink opacity-0 transition-opacity group-hover:opacity-100">
                    {m.omzet > 0 ? rp(m.omzet) : '—'}
                  </span>
                  <div className="flex h-24 w-full items-end">
                    <div
                      className="grow-bar w-full rounded-t-xl transition-colors"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${0.1 * i + 0.4}s`,
                        background: isToday
                          ? 'linear-gradient(180deg,#d5593f,#dfa43d)'
                          : m.omzet > 0
                            ? '#f0e2c6'
                            : '#f5eddc',
                      }}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold ${isToday ? 'text-terra' : 'text-ink-faint'}`}>
                    {fmtTanggal(m.tgl).split(',')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Menu terlaris */}
        <section className="up-show rounded-3xl border border-cream-deep bg-cream-card p-5 lg:col-span-2" style={{ animationDelay: '0.45s' }}>
          <h2 className="font-display text-base font-bold text-ink">Menu terlaris bulan ini</h2>
          <div className="mt-4 space-y-3">
            {terlaris.length === 0 && <p className="text-sm text-ink-soft">Belum ada penjualan bulan ini.</p>}
            {terlaris.map((t, i) => {
              const m = t.menu!;
              const pct = terlaris[0].porsi ? (t.porsi / terlaris[0].porsi) * 100 : 0;
              return (
                <div key={m.id} className="group">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-lg">{m.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{m.nama}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-deep">
                        <div
                          className="grow-bar-x h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            animationDelay: `${0.15 * i + 0.5}s`,
                            background: ['#d5593f', '#dfa43d', '#16ac7a'][i] ?? '#316ad3',
                          }}
                        />
                      </div>
                    </div>
                    <span className="font-display text-sm font-extrabold text-ink">{t.porsi}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => go('menu')} className="btn-arrow mt-4 text-sm font-bold text-terra">
            Lihat HPP semua menu <span className="arr">→</span>
          </button>
        </section>
      </div>

      {/* Pesanan terdekat */}
      <section className="up-show rounded-3xl border border-cream-deep bg-cream-card p-5" style={{ animationDelay: '0.55s' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">Pengiriman terdekat</h2>
          <button onClick={() => go('pesanan')} className="btn-arrow text-sm font-bold text-terra">
            Semua pesanan <span className="arr">→</span>
          </button>
        </div>
        <div className="mt-3 divide-y divide-cream-deep">
          {pesananAktif
            .filter((p) => p.tanggalKirim >= today && p.status !== 'lunas' && p.status !== 'terkirim')
            .sort((a, b) => a.tanggalKirim.localeCompare(b.tanggalKirim))
            .slice(0, 4)
            .map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-cream">
                  <span className="font-display text-sm font-extrabold leading-none text-terra">
                    {p.tanggalKirim.slice(8)}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-ink-faint">
                    {new Date(p.tanggalKirim + 'T00:00:00').toLocaleDateString('id-ID', { month: 'short' })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">
                    {pelangganMap.get(p.pelangganId)?.nama || p.namaPelanggan || 'Pelanggan'}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {p.items.map((it) => `${it.jumlah}× ${menuMap.get(it.menuId)?.nama ?? '?'}`).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={p.status} />
                  <p className="mt-1 text-xs font-bold text-ink">{rp(totalTagihan(p))}</p>
                </div>
              </div>
            ))}
          {pesananAktif.filter((p) => p.tanggalKirim >= today && !['lunas', 'terkirim'].includes(p.status)).length === 0 && (
            <p className="py-6 text-center text-sm text-ink-soft">Tidak ada pengiriman yang menunggu. 🎉</p>
          )}
        </div>
      </section>
    </div>
  );
}
