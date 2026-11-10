import { Layer } from "./Layer";
import { Keycaps } from "./Keycaps";
import { Switches } from "./Switches";
import { BottomCase, Foam, PCB, Plate } from "./BoardLayers";

export function Keyboard() {
  return (
    <group name="mallow-68" position={[0, 0, 0]}>
      <Layer id="case">
        <BottomCase />
      </Layer>
      <Layer id="pcb">
        <PCB />
      </Layer>
      <Layer id="foam">
        <Foam />
      </Layer>
      <Layer id="plate">
        <Plate />
      </Layer>
      <Layer id="switches">
        <Switches />
      </Layer>
      <Layer id="keycaps">
        <Keycaps />
      </Layer>
    </group>
  );
}
