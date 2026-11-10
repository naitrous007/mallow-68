export const SOUND_PROFILES = [
  {
    id: "red",
    name: "Red",
    family: "Linear",
    note: "smooth, deep, no click",
    color: "#df7e90",
    softColor: "#f6d9df",
  },
  {
    id: "brown",
    name: "Brown",
    family: "Tactile",
    note: "soft bump, warm thock",
    color: "#b7835e",
    softColor: "#f1e2d5",
  },
  {
    id: "blue",
    name: "Blue",
    family: "Clicky",
    note: "crisp click, bright ping",
    color: "#6f9fcb",
    softColor: "#dce9f4",
  },
  {
    id: "thock",
    name: "Thock",
    family: "Soft",
    note: "low, rounded, mellow",
    color: "#c2a46c",
    softColor: "#f0e6d2",
  },
  {
    id: "clack",
    name: "Clack",
    family: "Sharp",
    note: "tight, bright, snappy",
    color: "#8aa9a8",
    softColor: "#deeceb",
  },
];

export const SOUND_BY_ID = Object.fromEntries(SOUND_PROFILES.map((profile) => [profile.id, profile]));
export const SOUND_IDS = SOUND_PROFILES.map((profile) => profile.id);
export const DEFAULT_SOUND = "red";

export function isSoundId(value) {
  return Boolean(value && SOUND_BY_ID[value]);
}
