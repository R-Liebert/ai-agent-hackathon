import { create } from "zustand";

interface ScrollState {
  showBorder: boolean;
  setShowBorder: (show: boolean) => void;
  showArrow: boolean;
  setShowArrow: (show: boolean) => void;
  scrollPosition: number;
  setScrollPosition: (position: number) => void;
  showProfileBorder: boolean;
  setShowProfileBorder: (show: boolean) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  showBorder: false,
  setShowBorder: (show: boolean) => set({ showBorder: show }),
  showArrow: false,
  setShowArrow: (show: boolean) => set({ showArrow: show }),
  scrollPosition: 0,
  setScrollPosition: (position: number) => set({ scrollPosition: position }),
  showProfileBorder: false,
  setShowProfileBorder: (show: boolean) => set({ showProfileBorder: show }),
}));
