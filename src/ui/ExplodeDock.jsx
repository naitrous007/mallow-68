import { RotateCcw, Sparkles } from "lucide-react";
import { LAYERS, stageLabel } from "../data";
import { useMallow } from "../store";

const TICKS = [0, 14, 29, 42, 55, 67, 100];

export function ExplodeDock() {
  const explode = useMallow((state) => state.explode);
  const setExplode = useMallow((state) => state.setExplode);
  const percent = Math.round(explode * 100);
  const stage = stageLabel(explode);

  return (
    <section className="explode-dock glass" aria-label="Explode controls">
      <div className="dock-head">
        <div className="dock-heading">
          <span className="stack-glyph" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div>
            <span className="eyebrow">separation</span>
            <strong>Explode the stack</strong>
          </div>
        </div>

        <div className="dock-stage" aria-live="polite">
          <Sparkles size={13} />
          <span>{stage}</span>
        </div>

        <div className="dock-actions">
          <span className="percent-pill">
            {String(percent).padStart(2, "0")}
            <small>%</small>
          </span>
          <button
            type="button"
            className="reset-button"
            onClick={() => setExplode(0)}
            disabled={percent === 0}
            aria-label="Reset keyboard to assembled"
            title="Put it together"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="slider-block">
        <div className="range-shell" style={{ "--fill": `${percent}%` }}>
          <div className="range-track" aria-hidden="true">
            <div className="range-fill" />
          </div>
          <div className="range-ticks" aria-hidden="true">
            {TICKS.map((tick) => (
              <span key={tick} className="range-tick" style={{ left: `${tick}%` }} />
            ))}
          </div>
          <input
            className="range-input"
            type="range"
            min="0"
            max="100"
            step="1"
            value={percent}
            onChange={(event) => setExplode(Number(event.target.value) / 100)}
            onPointerDown={() => useMallow.getState().markInteracted()}
            onPointerUp={(event) => event.currentTarget.blur()}
            aria-label="Explode keyboard"
            aria-valuetext={`${percent} percent exploded, ${stage}`}
          />
        </div>

        <div className="stage-labels" aria-hidden="true">
          {LAYERS.map((layer) => (
            <span key={layer.id}>
              <i style={{ background: layer.color }} />
              {layer.id === "case" ? "case" : layer.id}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
