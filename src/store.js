import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useMallow = create(
  persist(
    (set, get) => ({
      explode: 0,
      selectedLayer: null,
      hoveredLayer: null,
      hoveredSwitch: null,
      themeId: "strawberry",
      caseColorId: "blush",
      soundEnabled: true,
      soundMode: "thock",
      customizerOpen: false,
      hasInteracted: false,

      setExplode: (value) => {
        const explode = Math.min(1, Math.max(0, value));
        set({ explode, hasInteracted: true });
      },
      nudgeExplode: (delta) => {
        const explode = Math.min(1, Math.max(0, get().explode + delta));
        set({ explode, hasInteracted: true });
      },
      setLayer: (id) => {
        set({ selectedLayer: id, hasInteracted: true });
        document.dispatchEvent(new CustomEvent("mallow:layer", { detail: { id } }));
      },
      toggleLayer: (id) => {
        const next = get().selectedLayer === id ? null : id;
        set({ selectedLayer: next, hasInteracted: true });
        document.dispatchEvent(new CustomEvent("mallow:layer", { detail: { id: next } }));
      },
      clearLayer: () => {
        if (!get().selectedLayer) return;
        set({ selectedLayer: null });
        document.dispatchEvent(new CustomEvent("mallow:layer", { detail: { id: null } }));
      },
      setHoveredSwitch: (index) => {
        if (get().hoveredSwitch === index) return;
        set({ hoveredSwitch: index });
      },
      setHoveredLayer: (id) => {
        if (get().hoveredLayer === id) return;
        set({ hoveredLayer: id });
      },
      setTheme: (themeId) => {
        set({ themeId, hasInteracted: true });
      },
      setCaseColor: (caseColorId) => {
        set({ caseColorId, hasInteracted: true });
      },
      toggleSound: () => {
        const soundEnabled = !get().soundEnabled;
        set({ soundEnabled });
        if (soundEnabled) {
          document.dispatchEvent(new CustomEvent("mallow:audio-unlock"));
        }
      },
      setSoundMode: (soundMode) => {
        set({ soundMode });
        document.dispatchEvent(new CustomEvent("mallow:audio-unlock"));
      },
      toggleCustomizer: () => set({ customizerOpen: !get().customizerOpen }),
      setCustomizer: (customizerOpen) => set({ customizerOpen }),
      markInteracted: () => {
        if (!get().hasInteracted) set({ hasInteracted: true });
      },
    }),
    {
      name: "mallow68-settings",
      version: 1,
      partialize: (state) => ({
        themeId: state.themeId,
        caseColorId: state.caseColorId,
        soundEnabled: state.soundEnabled,
        soundMode: state.soundMode,
      }),
    }
  )
);
