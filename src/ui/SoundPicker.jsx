import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Download,
  Monitor,
  Play,
  Volume2,
} from "lucide-react";
import { SOUND_PROFILES, SOUND_BY_ID } from "../soundProfiles";
import { useMallow } from "../store";
import { previewSound } from "../desktopBridge";
import { unlockAudio } from "../audio";

export function SoundPicker() {
  const soundMode = useMallow((state) => state.soundMode);
  const soundEnabled = useMallow((state) => state.soundEnabled);
  const desktopConnected = useMallow((state) => state.desktopConnected);
  const desktopVersion = useMallow((state) => state.desktopVersion);
  const setSoundMode = useMallow((state) => state.setSoundMode);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const current = SOUND_BY_ID[soundMode] || SOUND_PROFILES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      const insideTrigger = rootRef.current && rootRef.current.contains(event.target);
      const insidePanel = panelRef.current && panelRef.current.contains(event.target);
      if (!insideTrigger && !insidePanel) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (profile) => {
    unlockAudio();
    setSoundMode(profile.id);
    previewSound(profile.id);
    setOpen(false);
  };

  const portalTarget =
    typeof document !== "undefined"
      ? document.getElementById("overlay-root") || document.body
      : null;

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          className="sound-popover glass"
          initial={{ opacity: 0, y: -7, scale: 0.975 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        >
          <div className="sound-popover-head">
            <span className="eyebrow">switch sound</span>
            <span className="sound-volume-hint">
              {!soundEnabled ? "muted" : desktopConnected ? "system-wide" : "browser audio"}
            </span>
          </div>

          <div className="switch-options" role="listbox" aria-label="Switch sound profiles">
            {SOUND_PROFILES.map((profile) => {
              const active = profile.id === soundMode;
              return (
                <button
                  key={profile.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`switch-option ${active ? "is-active" : ""}`}
                  onClick={() => choose(profile)}
                >
                  <span className="switch-orb large" style={{ background: profile.color }} />
                  <span className="switch-option-copy">
                    <span className="switch-option-title">
                      <strong>{profile.name}</strong>
                      <em>{profile.family}</em>
                    </span>
                    <small>{profile.note}</small>
                  </span>
                  {active ? (
                    <span className="switch-check">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : (
                    <Play size={13} className="switch-play" />
                  )}
                </button>
              );
            })}
          </div>

          <div className={`desktop-strip ${desktopConnected ? "is-connected" : ""}`}>
            {desktopConnected ? (
              <>
                <span className="desktop-status-icon">
                  <Volume2 size={14} />
                </span>
                <span className="desktop-strip-copy">
                  <strong>MallowKeys is connected</strong>
                  <small>Every app · switch sounds · v{desktopVersion || "1.0"}</small>
                </span>
                <button
                  type="button"
                  className="desktop-test-button"
                  onClick={() => previewSound(soundMode)}
                >
                  test
                </button>
              </>
            ) : (
              <>
                <span className="desktop-status-icon">
                  <Monitor size={14} />
                </span>
                <span className="desktop-strip-copy">
                  <strong>Type in every app</strong>
                  <small>System-wide · no key logging</small>
                </span>
                <a
                  className="desktop-download-button"
                  href="downloads/MallowKeys.zip"
                  download
                  title="Download MallowKeys for Windows"
                >
                  <Download size={12} />
                  Get app
                </a>
              </>
            )}
          </div>

          {!desktopConnected && (
            <p className="sound-popover-foot">
              Browser audio only works while this tab is focused. The tray companion plays
              sounds system-wide.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="sound-picker" ref={rootRef}>
        <button
          type="button"
          className={`sound-picker-trigger ${open ? "is-open" : ""}`}
          onClick={() => {
            unlockAudio();
            setOpen((value) => !value);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Switch sound: ${current.name} ${current.family}`}
          title="Choose switch sound"
        >
          <span className="switch-orb" style={{ background: current.color }} />
          <span className="sound-current">
            <strong>{current.name}</strong>
            <small>{current.family}</small>
          </span>
          {desktopConnected && <span className="desktop-live-dot" aria-hidden="true" />}
          <ChevronDown size={13} className="chevron" />
        </button>
      </div>
      {portalTarget ? createPortal(panel, portalTarget) : panel}
    </>
  );
}
