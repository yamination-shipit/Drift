export type StoragePort = Readonly<{
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}>;

export const localStoragePort: StoragePort = {
  get(key) {
    return Promise.resolve().then(() => window.localStorage.getItem(key));
  },
  set(key, value) {
    return Promise.resolve().then(() => window.localStorage.setItem(key, value));
  },
};
