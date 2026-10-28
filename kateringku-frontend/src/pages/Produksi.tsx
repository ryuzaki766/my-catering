import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { fmtTanggal, fmtTanggalPanjang, hariIni, tambahHari, rp, totalTagihan } from '@/lib/model';
import { AnimatedNumber, EmptyState, StatusBadge, ToastHost } from '@/components/shared';
import { useToast } from '@/lib/toast';

export default function ProduksiPage() {
  const { db, menuMap, pelangganMap } = useStore();
  const { toasts, push } = useToast();
  const today = hariIni();
  const [tanggal, setTanggal] = useState(today);
  // Input tanggal boleh dikosongkan saat pengguna mengetik ulang; sampai ada
  // tanggal baru, perhitungan tetap memakai hari ini agar tidak menampilkan 0.
  const tanggalAktif = tanggal || today;

  const pesananHari = useMemo(
    () =>
      db.pesanan
        .filter((p) => p.tanggalKirim === tanggalAktif && p.status !== 'batal')
        .sort((a, b) => {
          const namaA = pelangganMap.get(a.pelangganId)?.nama || a.namaPelanggan || '';
          const namaB = pelangganMap.get(b.pelangganId)?.nama || b.namaPelanggan || '';
          return namaA.localeCompare(namaB, 'id-ID');
        }),
    [db.pesanan, tanggalAktif, pelangganMap]
  );

  // rekap porsi per menu (US-05)
  const rekap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pesananHari) {
      for (const it of p.items) {
        map.set(it.menuId, (map.get(it.menuId) ?? 0) + it.jumlah);
      }
    }
    return [...map.entries()]
      .map(([id, porsi]) => ({
        menu: menuMap.get(id) ?? {
          id,
          nama: 'Menu Lainnya (Dihapus)',
          emoji: '🍽️',
          hargaJual: 0,
          aktif: false,
          resep: [],
        },
        porsi,
      }))
      .sort((a, b) => b.porsi - a.porsi);
  }, [pesananHari, menuMap]);

  const totalPorsiSemua = rekap.reduce((s, r) => s + r.porsi, 0);
  const maxPorsi = Math.max(...rekap.map((r) => r.porsi), 1);
  const estimasiOmzet = pesananHari.reduce((s, p) => s + totalTagihan(p), 0);

  const teksWA = () => {
    const garis = [
      `🍳 *REKAP PRODUKSI DAPUR — KATERINGKU*`,
      `Tanggal: ${fmtTanggalPanjang(tanggalAktif)}`,
      `Total: ${totalPorsiSemua} porsi (${pesananHari.length} pesanan)`,
      '',
      '--- *MENU YANG HARUS DIMASAK* ---',
      ...rekap.map((r, i) => `${i + 1}. ${r.menu.emoji ? r.menu.emoji + ' ' : ''}${r.menu.nama}: ${r.porsi} porsi`),
      '',
      '--- *RINCIAN PER PESANAN* ---',
      ...pesananHari.map((p, i) => {
        const namaPelanggan = pelangganMap.get(p.pelangganId)?.nama || p.namaPelanggan || 'Pelanggan';
        const ringkasanItem = p.items.map((it) => `${it.jumlah}× ${menuMap.get(it.menuId)?.nama ?? '?'}`).join(', ');
        const catatan = p.catatan ? `\n   📝 Catatan: ${p.catatan}` : '';
        return `${i + 1}. *${namaPelanggan}* (${ringkasanItem}) [${p.status.toUpperCase()}]${catatan}`;
      }),
    ];
    return garis.join('\n');
  };

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(teksWA());
      push('Rekap produksi tersalin — siap kirim ke WhatsApp 📋');
    } catch {
      push('Gagal menyalin, coba lagi');
    }
  };

  return (
    <div id="print-area" className="space-y-5">
      <header className="up-show flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Rekap Produksi 🍳</h1>
          <p className="text-sm text-ink-soft">Berapa porsi tiap menu yang harus dimasak per tanggal.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={salin}
            className="btn-arrow rounded-full bg-terra px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-terra/30 transition hover:bg-terra-deep"
          >
            Salin ke WhatsApp <span className="arr">→</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-cream-deep bg-cream-card px-4 py-2.5 text-sm font-bold text-ink transition hover:border-ink"
          >
            Cetak 🖨️
          </button>
        </div>
      </header>

      {/* pemilih tanggal bebas */}
      <div className="up-show rounded-3xl border border-cream-deep bg-cream-card p-4" style={{ animationDelay: '0.08s' }}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[11rem] flex-1">
            <span className="text-xs font-bold text-ink-soft">Tanggal produksi</span>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              onBlur={() => {
                if (!tanggal) setTanggal(today);
              }}
              className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-3 py-2.5 text-sm outline-none focus:border-terra"
            />
            <span className="mt-1 block text-xs font-semibold text-ink-faint">
              {fmtTanggalPanjang(tanggalAktif)}
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTanggal(tambahHari(tanggalAktif, -1))}
              aria-label="Hari sebelumnya"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cream-deep bg-white text-lg font-bold text-ink transition hover:border-terra/50 hover:text-terra"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setTanggal(today)}
              disabled={tanggalAktif === today}
              className="h-11 rounded-2xl border border-cream-deep bg-white px-3.5 text-sm font-bold text-ink transition hover:border-terra/50 hover:text-terra disabled:cursor-default disabled:border-terra/40 disabled:bg-terra/10 disabled:text-terra"
            >
              Hari ini
            </button>
            <button
              type="button"
              onClick={() => setTanggal(tambahHari(today, 1))}
              disabled={tanggalAktif === tambahHari(today, 1)}
              className="h-11 rounded-2xl border border-cream-deep bg-white px-3.5 text-sm font-bold text-ink transition hover:border-terra/50 hover:text-terra disabled:cursor-default disabled:border-terra/40 disabled:bg-terra/10 disabled:text-terra"
            >
              Besok
            </button>
            <button
              type="button"
              onClick={() => setTanggal(tambahHari(today, 2))}
              disabled={tanggalAktif === tambahHari(today, 2)}
              className="h-11 rounded-2xl border border-cream-deep bg-white px-3.5 text-sm font-bold text-ink transition hover:border-terra/50 hover:text-terra disabled:cursor-default disabled:border-terra/40 disabled:bg-terra/10 disabled:text-terra"
            >
              Lusa
            </button>
            <button
              type="button"
              onClick={() => setTanggal(tambahHari(tanggalAktif, 1))}
              aria-label="Hari berikutnya"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cream-deep bg-white text-lg font-bold text-ink transition hover:border-terra/50 hover:text-terra"
            >
              ›
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Pilih tanggal berapa pun — lampau maupun akan datang. Tombol ‹ › untuk geser satu hari.
        </p>
      </div>

      {/* ringkasan */}
      <div className="up-show grid grid-cols-3 gap-3" style={{ animationDelay: '0.15s' }}>
        <div className="rounded-3xl border border-cream-deep bg-cream-card p-4 text-center">
          <AnimatedNumber value={totalPorsiSemua} className="font-display text-2xl font-extrabold text-terra" />
          <p className="text-xs font-semibold text-ink-soft">Total porsi</p>
        </div>
        <div className="rounded-3xl border border-cream-deep bg-cream-card p-4 text-center">
          <AnimatedNumber value={pesananHari.length} className="font-display text-2xl font-extrabold text-cobalt" />
          <p className="text-xs font-semibold text-ink-soft">Pesanan</p>
        </div>
        <div className="rounded-3xl border border-cream-deep bg-cream-card p-4 text-center">
          <AnimatedNumber value={estimasiOmzet} format={rp} className="block truncate font-display text-lg font-extrabold text-leaf-deep md:text-xl" />
          <p className="text-xs font-semibold text-ink-soft">Nilai pesanan</p>
        </div>
      </div>

      {rekap.length === 0 ? (
        <EmptyState
          emoji="🛏️"
          judul={`Tidak ada produksi ${fmtTanggal(tanggalAktif)}`}
          sub="Dapur bisa istirahat — atau pilih tanggal lain lewat pemilih tanggal di atas."
        />
      ) : (
        <>
          {/* rekap per menu */}
          <section className="up-show rounded-3xl border border-cream-deep bg-cream-card p-5" style={{ animationDelay: '0.2s' }}>
            <h2 className="font-display text-base font-bold text-ink">Yang harus dimasak — {fmtTanggal(tanggalAktif)}</h2>
            <div className="mt-4 space-y-4">
              {rekap.map((r, i) => (
                <div key={r.menu.id} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream text-xl">
                    {r.menu.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-bold text-ink">{r.menu.nama}</p>
                      <AnimatedNumber
                        value={r.porsi}
                        format={(n) => `${Math.round(n)} porsi`}
                        className="shrink-0 font-display text-base font-extrabold text-terra"
                      />
                    </div>
                    <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-cream-deep">
                      <div
                        className="grow-bar-x h-full rounded-full"
                        style={{
                          width: `${(r.porsi / maxPorsi) * 100}%`,
                          animationDelay: `${0.12 * i + 0.3}s`,
                          background: `linear-gradient(90deg,#dfa43d,#d5593f)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* rincian pesanan */}
          <section className="up-show rounded-3xl border border-cream-deep bg-cream-card p-5" style={{ animationDelay: '0.3s' }}>
            <h2 className="font-display text-base font-bold text-ink">Rincian per pesanan</h2>
            <div className="mt-3 divide-y divide-cream-deep">
              {pesananHari.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{pelangganMap.get(p.pelangganId)?.nama || p.namaPelanggan || 'Pelanggan'}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {p.items.map((it) => `${it.jumlah}× ${menuMap.get(it.menuId)?.nama ?? '?'}`).join(' · ')}
                    </p>
                    {p.catatan && (
                      <p className="mt-1.5 inline-block rounded-xl border border-mustard/30 bg-mustard/10 px-2.5 py-1 text-xs font-semibold text-mustard-deep">
                        📝 Catatan: {p.catatan}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Host Toast Feedback */}
      <ToastHost toasts={toasts} />
    </div>
  );
}

