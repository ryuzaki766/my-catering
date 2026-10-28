import React from 'react';
import { useAuth } from '@/lib/auth-context';
import CadanganModal from './CadanganModal';

export type PageKey = 'dashboard' | 'pesanan' | 'produksi' | 'belanja' | 'menu' | 'pelanggan';

const NAV: { key: PageKey; label: string; warna: string; icon: React.ReactNode }[] = [
  {
    key: 'dashboard',
    label: 'Beranda',
    warna: '#d5593f',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'pesanan',
    label: 'Pesanan',
    warna: '#316ad3',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 3h12a1 1 0 011 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 011-1z" strokeLinejoin="round" />
        <path d="M9 8h6M9 12h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'pelanggan',
    label: 'Pelanggan',
    warna: '#a855f7',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'produksi',
    label: 'Produksi',
    warna: '#dfa43d',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 10h16v6a4 4 0 01-4 4H8a4 4 0 01-4-4v-6z" strokeLinejoin="round" />
        <path d="M8 6c0-1.5 1-1.5 1-3M12 6c0-1.5 1-1.5 1-3M16 6c0-1.5 1-1.5 1-3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'belanja',
    label: 'Belanja',
    warna: '#16ac7a',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 8h14l-1.5 12a2 2 0 01-2 1.7h-7a2 2 0 01-2-1.7L5 8z" strokeLinejoin="round" />
        <path d="M8 8V6a4 4 0 018 0v2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'menu',
    label: 'Menu',
    warna: '#d5593f',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16v16H4z" strokeLinejoin="round" />
        <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
      </svg>
    ),
  },
];

// Semua menu tampil di nav mobile — bahan sudah menyatu dengan halaman Menu,
// jadi tidak ada lagi item terpisah yang perlu disembunyikan.
const NAV_MOBILE = NAV;

export default function Layout({
  page,
  setPage,
  children,
}: {
  page: PageKey;
  setPage: (p: PageKey) => void;
  children: React.ReactNode;
}) {
  const { usaha, logout } = useAuth();
  const [openCadangan, setOpenCadangan] = React.useState(false);

  return (
    <div className="min-h-screen bg-cream">
      {/* ===== Sidebar desktop ===== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-cream-deep bg-ink md:flex">
        <div className="flex items-center gap-3 px-5 pb-6 pt-7">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-terra text-xl shadow-lg shadow-terra/40">
            🍱
            <span className="pulse-dot absolute -right-1 -top-1 h-3 w-3 rounded-full bg-leaf" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold leading-tight text-cream">KateringKu</p>
            <p className="truncate text-[11px] font-medium text-cream/50">
              {usaha?.nama ?? 'Memuat…'}
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((n) => {
            const active = page === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setPage(n.key)}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  active ? 'text-ink' : 'text-cream/60 hover:bg-cream/10 hover:text-cream'
                }`}
                style={active ? { background: n.warna === '#dfa43d' ? '#dfa43d' : '#fcf8ef' } : undefined}
              >
                <span
                  className="transition-transform duration-300 group-hover:scale-110"
                  style={active ? { color: n.warna === '#dfa43d' ? '#2b2118' : n.warna } : undefined}
                >
                  {n.icon}
                </span>
                {n.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-terra" />}
              </button>
            );
          })}
        </nav>

        {/* Tombol logout di sidebar */}
        <div className="m-3 space-y-2">
          <div className="rounded-2xl bg-cream/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-mustard">Tips hari ini</p>
            <p className="mt-1 text-[13px] leading-snug text-cream/75">
              Perbarui harga bahan setelah belanja — HPP semua menu ikut dihitung ulang otomatis.
            </p>
          </div>
          
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-cream/50 transition hover:bg-cream/10 hover:text-cream"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* ===== Konten ===== */}
      <main className="pb-24 md:pb-10 md:pl-60">
        <div className="mx-auto max-w-5xl px-4 pt-6 md:px-8 md:pt-8">{children}</div>
      </main>

      {/* ===== Bottom nav mobile ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-deep bg-cream-card/95 backdrop-blur md:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${NAV_MOBILE.length}, 1fr)` }}>
          {NAV_MOBILE.map((n) => {
            const active = page === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setPage(n.key)}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
                  active ? '' : 'text-ink-faint'
                }`}
                style={active ? { color: n.warna } : undefined}
              >
                <span className={`transition-transform duration-300 ${active ? '-translate-y-0.5 scale-110' : ''}`}>
                  {n.icon}
                </span>
                {n.label}
                {active && <span className="h-1 w-6 rounded-full" style={{ background: n.warna }} />}
              </button>
            );
          })}
        </div>
      </nav>

      <CadanganModal open={openCadangan} onClose={() => setOpenCadangan(false)} />
    </div>
  );
}
