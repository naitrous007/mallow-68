/* ------------------------------------------------------------------
   MALLOW 68 — keyboard layout, themes, and layer definitions
------------------------------------------------------------------- */

export const TOTAL_U = 16;
export const KEY_GAP = 0.1;
export const ROW_STEP = 1.06;

const rows = [
  [
    { id: "esc", code: "Escape", label: "ESC", w: 1, kind: "accent" },
    { id: "num1", code: "Digit1", label: "1", w: 1 },
    { id: "num2", code: "Digit2", label: "2", w: 1 },
    { id: "num3", code: "Digit3", label: "3", w: 1 },
    { id: "num4", code: "Digit4", label: "4", w: 1 },
    { id: "num5", code: "Digit5", label: "5", w: 1 },
    { id: "num6", code: "Digit6", label: "6", w: 1 },
    { id: "num7", code: "Digit7", label: "7", w: 1 },
    { id: "num8", code: "Digit8", label: "8", w: 1 },
    { id: "num9", code: "Digit9", label: "9", w: 1 },
    { id: "num0", code: "Digit0", label: "0", w: 1 },
    { id: "minus", code: "Minus", label: "−", w: 1 },
    { id: "equal", code: "Equal", label: "=", w: 1 },
    { id: "backspace", code: "Backspace", label: "BACK", w: 2, kind: "mod" },
    { id: "delete", code: "Delete", label: "DEL", w: 1, kind: "mod" },
  ],
  [
    { id: "tab", code: "Tab", label: "TAB", w: 1.5, kind: "mod" },
    { id: "q", code: "KeyQ", label: "Q" },
    { id: "w", code: "KeyW", label: "W" },
    { id: "e", code: "KeyE", label: "E" },
    { id: "r", code: "KeyR", label: "R" },
    { id: "t", code: "KeyT", label: "T" },
    { id: "y", code: "KeyY", label: "Y" },
    { id: "u", code: "KeyU", label: "U" },
    { id: "i", code: "KeyI", label: "I" },
    { id: "o", code: "KeyO", label: "O" },
    { id: "p", code: "KeyP", label: "P" },
    { id: "bracket-left", code: "BracketLeft", label: "[", w: 1 },
    { id: "bracket-right", code: "BracketRight", label: "]", w: 1 },
    { id: "backslash", code: "Backslash", label: "\\", w: 1.5, kind: "mod" },
    { id: "pgup", code: "PageUp", label: "PGUP", w: 1, kind: "mod" },
  ],
  [
    { id: "caps", code: "CapsLock", label: "CAPS", w: 1.75, kind: "mod" },
    { id: "a", code: "KeyA", label: "A" },
    { id: "s", code: "KeyS", label: "S" },
    { id: "d", code: "KeyD", label: "D" },
    { id: "f", code: "KeyF", label: "F" },
    { id: "g", code: "KeyG", label: "G" },
    { id: "h", code: "KeyH", label: "H" },
    { id: "j", code: "KeyJ", label: "J" },
    { id: "k", code: "KeyK", label: "K" },
    { id: "l", code: "KeyL", label: "L" },
    { id: "semicolon", code: "Semicolon", label: ";" },
    { id: "quote", code: "Quote", label: "'" },
    { id: "enter", code: "Enter", label: "ENTER", w: 2.25, kind: "accent" },
    { id: "pgdn", code: "PageDown", label: "PGDN", w: 1, kind: "mod" },
  ],
  [
    { id: "shift-left", code: "ShiftLeft", label: "SHIFT", w: 2.25, kind: "mod" },
    { id: "z", code: "KeyZ", label: "Z" },
    { id: "x", code: "KeyX", label: "X" },
    { id: "c", code: "KeyC", label: "C" },
    { id: "v", code: "KeyV", label: "V" },
    { id: "b", code: "KeyB", label: "B" },
    { id: "n", code: "KeyN", label: "N" },
    { id: "m", code: "KeyM", label: "M" },
    { id: "comma", code: "Comma", label: "," },
    { id: "period", code: "Period", label: "." },
    { id: "slash", code: "Slash", label: "/" },
    { id: "shift-right", code: "ShiftRight", label: "SHIFT", w: 1.75, kind: "mod" },
    { id: "up", code: "ArrowUp", label: "↑", w: 1, kind: "accent" },
    { id: "end", code: "End", label: "END", w: 1, kind: "mod" },
  ],
  [
    { id: "ctrl-left", code: "ControlLeft", label: "CTRL", w: 1.25, kind: "mod" },
    { id: "win", code: "MetaLeft", label: "WIN", w: 1.25, kind: "mod" },
    { id: "alt-left", code: "AltLeft", label: "ALT", w: 1.25, kind: "mod" },
    { id: "space", code: "Space", label: "MALLOW", w: 6.25, kind: "mod" },
    { id: "alt-right", code: "AltRight", label: "ALT", w: 1, kind: "mod" },
    { id: "fn", code: "Fn", label: "FN", w: 1, kind: "mod" },
    { id: "ctrl-right", code: "ControlRight", label: "CTRL", w: 1, kind: "mod" },
    { id: "left", code: "ArrowLeft", label: "←", w: 1, kind: "accent" },
    { id: "down", code: "ArrowDown", label: "↓", w: 1, kind: "accent" },
    { id: "right", code: "ArrowRight", label: "→", w: 1, kind: "accent" },
  ],
];

export const KEYS = rows.flatMap((row, rowIndex) => {
  let cursor = 0;
  return row.map((key) => {
    const width = key.w ?? 1;
    const x = cursor + width / 2 - TOTAL_U / 2;
    cursor += width;
    return {
      ...key,
      w: width,
      x,
      z: (rowIndex - (rows.length - 1) / 2) * ROW_STEP,
      row: rowIndex,
      kind: key.kind || "alpha",
    };
  });
});

export const KEY_BY_CODE = Object.fromEntries(
  KEYS.filter((key) => key.code !== "Fn").map((key) => [key.code, key])
);

export const KEY_BY_ID = Object.fromEntries(KEYS.map((key) => [key.id, key]));

export const THEMES = [
  {
    id: "strawberry",
    name: "Strawberry Milk",
    note: "sweet + creamy",
    alpha: "#fff0df",
    mod: "#f2b7c4",
    accent: "#dc6f86",
    legend: "#6d454c",
    glow: "#f39bb0",
    swatches: ["#fff0df", "#f2b7c4", "#dc6f86"],
  },
  {
    id: "matcha",
    name: "Matcha Latte",
    note: "calm + soft",
    alpha: "#f4eed8",
    mod: "#c2d4b4",
    accent: "#7c9f6b",
    legend: "#4a573d",
    glow: "#aecb9d",
    swatches: ["#f4eed8", "#c2d4b4", "#7c9f6b"],
  },
  {
    id: "lavender",
    name: "Lavender Haze",
    note: "dreamy + mellow",
    alpha: "#f4ebf7",
    mod: "#d2c0e6",
    accent: "#9b7bc8",
    legend: "#52425f",
    glow: "#c2aae4",
    swatches: ["#f4ebf7", "#d2c0e6", "#9b7bc8"],
  },
  {
    id: "peach",
    name: "Peach Soda",
    note: "bright + fizzy",
    alpha: "#fff0dc",
    mod: "#f6c5ae",
    accent: "#e98465",
    legend: "#684438",
    glow: "#f6a98d",
    swatches: ["#fff0dc", "#f6c5ae", "#e98465"],
  },
  {
    id: "blueberry",
    name: "Blueberry Cream",
    note: "cool + comfy",
    alpha: "#edf3f5",
    mod: "#c0d4e4",
    accent: "#729dc7",
    legend: "#3d5062",
    glow: "#9ec1df",
    swatches: ["#edf3f5", "#c0d4e4", "#729dc7"],
  },
  {
    id: "cocoa",
    name: "Cocoa Cream",
    note: "warm + cozy",
    alpha: "#f3e7d9",
    mod: "#d5bba6",
    accent: "#9f7359",
    legend: "#47352b",
    glow: "#ceac94",
    swatches: ["#f3e7d9", "#d5bba6", "#9f7359"],
  },
];

export const CASE_COLORS = [
  { id: "blush", name: "Blush", color: "#e5b9bd" },
  { id: "cream", name: "Oat Cream", color: "#e8dac6" },
  { id: "sage", name: "Sage", color: "#bfd0ba" },
  { id: "lilac", name: "Lilac", color: "#cfc0e1" },
  { id: "sky", name: "Sky", color: "#bed2e3" },
  { id: "butter", name: "Butter", color: "#e9d49a" },
];

export const THEME_BY_ID = Object.fromEntries(THEMES.map((theme) => [theme.id, theme]));
export const CASE_BY_ID = Object.fromEntries(CASE_COLORS.map((color) => [color.id, color]));

export const LAYERS = [
  {
    id: "keycaps",
    no: "01",
    name: "Keycaps",
    sub: "68 PBT caps",
    info: "PBT · cherry profile",
    color: "#e48a9c",
    lift: 3.35,
    slide: 0,
    drift: 0,
    window: [0, 0.52],
  },
  {
    id: "switches",
    no: "02",
    name: "Switches",
    sub: "linear · 45g",
    info: "hot-swap · lubed",
    color: "#d8a864",
    lift: 2.55,
    slide: 0,
    drift: 0,
    window: [0.14, 0.7],
  },
  {
    id: "plate",
    no: "03",
    name: "Plate",
    sub: "gasket mounted",
    info: "brushed aluminum",
    color: "#98a7ae",
    lift: 1.85,
    slide: 0,
    drift: 0,
    window: [0.29, 0.82],
  },
  {
    id: "foam",
    no: "04",
    name: "Foam",
    sub: "poron dampener",
    info: "3.5mm · soft landing",
    color: "#d8c39f",
    lift: 1.28,
    slide: 0,
    drift: 0,
    window: [0.42, 0.9],
  },
  {
    id: "pcb",
    no: "05",
    name: "PCB",
    sub: "hot-swap · USB-C",
    info: "QMK · gold traces",
    color: "#7ea183",
    lift: 0.82,
    slide: 0,
    drift: 0,
    window: [0.55, 0.95],
  },
  {
    id: "case",
    no: "06",
    name: "Bottom Case",
    sub: "silicone feet",
    info: "ABS · soft-touch",
    color: "#c7a7a7",
    lift: 0,
    slide: 0.9,
    drift: 0,
    window: [0.67, 1],
  },
];

export const LAYER_BY_ID = Object.fromEntries(LAYERS.map((layer) => [layer.id, layer]));

export const CASE_SIZE = {
  width: 17.3,
  depth: 6.72,
  floorY: -0.34,
  wallHeight: 0.54,
  wallThickness: 0.3,
};

export const BOARD_Y = {
  caseFloor: -0.34,
  pcb: -0.12,
  foam: -0.055,
  plate: 0.085,
  switchBase: 0.27,
  stem: 0.415,
  keycap: 0.595,
};

/** Sharp, readable gradient helper for case parts. */
export function shade(hex, amount) {
  const value = hex.replace("#", "");
  const num = parseInt(value, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  if (amount >= 0) {
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
  } else {
    const k = 1 + amount;
    r = Math.round(r * k);
    g = Math.round(g * k);
    b = Math.round(b * k);
  }
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function keyColor(key, theme) {
  if (key.kind === "accent") return theme.accent;
  if (key.kind === "mod") return theme.mod;
  return theme.alpha;
}

/** Get a staggered lift target for a layer from the global 0..1 explode value. */
export function layerProgress(layer, explode) {
  const [start, end] = layer.window;
  const t = Math.min(1, Math.max(0, (explode - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function stageLabel(explode) {
  if (explode < 0.035) return "all together";
  if (explode < 0.22) return "caps floating up";
  if (explode < 0.4) return "switches lifting out";
  if (explode < 0.56) return "plate coming loose";
  if (explode < 0.72) return "foam + PCB dropping";
  if (explode < 0.94) return "case settling down";
  return "fully unstacked";
}
