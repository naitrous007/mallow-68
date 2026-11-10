import { useMallow } from "./store";
import { isSoundId } from "./soundProfiles";
import { playKey, unlockAudio } from "./audio";

const BRIDGE_URL = "http://127.0.0.1:43783";
const POLL_MS = 4500;
const REQUEST_TIMEOUT = 900;

let started = false;
let pollTimer = null;
let localChangeAt = 0;
let adopting = false;
let cleanupStore = null;

async function request(path, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(BRIDGE_URL + path, {
      ...options,
      mode: "cors",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!response.ok) throw new Error(`Bridge HTTP ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

function setDesktop(connected, version = "") {
  const state = useMallow.getState();
  state.setDesktopConnected(connected, version);
}

async function postConfig() {
  const state = useMallow.getState();
  if (!state.desktopConnected) return;
  try {
    await request(
      "/config",
      {
        method: "POST",
        body: JSON.stringify({
          mode: state.soundMode,
          enabled: state.soundEnabled,
        }),
      },
      1400
    );
  } catch {
    setDesktop(false);
  }
}

function adoptRemote(state) {
  const mode = isSoundId(state.mode) ? state.mode : null;
  const enabled = state.enabled !== false;
  const store = useMallow.getState();
  adopting = true;
  useMallow.setState({
    desktopConnected: true,
    desktopVersion: typeof state.version === "string" ? state.version : "",
    ...(mode ? { soundMode: mode } : {}),
    soundEnabled: enabled,
  });
  if (store.soundMode !== mode || store.soundEnabled !== enabled) {
    localChangeAt = Date.now();
  }
  window.setTimeout(() => {
    adopting = false;
  }, 0);
}

async function poll() {
  try {
    const state = await request("/state");
    if (!state || state.app !== "MallowKeys") throw new Error("Not MallowKeys");
    const current = useMallow.getState();
    if (!current.desktopConnected) {
      adoptRemote(state);
      return;
    }
    setDesktop(true, typeof state.version === "string" ? state.version : "");
    if (Date.now() - localChangeAt > 5000) {
      const mode = isSoundId(state.mode) ? state.mode : current.soundMode;
      const enabled = state.enabled !== false;
      if (mode !== current.soundMode || enabled !== current.soundEnabled) {
        adopting = true;
        useMallow.setState({ soundMode: mode, soundEnabled: enabled });
        window.setTimeout(() => {
          adopting = false;
        }, 0);
      }
    }
  } catch {
    if (useMallow.getState().desktopConnected) setDesktop(false);
  }
}

/** Start the optional local bridge to the Windows tray companion. */
export function startDesktopBridge() {
  if (started) return () => {};
  started = true;
  cleanupStore = useMallow.subscribe((state, previous) => {
    if (adopting) return;
    if (
      state.soundMode !== previous.soundMode ||
      state.soundEnabled !== previous.soundEnabled
    ) {
      localChangeAt = Date.now();
      if (state.desktopConnected) postConfig();
    }
  });
  poll();
  pollTimer = window.setInterval(poll, POLL_MS);
  return () => {
    started = false;
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = null;
    if (cleanupStore) cleanupStore();
    cleanupStore = null;
  };
}

/** Play a preview through the tray app when available, else in the browser. */
export async function previewSound(mode) {
  unlockAudio();
  const state = useMallow.getState();
  if (!state.soundEnabled) return;
  if (state.desktopConnected) {
    try {
      await request(
        "/test",
        {
          method: "POST",
          body: JSON.stringify({ mode }),
        },
        900
      );
      return;
    } catch {
      setDesktop(false);
    }
  }
  if (state.soundEnabled) playKey(mode, 1);
}

export function desktopBridgeUrl() {
  return BRIDGE_URL;
}
