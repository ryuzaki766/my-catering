// ===== Auth Provider KateringKu =====
// Hook & tipe sesi berada di `auth-context.ts`; berkas ini hanya memuat
// komponen penyedia sesinya supaya React Refresh bisa hot-reload.
import React, { useCallback, useEffect, useState } from 'react';
import { authApi, ApiError } from './api';
import { AuthCtx, type AuthUser, type AuthUsaha } from './auth-context';

const TOKEN_KEY = 'kateringku-token';
// Profil (user + usaha) ikut disimpan di perangkat sebagai cadangan, dipakai
// saat panggilan /auth/me gagal sementara (server sibuk / Neon sedang dingin)
// supaya user tidak tiba-tiba dilempar ke halaman login.
const PROFIL_KEY = 'kateringku-profil';
type ProfilTersimpan = { user: AuthUser; usaha: AuthUsaha | null };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [usaha, setUsaha] = useState<AuthUsaha | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tutup sesi sepenuhnya (dipakai logout & saat server menolak token)
  const akhiriSesi = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFIL_KEY);
    setToken(null);
    setUser(null);
    setUsaha(null);
  }, []);

  // Auto-restore sesi dari token yang tersimpan
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((data) => {
        setUser(data.user);
        setUsaha(data.usaha);
        try {
          localStorage.setItem(PROFIL_KEY, JSON.stringify({ user: data.user, usaha: data.usaha }));
        } catch {
          // penyimpanan penuh/diizinkan ditolak → bukan masalah fatal
        }
      })
      .catch((err) => {
        // 401/403 = token memang ditolak server → sesi benar-benar berakhir.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          akhiriSesi();
          return;
        }
        // Kegagalan lain (503, timeout, server mati sebentar, koneksi putus):
        // JANGAN buang sesi — itu bukti server bermasalah, bukan token basi.
        // Ambil profil cadangan agar aplikasi tetap terpakai; token dibiarkan
        // supaya bisa divalidasi lagi pada muat ulang berikutnya.
        try {
          const cadangan = localStorage.getItem(PROFIL_KEY);
          if (cadangan) {
            const p = JSON.parse(cadangan) as ProfilTersimpan;
            setUser(p.user);
            setUsaha(p.usaha);
          }
        } catch {
          // cadangan rusak → abaikan; isLoggedIn hanya membutuhkan token
        }
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSession = useCallback(
    (data: { token: string; user: AuthUser; usaha: AuthUsaha }) => {
      localStorage.setItem(TOKEN_KEY, data.token);
      try {
        localStorage.setItem(PROFIL_KEY, JSON.stringify({ user: data.user, usaha: data.usaha }));
      } catch {
        // cadangan gagal ditulis → tetap lanjut, sesi bergantung pada token
      }
      setToken(data.token);
      setUser(data.user);
      setUsaha(data.usaha);
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password);
      saveSession(data);
    },
    [saveSession]
  );

  const register = useCallback(
    async (email: string, password: string, namaUsaha: string) => {
      const data = await authApi.register(email, password, namaUsaha);
      saveSession(data);
    },
    [saveSession]
  );

  const logout = useCallback(() => {
    akhiriSesi();
  }, [akhiriSesi]);

  return (
    <AuthCtx.Provider
      value={{
        token,
        user,
        usaha,
        // Sesi ditentukan oleh token, bukan oleh hasil satu request /auth/me.
        // Kalau request itu gagal sementara, user tetap masuk (lihat catch di
        // atas); token baru dibuang saat server menolaknya (401/403) atau saat
        // menekan Keluar.
        isLoggedIn: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

// Catatan: `useAuth` ada di `./auth-context` dan `ApiError` di `./api` —
// sengaja tidak di-re-export dari sini agar berkas ini hanya mengekspor
// komponen (React Refresh bisa hot-reload).
