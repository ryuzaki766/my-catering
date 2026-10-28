// ===== Store KateringKu — Semua operasi via Backend API =====
import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { Bahan, DB, Menu, Pelanggan, Satuan, SatuanDasar, StatusPesanan } from './model';
import { keSatuanDasar } from './model';
import { StoreCtx, type Store, type PayloadPesanan } from './store-context';
import {
  bahanApi,
  menuApi,
  pelangganApi,
  pesananApi,
  ApiError,
  pesanError,
  type BahanAPI,
  type MenuAPI,
  type PelangganAPI,
  type PesananAPI,
} from './api';

// ===== Konversi Backend DTO → Frontend Model =====
function mapBahan(b: BahanAPI): Bahan {
  // Backend menyimpan harga dalam satuan dasar (g/ml/butir) sebagai `harga_per_satuan`
  return { id: b.id, nama: b.nama, satuan: b.satuan as Satuan, harga: b.harga_per_satuan };
}

function mapMenu(m: MenuAPI): Menu {
  return {
    id: m.id,
    nama: m.nama,
    hargaJual: m.harga_jual,
    aktif: m.aktif,
    emoji: m.emoji ?? '🍽️',
    resep: (m.resep ?? []).map((r) => ({ bahanId: r.bahan_id, takaran: r.takaran })),
  };
}

function mapPelanggan(p: PelangganAPI): Pelanggan {
  return { id: p.id, nama: p.nama, kontak: p.kontak ?? '' };
}

function mapPesanan(p: PesananAPI) {
  return {
    id: p.id,
    pelangganId: p.pelanggan_id,
    namaPelanggan: p.nama_pelanggan ?? '',
    tanggalKirim: p.tanggal_kirim,
    status: p.status as StatusPesanan,
    dp: p.dp ?? 0,
    catatan: p.catatan ?? '',
    dibuatPada: p.dibuat_pada,
    items: (p.items ?? []).map((it) => ({
      menuId: it.menu_id,
      jumlah: it.jumlah,
      hargaJualSnapshot: it.harga_jual_snapshot,
      hppSnapshot: it.hpp_snapshot,
    })),
  };
}

// ===== State & Action Types =====
interface StoreState {
  db: DB;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_ALL'; bahan: Bahan[]; menu: Menu[]; pelanggan: Pelanggan[]; pesanan: ReturnType<typeof mapPesanan>[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'ADD_BAHAN'; bahan: Bahan }
  | { type: 'UPD_BAHAN'; id: string; patch: Partial<Bahan> }
  | { type: 'DEL_BAHAN'; id: string }
  | { type: 'ADD_MENU'; menu: Menu }
  | { type: 'UPD_MENU'; id: string; patch: Partial<Menu> }
  | { type: 'DEL_MENU'; id: string }
  | { type: 'ADD_PELANGGAN'; pelanggan: Pelanggan }
  | { type: 'UPD_PELANGGAN'; id: string; patch: Partial<Pelanggan> }
  | { type: 'DEL_PELANGGAN'; id: string }
  | { type: 'ADD_PESANAN'; pesanan: ReturnType<typeof mapPesanan> }
  | { type: 'UPD_PESANAN'; pesanan: ReturnType<typeof mapPesanan> }
  | { type: 'UPD_STATUS'; id: string; status: StatusPesanan }
  | { type: 'UPD_DP'; id: string; dp: number }
  | { type: 'DEL_PESANAN'; id: string };

function reducer(state: StoreState, action: Action): StoreState {
  const { db } = state;
  switch (action.type) {
    case 'SET_ALL':
      return {
        ...state,
        loading: false,
        db: {
          bahan: action.bahan,
          menu: action.menu,
          pelanggan: action.pelanggan,
          pesanan: action.pesanan,
        },
      };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'ADD_BAHAN':
      return { ...state, db: { ...db, bahan: [...db.bahan, action.bahan] } };
    case 'UPD_BAHAN':
      return {
        ...state,
        db: { ...db, bahan: db.bahan.map((b) => (b.id === action.id ? { ...b, ...action.patch } : b)) },
      };
    case 'DEL_BAHAN':
      return { ...state, db: { ...db, bahan: db.bahan.filter((b) => b.id !== action.id) } };
    case 'ADD_MENU':
      return { ...state, db: { ...db, menu: [...db.menu, action.menu] } };
    case 'UPD_MENU':
      return {
        ...state,
        db: { ...db, menu: db.menu.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)) },
      };
    case 'DEL_MENU':
      return { ...state, db: { ...db, menu: db.menu.filter((m) => m.id !== action.id) } };
    case 'ADD_PELANGGAN':
      return { ...state, db: { ...db, pelanggan: [...db.pelanggan, action.pelanggan] } };
    case 'UPD_PELANGGAN':
      return {
        ...state,
        db: {
          ...db,
          pelanggan: db.pelanggan.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
        },
      };
    case 'DEL_PELANGGAN':
      return { ...state, db: { ...db, pelanggan: db.pelanggan.filter((p) => p.id !== action.id) } };
    case 'ADD_PESANAN':
      return { ...state, db: { ...db, pesanan: [action.pesanan, ...db.pesanan] } };
    case 'UPD_PESANAN':
      return {
        ...state,
        db: {
          ...db,
          pesanan: db.pesanan.map((p) => (p.id === action.pesanan.id ? action.pesanan : p)),
        },
      };
    case 'UPD_STATUS':
      return {
        ...state,
        db: {
          ...db,
          pesanan: db.pesanan.map((p) => (p.id === action.id ? { ...p, status: action.status } : p)),
        },
      };
    case 'UPD_DP':
      return {
        ...state,
        db: {
          ...db,
          pesanan: db.pesanan.map((p) => (p.id === action.id ? { ...p, dp: action.dp } : p)),
        },
      };
    case 'DEL_PESANAN':
      return { ...state, db: { ...db, pesanan: db.pesanan.filter((p) => p.id !== action.id) } };
    default:
      return state;
  }
}

// ===== Store, konteks & hook `useStore` berada di `./store-context.ts` =====
// Supaya berkas ini hanya mengekspor komponen (React Refresh bisa hot-reload).

const EMPTY_DB: DB = { bahan: [], menu: [], pelanggan: [], pesanan: [] };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    db: EMPTY_DB,
    loading: true,
    error: null,
  });

  const muat = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const [bahanRaw, menuRaw, pelangganRaw, pesananRaw] = await Promise.all([
        bahanApi.getAll(),
        menuApi.getAll(),
        pelangganApi.getAll(),
        pesananApi.getAll(),
      ]);
      dispatch({
        type: 'SET_ALL',
        bahan: bahanRaw.map(mapBahan),
        menu: menuRaw.map(mapMenu),
        pelanggan: pelangganRaw.map(mapPelanggan),
        pesanan: pesananRaw.map(mapPesanan),
      });
    } catch (err: unknown) {
      dispatch({ type: 'SET_ERROR', error: pesanError(err, 'Gagal memuat data dari server') });
    }
  }, []);

  // Muat data saat pertama kali mount
  useEffect(() => {
    muat();
  }, [muat]);

  const { db } = state;

  const bahanMap = useMemo(() => new Map(db.bahan.map((b) => [b.id, b])), [db.bahan]);
  const menuMap = useMemo(() => new Map(db.menu.map((m) => [m.id, m])), [db.menu]);
  const pelangganMap = useMemo(() => new Map(db.pelanggan.map((p) => [p.id, p])), [db.pelanggan]);

  // ===== BAHAN =====
  const tambahBahan = useCallback(async (b: Omit<Bahan, 'id'>): Promise<Bahan> => {
    // Konversi kg→g / liter→ml agar sesuai satuan dasar backend
    const dasar = keSatuanDasar(b.satuan, b.harga);
    if (!dasar) {
      throw new ApiError(`Satuan "${b.satuan}" belum didukung server`, 400);
    }
    const result = await bahanApi.create({
      nama: b.nama,
      satuan: dasar.satuan,
      harga_per_satuan: dasar.harga,
    });
    const bahan = mapBahan(result);
    dispatch({ type: 'ADD_BAHAN', bahan });
    // Dikembalikan agar pemanggil (mis. form Menu) bisa langsung memilihnya
    return bahan;
  }, []);

  const ubahBahan = useCallback(async (id: string, patch: Partial<Bahan>) => {
    const body: Partial<{ nama: string; satuan: SatuanDasar; harga_per_satuan: number }> = {};
    if (patch.nama !== undefined) body.nama = patch.nama;
    if (patch.satuan !== undefined) {
      const dasar = keSatuanDasar(patch.satuan, patch.harga ?? 0);
      if (!dasar) {
        throw new ApiError(`Satuan "${patch.satuan}" belum didukung server`, 400);
      }
      body.satuan = dasar.satuan;
      // Harga ikut dikonversi bila disertakan (form edit selalu mengirim keduanya)
      if (patch.harga !== undefined) body.harga_per_satuan = dasar.harga;
    } else if (patch.harga !== undefined) {
      body.harga_per_satuan = patch.harga; // harga tersimpan selalu dalam satuan dasar
    }
    const result = await bahanApi.update(id, body);
    dispatch({ type: 'UPD_BAHAN', id, patch: mapBahan(result) });
  }, []);

  const hapusBahan = useCallback(async (id: string) => {
    await bahanApi.delete(id);
    dispatch({ type: 'DEL_BAHAN', id });
  }, []);

  // ===== MENU =====
  const tambahMenu = useCallback(async (m: Omit<Menu, 'id'>) => {
    const result = await menuApi.create({
      nama: m.nama,
      harga_jual: m.hargaJual,
      aktif: m.aktif,
    });
    const mapped = mapMenu(result);
    // Jika ada resep, update resep sekalian
    if (m.resep && m.resep.length > 0) {
      await menuApi.updateResep(
        result.id,
        m.resep.map((r) => ({ bahan_id: r.bahanId, takaran: r.takaran }))
      );
      mapped.resep = m.resep;
    }
    dispatch({ type: 'ADD_MENU', menu: mapped });
  }, []);

  const ubahMenu = useCallback(async (id: string, patch: Partial<Menu>) => {
    const result = await menuApi.update(id, {
      nama: patch.nama,
      harga_jual: patch.hargaJual,
      aktif: patch.aktif,
    });
    const mapped = mapMenu(result);
    let patchMenu: Partial<Menu> = mapped;
    if (patch.resep !== undefined) {
      await menuApi.updateResep(
        id,
        patch.resep.map((r) => ({ bahan_id: r.bahanId, takaran: r.takaran }))
      );
      patchMenu = { ...mapped, resep: patch.resep };
    } else {
      // Respons backend `update` tidak memuat resep (menjadi [] setelah mapMenu).
      // Hilangkan `resep` dari patch agar resep lama di state tidak ikut tertimpa.
      const tanpaResep: Partial<Menu> = { ...mapped };
      delete tanpaResep.resep;
      patchMenu = tanpaResep;
    }
    dispatch({ type: 'UPD_MENU', id, patch: patchMenu });
  }, []);

  const hapusMenu = useCallback(async (id: string) => {
    await menuApi.delete(id);
    dispatch({ type: 'DEL_MENU', id });
  }, []);

  // ===== PELANGGAN =====
  const tambahPelanggan = useCallback(async (p: Omit<Pelanggan, 'id'>): Promise<Pelanggan> => {
    const result = await pelangganApi.create({ nama: p.nama, kontak: p.kontak });
    const mapped = mapPelanggan(result);
    dispatch({ type: 'ADD_PELANGGAN', pelanggan: mapped });
    return mapped;
  }, []);

  const ubahPelanggan = useCallback(async (id: string, patch: Partial<Pelanggan>) => {
    const result = await pelangganApi.update(id, { nama: patch.nama, kontak: patch.kontak });
    dispatch({ type: 'UPD_PELANGGAN', id, patch: mapPelanggan(result) });
  }, []);

  const hapusPelanggan = useCallback(async (id: string) => {
    await pelangganApi.delete(id);
    dispatch({ type: 'DEL_PELANGGAN', id });
  }, []);

  // ===== PESANAN =====
  // Backend mewajibkan `nama_pelanggan`: bila memakai pelanggan tersimpan,
  // namanya diambil dari daftar pelanggan (bukan hanya dari input nama baru).
  const kePayloadApi = useCallback(
    (p: PayloadPesanan) => ({
      pelanggan_id: p.pelangganId || null,
      nama_pelanggan: p.namaPelangganBaru || pelangganMap.get(p.pelangganId || '')?.nama || '',
      tanggal_kirim: p.tanggalKirim,
      dp: p.dp,
      catatan: p.catatan,
      items: p.items.map((it) => ({ menu_id: it.menuId, jumlah: it.jumlah })),
    }),
    [pelangganMap]
  );

  const tambahPesanan = useCallback(
    async (p: PayloadPesanan) => {
      const result = await pesananApi.create(kePayloadApi(p));
      dispatch({ type: 'ADD_PESANAN', pesanan: mapPesanan(result) });
    },
    [kePayloadApi]
  );

  const ubahPesanan = useCallback(
    async (id: string, p: PayloadPesanan) => {
      const result = await pesananApi.update(id, kePayloadApi(p));
      dispatch({ type: 'UPD_PESANAN', pesanan: mapPesanan(result) });
    },
    [kePayloadApi]
  );

  const ubahStatus = useCallback(async (id: string, s: StatusPesanan) => {
    if (s === 'batal') {
      await pesananApi.batal(id);
    } else {
      await pesananApi.updateStatus(id, s);
    }
    dispatch({ type: 'UPD_STATUS', id, status: s });
  }, []);

  const ubahDp = useCallback((id: string, dp: number) => {
    dispatch({ type: 'UPD_DP', id, dp });
  }, []);

  const hapusPesanan = useCallback(async (id: string) => {
    await pesananApi.delete(id);
    dispatch({ type: 'DEL_PESANAN', id });
  }, []);

  const store: Store = {
    db: state.db,
    loading: state.loading,
    error: state.error,
    bahanMap,
    menuMap,
    pelangganMap,
    tambahBahan,
    ubahBahan,
    hapusBahan,
    tambahMenu,
    ubahMenu,
    hapusMenu,
    tambahPelanggan,
    ubahPelanggan,
    hapusPelanggan,
    tambahPesanan,
    ubahPesanan,
    ubahStatus,
    ubahDp,
    hapusPesanan,
    muat,
  };

  return <StoreCtx.Provider value={store}>{children}</StoreCtx.Provider>;
}
