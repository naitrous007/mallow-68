import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Palette, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useMallow } from "../store";
import { playKey, unlockAudio } from "../audio";

function PressPulse() {
  const [pressed, setPressed] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    const onKey = (event) => {
      setPressed({ ...event.detail, stamp: Date.now() });
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setPressed(null), 900);
    };
    document.addEventListener("mallow:key", onKey);
    return () => {
      document.removeEventListener("mallow:key", onKey);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="press-readout" aria-hidden="true">
      <span className="press-readout-label">now pressing</span>
      <div className="press-readout-stage">
        <AnimatePresence mode="popLayout">
          {pressed ? (
            <motion.span
              key={pressed.stamp}
              className="mini-keycap"
              initial={{ y: 7, scale: 0.72, rotate: -7, opacity: 0 }}
              animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }}
              exit={{ y: -8, scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              {pressed.label}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              className="press-idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <i />
              <i />
              <i />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function TopBar() {
  const soundEnabled = useMallow((state) => state.soundEnabled);
  const soundMode = useMallow((state) => state.soundMode);
  const customizerOpen = useMallow((state) => state.customizerOpen);
  const toggleSound = useMallow((state) => state.toggleSound);
  const setSoundMode = useMallow((state) => state.setSoundMode);
  const toggleCustomizer = useMallow((state) => state.toggleCustomizer);

  const handleSound = () => {
    unlockAudio();
    const wasEnabled = soundEnabled;
    toggleSound();
    if (!wasEnabled) {
      window.setTimeout(() => playKey(soundMode), 60);
    }
  };

  const handleMode = (mode) => {
    if (mode === soundMode) return;
    unlockAudio();
    setSoundMode(mode);
    if (soundEnabled) {
      window.setTimeout(() => playKey(mode, 0.8), 30);
    }
  };

  return (
    <header className="topbar">
      <div className="brand" aria-label="Mallow 68 keyboard">
        <div className="brand-keycap" aria-hidden="true">
          <Sparkles size={16} strokeWidth={2.2} />
        </div>
        <div className="brand-copy">
          <div className="brand-line">
            <span className="brand-word">mallow</span>
            <span className="brand-badge">68</span>
          </div>
          <span className="brand-tagline">a soft little mechanical</span>
        </div>
      </div>

      <PressPulse />

      <div className="toolbar glass" aria-label="Sound and appearance controls">
        <button
          type="button"
          className={`icon-button ${soundEnabled ? "is-on" : "is-off"}`}
          onClick={handleSound}
          aria-label={soundEnabled ? "Turn sound off" : "Turn sound on"}
          title={soundEnabled ? "Sound on" : "Sound off"}
        >
          {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          {soundEnabled && (
            <span className="sound-bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          )}
        </button>

        <span className="toolbar-divider" aria-hidden="true" />

        <div className="sound-modes" role="group" aria-label="Key sound style">
          {["thock", "clack"].map((mode) => (
            <button
              key={mode}
              type="button"
              className={soundMode === mode ? "active" : ""}
              onClick={() => handleMode(mode)}
              aria-pressed={soundMode === mode}
            >
              {mode}
            </button>
          ))}
        </div>

        <span className="toolbar-divider" aria-hidden="true" />

        <button
          type="button"
          className={`toolbar-button ${customizerOpen ? "active" : ""}`}
          onClick={() => {
            unlockAudio();
            toggleCustomizer();
          }}
          aria-expanded={customizerOpen}
          aria-label="Open keyboard customizer"
        >
          <Palette size={17} />
          <span className="customizer-label">Customize</span>
        </button>
      </div>
    </header>
  );
}
