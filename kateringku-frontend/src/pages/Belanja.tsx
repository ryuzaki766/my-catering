import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { fmtJumlah, fmtTanggal, hariIni, hitungBelanja, rp, tambahHari } from '@/lib/model';
import { AnimatedNumber, EmptyState, ToastHost } from '@/components/shared';
import { useToast } from '@/lib/toast';

export default function BelanjaPage() {
  const { db, menuMap, bahanMap } = useStore();
  const today = hariIni();
  const { toasts, push } = useToast();
  const [dari, setDari] = useState(today);
  const [sampai, setSampai] = useState(tambahHari(today, 2));
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const hasil = useMemo(() => {
    const terpilih = db.pesanan.filter(
      (p) => p.tanggalKirim >= dari && p.tanggalKirim <= sampai
    );
    return hitungBelanja(terpilih, menuMap, bahanMap);
  }, [db.pesanan, dari, sampai, menuMap, bahanMap]);

  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  const selesai = hasil.baris.filter((b) => checked[b.bahan.id]).length;

  const teksWA = () => {
    const garis = [
      `🛒 *Daftar Belanja KateringKu*`,
      `📅 ${fmtTanggal(dari)} — ${fmtTanggal(sampai)} (${hasil.totalPorsi} porsi)`,
      '',
      ...hasil.baris.map(
        (b, i) => `${i + 1}. ${b.bahan.nama} — ${fmtJumlah(b.jumlah, b.bahan.satuan)} (~${rp(b.estimasiBiaya)})`
      ),
      '',
      `💰 Estimasi total: ${rp(hasil.totalBiaya)}`,
    ];
    if (hasil.menuTanpaResep.length > 0) {
      garis.push('', `⚠️ Menu tanpa resep (belum dihitung): ${hasil.menuTanpaResep.map((m) => m.nama).join(', ')}`);
    }
    return garis.join('\n');
  };

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(teksWA());
      push('Daftar belanja tersalin — tinggal tempel di WhatsApp 📋');
    } catch {
      push('Gagal menyalin, coba lagi');
    }
  };

  return (
    <div className="space-y-5">
      <header className="up-show flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Daftar Belanja 🛒</h1>
          <p className="text-sm text-ink-soft">Dihitung otomatis dari pesanan: porsi × takaran resep.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={salin}
            className="btn-arrow rounded-full bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-leaf/30 transition hover:bg-leaf-deep"
          >
            Salin ke WhatsApp <span className="arr">→</span>
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-full border border-cream-deep bg-cream-card px-4 py-2.5 text-sm font-bold text-ink transition hover:border-ink"
          >
            Cetak 🖨️
          </button>
        </div>
      </header>

      {/* rentang tanggal */}
      <div className="up-show flex flex-wrap items-center gap-2" style={{ animationDelay: '0.1s' }}>
        <input
          type="date"
          value={dari}
          onChange={(e) => setDari(e.target.value)}
          className="rounded-2xl border border-cream-deep bg-cream-card px-3 py-2 text-sm font-medium outline-none focus:border-leaf"
        />
        <span className="text-sm font-bold text-ink-faint">sampai</span>
        <input
          type="date"
          value={sampai}
          onChange={(e) => setSampai(e.target.value)}
          className="rounded-2xl border border-cream-deep bg-cream-card px-3 py-2 text-sm font-medium outline-none focus:border-leaf"
        />
        {[0, 1, 2].map((n) => (
          <button
            key={n}
            onClick={() => {
              setDari(today);
              setSampai(tambahHari(today, n));
            }}
            className="rounded-full bg-cream-card px-3 py-2 text-xs font-bold text-ink-soft transition hover:bg-cream-deep"
          >
            {n === 0 ? 'Hari ini' : n === 1 ? 'Sampai besok' : '3 hari ke depan'}
          </button>
        ))}
      </div>

      {hasil.baris.length === 0 ? (
        <EmptyState
          emoji="🧾"
          judul="Belum ada kebutuhan bahan"
          sub="Belum ada pesanan dengan resep pada rentang tanggal ini."
        />
      ) : (
        <div id="print-area" className="up-show space-y-4" style={{ animationDelay: '0.15s' }}>
          {/* ringkasan */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-3xl border border-cream-deep bg-cream-card p-4 text-center">
              <AnimatedNumber value={hasil.baris.length} className="font-display text-2xl font-extrabold text-cobalt" />
              <p className="text-xs font-semibold text-ink-soft">Jenis bahan</p>
            </div>
            <div className="rounded-3xl border border-cream-deep bg-cream-card p-4 text-center">
              <AnimatedNumber value={hasil.totalPorsi} className="font-display text-2xl font-extrabold text-terra" />
              <p className="text-xs font-semibold text-ink-soft">Total porsi</p>
            </div>
            <div className="rounded-3xl border border-cream-deep bg-cream-card p-4 text-center">
              <AnimatedNumber
                value={hasil.totalBiaya}
                format={rp}
                className="block truncate font-display text-lg font-extrabold text-leaf-deep md:text-xl"
              />
              <p className="text-xs font-semibold text-ink-soft">Estimasi biaya</p>
            </div>
          </div>

          {/* progress belanja */}
          <div className="rounded-3xl border border-cream-deep bg-cream-card p-4 print:hidden">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-ink-soft">Progres belanja</span>
              <span className="text-leaf-deep">
                {selesai}/{hasil.baris.length} bahan
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-cream-deep">
              <div
                className="h-full rounded-full bg-gradient-to-r from-leaf to-mustard transition-all duration-500"
                style={{ width: `${hasil.baris.length ? (selesai / hasil.baris.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* peringatan menu tanpa resep (PRD: peringatan, bukan error) */}
          {hasil.menuTanpaResep.length > 0 && (
            <div className="rounded-3xl border border-mustard/40 bg-mustard-soft p-4">
              <p className="text-sm font-bold text-mustard-deep">⚠️ Menu tanpa resep belum dihitung:</p>
              <ul className="mt-1 space-y-0.5 text-sm text-mustard-deep/90">
                {hasil.menuTanpaResep.map((m) => (
                  <li key={m.nama}>
                    • {m.nama} ({m.porsi} porsi) — lengkapi resepnya di halaman Menu.
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* daftar bahan */}
          <div className="overflow-hidden rounded-3xl border border-cream-deep bg-cream-card">
            <div className="divide-y divide-cream-deep">
              {hasil.baris.map((b, i) => {
                const done = !!checked[b.bahan.id];
                return (
                  <button
                    key={b.bahan.id}
                    onClick={() => toggle(b.bahan.id)}
                    className={`up-show flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${done ? 'bg-leaf-soft/60' : 'hover:bg-cream'}`}
                    style={{ animationDelay: `${0.04 * i}s` }}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        done ? 'border-leaf bg-leaf text-white' : 'border-cream-deep bg-white'
                      }`}
                    >
                      {done && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold transition ${done ? 'text-ink-faint line-through' : 'text-ink'}`}>
                        {b.bahan.nama}
                      </p>
                      <p className="text-xs text-ink-soft"> {rp(b.bahan.satuan === 'g' || b.bahan.satuan === 'ml'
    ? b.bahan.harga * 1000
    : b.bahan.harga
  )}/{ b.bahan.satuan === 'g' ? 'kg' : b.bahan.satuan === 'ml' ? 'liter' : b.bahan.satuan }</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-display text-base font-extrabold ${done ? 'text-ink-faint' : 'text-terra'}`}>
                        {fmtJumlah(b.jumlah, b.bahan.satuan)}
                      </p>
                      <p className="text-[11px] font-semibold text-ink-faint">~{rp(b.estimasiBiaya)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between bg-ink px-4 py-3.5 text-cream">
              <span className="text-sm font-bold">Total estimasi belanja</span>
              <AnimatedNumber value={hasil.totalBiaya} format={rp} className="font-display text-lg font-extrabold" />
            </div>
          </div>
        </div>
      )}
      <ToastHost toasts={toasts} />
    </div>
  );
}
