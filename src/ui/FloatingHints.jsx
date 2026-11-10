import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, Layers, MousePointer2 } from "lucide-react";
import { KEYS, LAYER_BY_ID } from "../data";
import { useMallow } from "../store";

export function FloatingHints() {
  const hasInteracted = useMallow((state) => state.hasInteracted);
  const hoveredLayer = useMallow((state) => state.hoveredLayer);
  const hoveredSwitch = useMallow((state) => state.hoveredSwitch);
  const customizerOpen = useMallow((state) => state.customizerOpen);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 12000);
    return () => window.clearTimeout(timer);
  }, []);

  const layer = hoveredLayer ? LAYER_BY_ID[hoveredLayer] : null;
  const switchKey = hoveredSwitch != null ? KEYS[hoveredSwitch] : null;
  const showIntro = !hasInteracted && !timedOut && !customizerOpen && !hoveredSwitch;

  const anatomy = useMemo(
    () => [
      { label: "stem", color: "#e48a9c" },
      { label: "spring", color: "#d9b76e" },
      { label: "housings", color: "#d9cfc5" },
    ],
    []
  );

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="intro-hint glass"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <span>
              <MousePointer2 size={13} />
              drag to orbit
            </span>
            <i />
            <span>
              <Keyboard size={14} />
              press a key
            </span>
            <i />
            <span>
              <Layers size={13} />
              solo a layer
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {layer && !customizerOpen && (
          <motion.div
            className="layer-hover-hint"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
          >
            <span className="dot" style={{ background: layer.color }} />
            click to isolate <strong>{layer.name}</strong>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {switchKey && !customizerOpen && (
          <motion.div
            className="switch-anatomy glass"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
          >
            <div className="switch-anatomy-title">
              <span>peeking inside</span>
              <strong>{switchKey.label}</strong>
            </div>
            <div className="switch-anatomy-parts">
              {anatomy.map((part) => (
                <span key={part.label}>
                  <i style={{ background: part.color }} />
                  {part.label}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
