/**
 * Regresi bug "Rp0": angka beranimasi pernah macet di 0 karena
 * requestAnimationFrame tidak pernah terpanggil saat tab tersembunyi.
 * Test ini memaksa dua kondisi itu dan memastikan angka tetap sampai ke nilai akhir.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AnimatedNumber } from './shared';
import { rp } from '@/lib/model';

// Wajib ada supaya React menganggap update di sini berada dalam `act`.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

/** Satu instance jsdom dipakai untuk seluruh file → visibilitas harus di-set ulang tiap test. */
function setVisibilitas(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  });
}

beforeEach(() => {
  setVisibilitas(false); // tiap test diawali dengan dokumen terlihat
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

/** rAF buatan: callback dipanggil tiap 1 ms dengan waktu sungguhan. */
function pasangRafBuatan() {
  vi.stubGlobal(
    'requestAnimationFrame',
    (cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 1)
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
}

const tunggu = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('AnimatedNumber', () => {
  it('tanpa requestAnimationFrame → langsung nilai akhir (bug lama: macet Rp0)', () => {
    vi.stubGlobal('requestAnimationFrame', undefined);
    act(() => {
      root.render(<AnimatedNumber value={987654} format={rp} />);
    });
    expect(container.textContent).toBe('Rp987.654');
  });

  it('tab tersembunyi → langsung nilai akhir tanpa animasi', () => {
    setVisibilitas(true);

    act(() => {
      root.render(<AnimatedNumber value={987654} format={rp} />);
    });
    expect(container.textContent).toBe('Rp987.654');
  });

  it('animasi normal berakhir tepat di nilai akhir', async () => {
    pasangRafBuatan();
    act(() => {
      root.render(<AnimatedNumber value={987654} format={rp} duration={20} />);
    });
    expect(container.textContent).toBe('Rp0'); // masih di awal animasi

    await act(async () => {
      await tunggu(300);
    });
    expect(container.textContent).toBe('Rp987.654');
  });

  it('saat nilai berubah → berakhir di nilai baru', async () => {
    pasangRafBuatan();
    act(() => {
      root.render(<AnimatedNumber value={1000} format={rp} duration={20} />);
    });
    await act(async () => {
      await tunggu(300);
    });
    expect(container.textContent).toBe('Rp1.000');

    act(() => {
      root.render(<AnimatedNumber value={5000} format={rp} duration={20} />);
    });
    await act(async () => {
      await tunggu(300);
    });
    expect(container.textContent).toBe('Rp5.000');
  });
});
