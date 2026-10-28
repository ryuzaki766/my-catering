// ===== Konteks sesi KateringKu =====
// Dipisah dari `auth.tsx` (yang memuat komponen AuthProvider) supaya berkas ini
// hanya berisi hook. Jika digabung, React Refresh tidak bisa hot-reload dan
// selalu melakukan reload penuh tiap kali file disimpan (lihat rule
// react-refresh/only-export-components).
import { createContext, useContext } from 'react';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthUsaha {
  id: string;
  nama: string;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  usaha: AuthUsaha | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, namaUsaha: string) => Promise<void>;
  logout: () => void;
}

export const AuthCtx = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
