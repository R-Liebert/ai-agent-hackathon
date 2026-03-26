import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

// Check if we're on mobile (matches the sm breakpoint from Sidebar.tsx)
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 600;
};

const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      // Initialize as closed by default
      isSidebarOpen: false,
      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
        })),
      closeSidebar: () =>
        set(() => ({
          isSidebarOpen: false,
        })),
    }),
    {
      name: "sidebar-state", // Key to store in local storage
      // Custom merge function to respect mobile state on rehydration
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as object) };
        // Force close on mobile regardless of persisted state
        if (isMobileDevice()) {
          merged.isSidebarOpen = false;
        }
        return merged;
      },
    }
  )
);

export default useSidebarStore;
