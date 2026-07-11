// Vitest global setup — mirrors the rate-lens setup so the jsdom environment
// has a working localStorage/sessionStorage and matchMedia. Pure-logic tests
// running in the default `node` environment are unaffected (the guards below
// short-circuit when `window` / the storage globals are already defined).

// Tell React this is an act-compatible environment so act(...) warnings quiet.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom does not implement matchMedia — provide a minimal mock.
if (typeof window !== 'undefined' && typeof (window as any).matchMedia !== 'function') {
  ;(window as any).matchMedia = (query: string): MediaQueryList => {
    const mql: MediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }
    return mql
  }
}

// In-memory localStorage / sessionStorage when the environment lacks them.
class MemStorage {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }
  getItem(k: string): string | null {
    return this.store.has(k) ? (this.store.get(k) as string) : null
  }
  setItem(k: string, v: string): void {
    this.store.set(k, String(v))
  }
  removeItem(k: string): void {
    this.store.delete(k)
  }
  clear(): void {
    this.store.clear()
  }
}

function installStorageMock(name: 'localStorage' | 'sessionStorage') {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name)
  if (!descriptor || descriptor.configurable) {
    Object.defineProperty(globalThis, name, {
      value: new MemStorage(),
      configurable: true,
      writable: true,
    })
  }
}

// Avoid invoking Node 26's localStorage getter during capability detection.
// Tests need worker-local memory, not Node's process-shared persistence file.
installStorageMock('localStorage')
installStorageMock('sessionStorage')

// jsdom 26 does not install localStorage/sessionStorage on `window` even when
// a non-opaque url is configured, but the i18n core reads `window.localStorage`.
// Mirror the global storage onto the jsdom window so persistence works in tests.
if (typeof window !== 'undefined' && (window as any).localStorage === undefined) {
  Object.defineProperty(window, 'localStorage', {
    value: (globalThis as any).localStorage,
    configurable: true,
  })
}
if (typeof window !== 'undefined' && (window as any).sessionStorage === undefined) {
  Object.defineProperty(window, 'sessionStorage', {
    value: (globalThis as any).sessionStorage,
    configurable: true,
  })
}
