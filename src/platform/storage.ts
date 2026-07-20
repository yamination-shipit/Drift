export type StoragePort = Readonly<{
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}>;

export const localStoragePort: StoragePort = {
  async get(key) {
    return window.localStorage.getItem(key);
  },
  async set(key, value) {
    window.localStorage.setItem(key, value);
  },
};
