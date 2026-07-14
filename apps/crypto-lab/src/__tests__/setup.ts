import '@testing-library/jest-dom/vitest'

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

installStorageMock('localStorage')
installStorageMock('sessionStorage')
