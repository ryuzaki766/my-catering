import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router';
import { AuthProvider } from './lib/auth';
import { useAuth } from './lib/auth-context';
import { StoreProvider } from './lib/store';
import Layout from './components/Layout';
import type { PageKey } from './components/Layout';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import PesananPage from './pages/Pesanan';
import ProduksiPage from './pages/Produksi';
import BelanjaPage from './pages/Belanja';
import MenuPage from './pages/Menu';
import PelangganPage from './pages/Pelanggan';

const VALID: PageKey[] = ['dashboard', 'pesanan', 'produksi', 'belanja', 'menu', 'pelanggan'];

function bacaHash(): PageKey {
  const h = window.location.hash.replace(/^#\/?/, '');
  // Tautan lama #bahan (halaman terpisah) sekarang diarahkan ke Menu,
  // karena bahan sudah menjadi tab di dalam halaman Menu.
  if (h === 'bahan') return 'menu';
  return VALID.includes(h as PageKey) ? (h as PageKey) : 'dashboard';
}

function Shell() {
  const [page, setPageState] = useState<PageKey>(bacaHash);

  useEffect(() => {
    // Rapikan URL lama #bahan → #menu tanpa menambah riwayat.
    if (window.location.hash.replace(/^#\/?/, '') === 'bahan') {
      window.history.replaceState(null, '', '#menu');
    }
    const fn = () => setPageState(bacaHash());
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);

  const go = (p: PageKey) => {
    window.location.hash = p === 'dashboard' ? '/' : p;
    setPageState(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <StoreProvider>
      <Layout page={page} setPage={go}>
        {page === 'dashboard' && <Dashboard go={go} />}
        {page === 'pesanan' && <PesananPage />}
        {page === 'produksi' && <ProduksiPage />}
        {page === 'belanja' && <BelanjaPage />}
        {page === 'menu' && <MenuPage />}
        {page === 'pelanggan' && <PelangganPage />}
      </Layout>
    </StoreProvider>
  );
}

// ===== Auth Guard: jika belum login → tampilkan AuthPage =====
function AppContent() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl floaty">🍱</div>
          <p className="font-display text-lg font-bold text-ink">KateringKu</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-terra"
                style={{
                  animation: 'bounce 1s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthPage />;
  }

  return <Shell />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="*" element={<AppContent />} />
      </Routes>
    </AuthProvider>
  );
}
