import '@testing-library/jest-dom/vitest'

// jsdom does not implement matchMedia — provide a minimal mock.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => {
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

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemStorage(),
    configurable: true,
    writable: true,
  })
}
if (typeof globalThis.sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: new MemStorage(),
    configurable: true,
    writable: true,
  })
}
