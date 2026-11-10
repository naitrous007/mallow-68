import { motion } from "framer-motion";
import { Layers, RotateCcw } from "lucide-react";
import { LAYERS } from "../data";
import { useMallow } from "../store";

export function LayerPanel() {
  const selectedLayer = useMallow((state) => state.selectedLayer);
  const toggleLayer = useMallow((state) => state.toggleLayer);
  const clearLayer = useMallow((state) => state.clearLayer);

  return (
    <aside className="layer-panel glass" aria-label="Keyboard layers">
      <div className="layer-panel-head">
        <div className="eyebrow">
          <Layers size={12} />
          <span>take it apart</span>
        </div>
        <h2>Anatomy</h2>
        <p>Tap a layer to solo it. Tap again to put it all back.</p>
      </div>

      <ol className="layer-list">
        {LAYERS.map((layer) => {
          const active = selectedLayer === layer.id;
          return (
            <li key={layer.id}>
              <button
                type="button"
                className={`layer-row ${active ? "is-active" : ""}`}
                onClick={() => toggleLayer(layer.id)}
                aria-pressed={active}
                aria-label={`Isolate ${layer.name} layer`}
              >
                <span className="layer-number">{layer.no}</span>
                <span className="layer-dot" style={{ background: layer.color }} />
                <span className="layer-copy">
                  <strong>{layer.name}</strong>
                  <small>{layer.sub}</small>
                </span>
                <span className="layer-solo">{active ? "solo" : ""}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="layer-panel-foot">
        <button
          type="button"
          className="text-button"
          onClick={() => document.dispatchEvent(new CustomEvent("mallow:reset-view"))}
        >
          <RotateCcw size={13} />
          reset view
        </button>
        <button
          type="button"
          className="text-button"
          onClick={clearLayer}
          disabled={!selectedLayer}
        >
          show all
        </button>
      </div>

      {selectedLayer && (
        <motion.div
          className="layer-solo-note"
          layout
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="pulse-dot" />
          everything else is at 15%
        </motion.div>
      )}
    </aside>
  );
}
