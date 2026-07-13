;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (typeof URL.createObjectURL !== "function") URL.createObjectURL = () => "blob:test";
if (typeof URL.revokeObjectURL !== "function") URL.revokeObjectURL = () => {};

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

const globalStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
if (!globalStorageDescriptor || globalStorageDescriptor.configurable) {
  Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true });
}
const windowStorageDescriptor = typeof window === "undefined" ? undefined : Object.getOwnPropertyDescriptor(window, "localStorage");
if (typeof window !== "undefined" && (!windowStorageDescriptor || windowStorageDescriptor.configurable)) {
  Object.defineProperty(window, "localStorage", { value: globalThis.localStorage, configurable: true });
}
