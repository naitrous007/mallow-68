import { useEffect } from "react";
import { CASE_BY_ID, THEME_BY_ID } from "./data";
import { useMallow } from "./store";
import { unlockAudio } from "./audio";
import { startDesktopBridge } from "./desktopBridge";
import { Experience } from "./three/Experience";
import { TopBar } from "./ui/TopBar";
import { LayerPanel } from "./ui/LayerPanel";
import { ExplodeDock } from "./ui/ExplodeDock";
import { Customizer } from "./ui/Customizer";
import { FloatingHints } from "./ui/FloatingHints";

export default function App() {
  const themeId = useMallow((state) => state.themeId);
  const caseColorId = useMallow((state) => state.caseColorId);
  const markInteracted = useMallow((state) => state.markInteracted);
  const theme = THEME_BY_ID[themeId] || THEME_BY_ID.strawberry;
  const caseColor = CASE_BY_ID[caseColorId] || CASE_BY_ID.blush;

  useEffect(() => {
    document.body.classList.add("mallow-body");
    return () => document.body.classList.remove("mallow-body");
  }, []);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => startDesktopBridge(), []);

  return (
    <main
      className="app"
      style={{
        "--theme-alpha": theme.alpha,
        "--theme-mod": theme.mod,
        "--theme-accent": theme.accent,
        "--theme-glow": theme.glow,
        "--theme-ink": theme.legend,
        "--case-color": caseColor.color,
      }}
    >
      <div className="ambient" aria-hidden="true">
        <div className="ambient-blob blob-a" />
        <div className="ambient-blob blob-b" />
        <div className="ambient-blob blob-c" />
        <div className="ambient-ring ring-a" />
        <div className="ambient-ring ring-b" />
      </div>

      <div className="scene-layer" onPointerDown={() => markInteracted()}>
        <Experience />
      </div>

      <div className="vignette" aria-hidden="true" />
      <TopBar />
      <LayerPanel />
      <ExplodeDock />
      <Customizer />
      <FloatingHints />

      <div id="overlay-root" />

      <div className="corner-note" aria-hidden="true">
        <span>softly mechanical</span>
        <i />
        <span>68 keys</span>
      </div>
    </main>
  );
}
