// Which Overview sections are open, remembered in this browser between visits.

export type SectionId = "today" | "money" | "next";
export type SectionState = Record<SectionId, boolean>;

export const SECTION_IDS: SectionId[] = ["today", "money", "next"];
/** Today holds the score and the missions, so it is the one section open on a first visit. */
export const DEFAULT_SECTIONS: SectionState = { today: true, money: false, next: false };

// The version is part of the key: a change to the shape gets a new key and old values are ignored.
const KEY = "finpath-overview-sections:v1";

/**
 * The saved state, or the default when nothing valid is stored.
 * Safe to call on the server (returns the default) and when storage is blocked.
 */
export function loadSections(): SectionState {
  if (typeof window === "undefined") return DEFAULT_SECTIONS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SECTIONS;
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== "object" || saved === null) return DEFAULT_SECTIONS;
    const out = { ...DEFAULT_SECTIONS };
    for (const id of SECTION_IDS) {
      const v = (saved as Record<string, unknown>)[id];
      if (typeof v === "boolean") out[id] = v;
    }
    return out;
  } catch {
    // Private browsing, blocked storage or a damaged value: fall back to the default.
    return DEFAULT_SECTIONS;
  }
}

export function saveSections(state: SectionState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage is full or blocked. The sections still work; they just won't be remembered.
  }
}
