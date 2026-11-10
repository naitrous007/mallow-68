import { AnimatePresence, motion } from "framer-motion";
import { Check, Download, Monitor, Palette, Shuffle, Volume2, X } from "lucide-react";
import { CASE_COLORS, THEMES } from "../data";
import { useMallow } from "../store";
import { playPop, unlockAudio } from "../audio";

export function Customizer() {
  const open = useMallow((state) => state.customizerOpen);
  const setCustomizer = useMallow((state) => state.setCustomizer);
  const themeId = useMallow((state) => state.themeId);
  const caseColorId = useMallow((state) => state.caseColorId);
  const setTheme = useMallow((state) => state.setTheme);
  const setCaseColor = useMallow((state) => state.setCaseColor);
  const soundEnabled = useMallow((state) => state.soundEnabled);
  const desktopConnected = useMallow((state) => state.desktopConnected);
  const desktopVersion = useMallow((state) => state.desktopVersion);
  const currentTheme = THEMES.find((theme) => theme.id === themeId) || THEMES[0];

  const pop = () => {
    if (soundEnabled) playPop();
  };

  const chooseTheme = (id) => {
    unlockAudio();
    setTheme(id);
    pop();
  };

  const chooseCase = (id) => {
    unlockAudio();
    setCaseColor(id);
    pop();
  };

  const surprise = () => {
    unlockAudio();
    const nextTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const nextCase = CASE_COLORS[Math.floor(Math.random() * CASE_COLORS.length)];
    setTheme(nextTheme.id);
    setCaseColor(nextCase.id);
    pop();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            className="customizer-scrim"
            type="button"
            aria-label="Close customizer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCustomizer(false)}
          />
          <motion.aside
            className="customizer glass"
            aria-label="Keyboard customizer"
            initial={{ opacity: 0, x: 34, y: 0, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, y: 8, scale: 0.985 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            <span className="sheet-handle" aria-hidden="true" />
            <div className="customizer-head">
              <div>
                <div className="eyebrow">
                  <Palette size={12} />
                  <span>make it yours</span>
                </div>
                <h2>Customizer</h2>
              </div>
              <div className="customizer-head-actions">
                <button
                  type="button"
                  className="icon-button subtle"
                  onClick={surprise}
                  aria-label="Surprise me with a random theme"
                  title="Surprise me"
                >
                  <Shuffle size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button subtle"
                  onClick={() => setCustomizer(false)}
                  aria-label="Close customizer"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="live-preview">
              <span>live preview</span>
              <div className="live-keys" aria-hidden="true">
                {["Q", "W", "E", "R"].map((key, index) => (
                  <i
                    key={key}
                    style={{
                      background:
                        index === 3 ? currentTheme.accent : index === 2 ? currentTheme.mod : currentTheme.alpha,
                      color: currentTheme.legend,
                    }}
                  >
                    {key}
                  </i>
                ))}
              </div>
            </div>

            <section className="customizer-section">
              <div className="section-title">
                <h3>Keycap theme</h3>
                <span>{THEMES.length} flavors</span>
              </div>
              <div className="theme-grid">
                {THEMES.map((theme) => {
                  const active = theme.id === themeId;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      className={`theme-card ${active ? "is-active" : ""}`}
                      onClick={() => chooseTheme(theme.id)}
                      aria-pressed={active}
                    >
                      <span className="theme-preview" aria-hidden="true">
                        <i style={{ background: theme.alpha }}>A</i>
                        <i style={{ background: theme.mod }}>S</i>
                        <i style={{ background: theme.accent }}>D</i>
                      </span>
                      <span className="theme-copy">
                        <strong>{theme.name}</strong>
                        <small>{theme.note}</small>
                      </span>
                      {active && (
                        <span className="check-badge" aria-hidden="true">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="customizer-section">
              <div className="section-title">
                <h3>Case color</h3>
                <span>soft-touch ABS</span>
              </div>
              <div className="case-swatches">
                {CASE_COLORS.map((item) => {
                  const active = item.id === caseColorId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`case-swatch ${active ? "is-active" : ""}`}
                      onClick={() => chooseCase(item.id)}
                      aria-pressed={active}
                      title={item.name}
                    >
                      <span className="swatch-color" style={{ background: item.color }}>
                        {active && <Check size={13} strokeWidth={3} />}
                      </span>
                      <small>{item.name}</small>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="customizer-section">
              <div className="section-title">
                <h3>Use it everywhere</h3>
                <span>Windows companion</span>
              </div>
              <div className={`companion-card ${desktopConnected ? "is-connected" : ""}`}>
                <span className="companion-icon">
                  {desktopConnected ? <Volume2 size={16} /> : <Monitor size={16} />}
                </span>
                <div className="companion-copy">
                  {desktopConnected ? (
                    <>
                      <strong>
                        System-wide sounds are on <i className="companion-live-dot" />
                      </strong>
                      <small>
                        MallowKeys v{desktopVersion || "1.0"} is in your tray. Type in any app.
                      </small>
                    </>
                  ) : (
                    <>
                      <strong>Type outside this browser</strong>
                      <small>
                        Download the tiny tray app for switch sounds across Windows. No keystrokes
                        are logged or sent.
                      </small>
                    </>
                  )}
                </div>
                {desktopConnected ? (
                  <span className="companion-state">live</span>
                ) : (
                  <a
                    className="companion-download"
                    href="downloads/MallowKeys.zip"
                    download
                    title="Download MallowKeys for Windows"
                  >
                    <Download size={12} />
                    Windows
                  </a>
                )}
              </div>
            </section>

            <div className="customizer-foot">
              <span className="pulse-dot" />
              changes are live · saved in this browser
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
