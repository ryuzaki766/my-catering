import React, { useEffect, useRef, useState } from 'react';
import type { StatusPesanan } from '@/lib/model';
import { STATUS_LABEL } from '@/lib/model';
import type { ToastData } from '@/lib/toast';

// ===== Angka beranimasi (count-up saat nilai berubah / pertama muncul) =====
export function AnimatedNumber({
  value,
  format = (n: number) => Math.round(n).toLocaleString('id-ID'),
  className = '',
  duration = 900,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    const from = currentRef.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }

    // Saat tab tersembunyi, requestAnimationFrame TIDAK pernah dipanggil sama
    // sekali → animasi macet dan angka tertahan di 0 (mis. "Rp0"). Langsung
    // tampilkan nilai akhirnya, tanpa animasi.
    if (document.hidden || typeof requestAnimationFrame !== 'function') {
      currentRef.current = to;
      setDisplay(to);
      return;
    }

    const start = performance.now();
    let raf = 0;
    let jaring = 0;

    const selesai = () => {
      currentRef.current = to;
      setDisplay(to);
    };

    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 4); // outQuart
      const current = from + (to - from) * eased;
      currentRef.current = current;
      setDisplay(current);
      if (k < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        selesai();
      }
    };
    raf = requestAnimationFrame(tick);

    // Jaring pengaman: bila rAF berhenti di tengah jalan (tab disembunyikan,
    // tab dibekukan, dsb.) angka tetap dipastikan sampai ke nilai akhir.
    jaring = window.setTimeout(selesai, duration + 200);

    // Tab kembali terlihat → hentikan animasi, langsung tampilkan nilai akhir.
    const padaVisibilitas = () => {
      if (document.visibilityState === 'visible') {
        cancelAnimationFrame(raf);
        selesai();
      }
    };
    document.addEventListener('visibilitychange', padaVisibilitas);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(jaring);
      document.removeEventListener('visibilitychange', padaVisibilitas);
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}

// ===== Badge status pesanan =====
const STATUS_STYLE: Record<StatusPesanan, string> = {
  baru: 'bg-cobalt-soft text-cobalt-deep border-cobalt/30',
  diproses: 'bg-mustard-soft text-mustard-deep border-mustard/40',
  terkirim: 'bg-leaf-soft text-leaf-deep border-leaf/40',
  lunas: 'bg-leaf text-white border-leaf',
  batal: 'bg-stone-200 text-stone-500 border-stone-300',
};
export function StatusBadge({ status, pop = false }: { status: StatusPesanan; pop?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]} ${pop ? 'status-pop' : ''}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

// ===== Modal =====
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fade-in absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`pop-in relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-cream-card p-6 shadow-2xl sm:rounded-3xl ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-faint transition hover:bg-cream-deep hover:text-ink"
            aria-label="Tutup"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ===== Toast =====
// Hook pemanggil toast (`useToast`) berada di `@/lib/toast`; berkas ini hanya
// memuat komponennya agar React Refresh bisa hot-reload.
export function ToastHost({ toasts }: { toasts: ToastData[] }) {
  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 md:bottom-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-in pointer-events-auto flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-cream shadow-xl"
        >
          {t.tipe === 'error' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e06a5a" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dfa43d" strokeWidth="2.5">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {t.pesan}
        </div>
      ))}
    </div>
  );
}
// ===== Komponen kecil =====
export function SectionLabel({ color, icon, text }: { color: string; icon: string; text: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
      style={{ background: color + '1f', color }}
    >
      <span>{icon}</span>
      {text}
    </span>
  );
}

export function EmptyState({ emoji, judul, sub }: { emoji: string; judul: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-cream-deep bg-cream-card/60 px-6 py-12 text-center">
      <span className="floaty text-4xl">{emoji}</span>
      <p className="font-display font-bold text-ink">{judul}</p>
      <p className="text-sm text-ink-soft">{sub}</p>
    </div>
  );
}
