/// <reference types="vite/client" />

interface Navigator {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
}

interface WakeLockSentinel {
  release(): Promise<void>;
}
