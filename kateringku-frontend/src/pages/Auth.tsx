import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

type Tab = 'login' | 'register';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [namaUsaha, setNamaUsaha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = (t: Tab) => {
    setTab(t);
    setError('');
    setEmail('');
    setPassword('');
    setNamaUsaha('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (!namaUsaha.trim()) {
          setError('Nama usaha wajib diisi');
          setLoading(false);
          return;
        }
        await register(email, password, namaUsaha.trim());
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Gangguan server/DB → pesan sudah dibuat ramah oleh backend, tinggal tambah hint
        setError(err.status >= 500 ? `${err.pesan} — coba lagi` : err.pesan);
      } else {
        setError('Terjadi kesalahan, coba lagi');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      {/* Background dekoratif */}
      <div
        className="pointer-events-none fixed -left-24 -top-24 h-96 w-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #d5593f, transparent)' }}
      />
      <div
        className="pointer-events-none fixed -bottom-24 -right-16 h-80 w-80 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #dfa43d, transparent)' }}
      />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-terra text-3xl shadow-xl shadow-terra/30">
            🍱
          </div>
          <h1 className="font-display text-3xl font-extrabold text-ink">KateringKu</h1>
          <p className="mt-1 text-sm text-ink-soft">Aplikasi manajemen catering UMKM</p>
        </div>

        {/* Card */}
        <div className="pop-in rounded-3xl border border-cream-deep bg-cream-card p-6 shadow-xl">
          {/* Tab switcher */}
          <div className="mb-6 flex gap-1 rounded-2xl bg-cream p-1">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => reset(t)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${
                  tab === t
                    ? 'bg-ink text-cream shadow-md'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                {t === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-ink-soft">Email</span>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@email.com"
                className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-4 py-3 text-sm outline-none transition focus:border-terra focus:ring-2 focus:ring-terra/20"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-ink-soft">Password</span>
              <input
                id="auth-password"
                type="password"
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'register' ? 'Min. 8 karakter' : '••••••••'}
                className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-4 py-3 text-sm outline-none transition focus:border-terra focus:ring-2 focus:ring-terra/20"
              />
            </label>

            {tab === 'register' && (
              <label className="block">
                <span className="text-xs font-bold text-ink-soft">Nama Usaha</span>
                <input
                  id="auth-nama-usaha"
                  type="text"
                  value={namaUsaha}
                  onChange={(e) => setNamaUsaha(e.target.value)}
                  placeholder="cth: Dapur Bu Rina"
                  className="mt-1 w-full rounded-2xl border border-cream-deep bg-white px-4 py-3 text-sm outline-none transition focus:border-terra focus:ring-2 focus:ring-terra/20"
                />
              </label>
            )}

            {error && (
              <div className="rounded-2xl bg-terra-soft px-4 py-3 text-sm font-medium text-terra-deep">
                ⚠️ {error}
              </div>
            )}

            <button
              id="auth-submit"
              type="submit"
              disabled={loading}
              className="btn-arrow w-full rounded-2xl bg-terra py-3.5 text-sm font-bold text-white shadow-lg shadow-terra/30 transition hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Memproses…
                </span>
              ) : tab === 'login' ? (
                <>Masuk <span className="arr">→</span></>
              ) : (
                <>Buat Akun <span className="arr">→</span></>
              )}
            </button>
          </form>

          {tab === 'login' && (
            <p className="mt-5 text-center text-xs text-ink-faint">
              Belum punya akun?{' '}
              <button onClick={() => reset('register')} className="font-bold text-terra hover:underline">
                Daftar sekarang
              </button>
            </p>
          )}
          {tab === 'register' && (
            <p className="mt-5 text-center text-xs text-ink-faint">
              Sudah punya akun?{' '}
              <button onClick={() => reset('login')} className="font-bold text-terra hover:underline">
                Masuk
              </button>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-ink-faint">
          © 2026 KateringKu · Semua data aman di server kamu
        </p>
      </div>
    </div>
  );
}
