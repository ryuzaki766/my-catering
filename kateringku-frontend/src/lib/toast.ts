// ===== Toast (notifikasi singkat di layar) =====
// Dipisah dari `components/shared.tsx` karena berkas itu memuat komponen;
// menaruh hook di file tersendiri membuat React Refresh bisa hot-reload
// (lihat rule react-refresh/only-export-components).
import { useState } from 'react';

export interface ToastData {
  id: number;
  pesan: string;
  tipe: 'sukses' | 'error';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const push = (pesan: string, tipe: 'sukses' | 'error' = 'sukses') => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, pesan, tipe }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), tipe === 'error' ? 4000 : 2400);
  };
  return { toasts, push };
}
