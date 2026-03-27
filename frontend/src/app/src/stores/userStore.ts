import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccountInfo } from "../hooks/useMsalMock";

export interface UserProfile {
  name?: string;
  email?: string;
}

interface UserStoreState {
  profile: UserProfile | null;
  hydrating: boolean;
  hydrated: boolean;
  selfRestricted: boolean;

  setFromMsalAccount: (account?: AccountInfo) => void;
  ensureHydrated: (account?: AccountInfo) => Promise<UserProfile>;
  reset: () => void;
  toggleSelfRestriction: () => void; // Toggle method for user links visibility
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      profile: null,
      hydrating: false,
      hydrated: false,
      selfRestricted: false,

      setFromMsalAccount: (account) => {
        if (!account) return;
        const profile: UserProfile = {
          name: account.name || undefined,
          email: account.username || undefined,
        };
        set({ profile, hydrated: true });
      },

      ensureHydrated: async (account) => {
        if (get().hydrated) {
          return get().profile!;
        }

        set({ hydrating: true });
        try {
          if (account) {
            get().setFromMsalAccount(account);
          }
        } finally {
          set({ hydrating: false, hydrated: true });
        }

        return get().profile!;
      },

      reset: () => set({ profile: null, hydrated: false, hydrating: false }),

      toggleSelfRestriction: () => {
        // Toggle the selfRestricted property
        set((state) => ({ ...state, selfRestricted: !state.selfRestricted }));
      },
    }),
    {
      name: "user-store",
      partialize: (state) => ({
        profile: state.profile,
        hydrated: state.hydrated,
        selfRestricted: state.selfRestricted, // Persist selfRestricted in storage
      }),
    },
  ),
);
