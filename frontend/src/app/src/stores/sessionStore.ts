import { create } from "zustand";

export type RetryFn = () => Promise<any>;

type SessionState = {
  isExpired: boolean;
  draining: boolean;
  queue: RetryFn[];
  markExpired: () => void;
  clearExpired: () => void;
  enqueueRetry: (fn: RetryFn) => void;
  drainQueue: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  isExpired: false,
  draining: false,
  queue: [],
  markExpired: () => set({ isExpired: true }),
  clearExpired: () => set({ isExpired: false }),
  enqueueRetry: (fn) => set((s) => ({ queue: [...s.queue, fn] })),
  drainQueue: async () => {
    const { draining } = get();
    if (draining) return;
    set({ draining: true });
    try {
      // Drain in FIFO order
      while (true) {
        const next = get().queue[0];
        if (!next) break;
        // eslint-disable-next-line no-await-in-loop
        await next().catch(() => {});
        set((s) => ({ queue: s.queue.slice(1) }));
      }
    } finally {
      set({ draining: false, queue: [] });
    }
  },
}));


