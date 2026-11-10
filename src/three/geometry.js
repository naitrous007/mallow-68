import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/* ------------------------------------------------------------------
   Small geometry factory shared by all the keyboard parts.
------------------------------------------------------------------- */

export function roundedRectShape(width, height, radius, cx = 0, cy = 0) {
  const shape = new THREE.Shape();
  roundedRectPath(shape, width, height, radius, cx, cy);
  return shape;
}

export function roundedRectPath(path, width, height, radius, cx = 0, cy = 0) {
  const r = Math.max(0.001, Math.min(radius, width / 2, height / 2));
  const x = cx - width / 2;
  const y = cy - height / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.quadraticCurveTo(x + width, y, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

/**
 * Extrude an XY shape upward into a centered Y-up solid.
 * The original shape's Y maps to world -Z, which is useful for placing
 * switch cut-outs from keyboard coordinates directly.
 */
export function extrudeVertical(shape, depth, options = {}) {
  const { bevel = 0, curveSegments = 18 } = options;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    curveSegments,
    bevelEnabled: bevel > 0,
    bevelSegments: 3,
    bevelSize: bevel,
    bevelThickness: bevel,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  geometry.translate(
    -(bb.min.x + bb.max.x) / 2,
    -(bb.min.y + bb.max.y) / 2,
    -(bb.min.z + bb.max.z) / 2
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function createKeycapGeometry() {
  const shape = roundedRectShape(1, 1, 0.16);
  const geometry = extrudeVertical(shape, 0.21, { bevel: 0.038, curveSegments: 10 });
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const minY = bb.min.y;
  const maxY = bb.max.y;
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const t = THREE.MathUtils.clamp((y - minY) / (maxY - minY), 0, 1);
    const taper = 1 - 0.13 * Math.pow(t, 1.6);
    position.setX(i, x * taper);
    position.setZ(i, z * taper);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

export function createPlateGeometry(width, depth) {
  // A solid, softly bevelled slab. Switch cut-outs are drawn as inset
  // instanced wells on top — far cheaper and more reliable than 68 boolean
  // holes, while reading the same from every viewing angle.
  return createRoundedBox(width, 0.074, depth, 0.22, 3);
}

export function createFoamGeometry(width, depth) {
  return createRoundedBox(width, 0.06, depth, 0.24, 3);
}

export function createCaseFrameGeometry(width, depth, wall, height) {
  const outer = roundedRectShape(width, depth, 0.66);
  const inner = roundedRectPath(
    new THREE.Path(),
    width - wall * 2,
    depth - wall * 2,
    Math.max(0.22, 0.66 - wall),
    0,
    0
  );
  outer.holes.push(inner);
  return extrudeVertical(outer, height, { bevel: 0.032, curveSegments: 10 });
}

export function createCrossGeometry(size = 0.66, arm = 0.2, height = 0.055) {
  const shape = new THREE.Shape();
  const s = size / 2;
  const a = arm / 2;
  shape.moveTo(-a, -s);
  shape.lineTo(a, -s);
  shape.lineTo(a, -a);
  shape.lineTo(s, -a);
  shape.lineTo(s, a);
  shape.lineTo(a, a);
  shape.lineTo(a, s);
  shape.lineTo(-a, s);
  shape.lineTo(-a, a);
  shape.lineTo(-s, a);
  shape.lineTo(-s, -a);
  shape.lineTo(-a, -a);
  shape.closePath();
  return extrudeVertical(shape, height, { bevel: 0.008, curveSegments: 2 });
}

export function createSwitchTopGeometry() {
  const outer = roundedRectShape(0.78, 0.78, 0.15);
  const inner = roundedRectPath(new THREE.Path(), 0.55, 0.55, 0.1, 0, 0);
  outer.holes.push(inner);
  return extrudeVertical(outer, 0.075, { bevel: 0.014, curveSegments: 6 });
}

export function createHelixGeometry(radius = 0.09, height = 0.2, turns = 5.5, tube = 0.012) {
  const points = [];
  const segments = 140;
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const angle = t * Math.PI * 2 * turns;
    points.push(
      new THREE.Vector3(Math.cos(angle) * radius, t * height - height / 2, Math.sin(angle) * radius)
    );
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 150, tube, 5, false);
}

export function createRoundedBox(width, height, depth, radius = 0.08, segments = 3) {
  return new RoundedBoxGeometry(width, height, depth, segments, radius);
}

export function createArchGeometry(width, height) {
  const shape = new THREE.Shape();
  const r = width / 2;
  shape.moveTo(-r, -height / 2);
  shape.lineTo(-r, height / 2 - r);
  shape.absarc(0, height / 2 - r, r, Math.PI, 0, true);
  shape.lineTo(r, -height / 2);
  shape.closePath();
  return extrudeVertical(shape, 0.1, { bevel: 0.03 });
}

export function createLeafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5);
  shape.bezierCurveTo(0.52, -0.14, 0.48, 0.34, 0, 0.56);
  shape.bezierCurveTo(-0.48, 0.34, -0.52, -0.14, 0, -0.5);
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    curveSegments: 10,
  });
}

export function createStarGeometry(outer = 0.5, inner = 0.23, depth = 0.06) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return extrudeVertical(shape, depth, { bevel: 0.012, curveSegments: 2 });
}

export function createArchShape(width, height) {
  const shape = new THREE.Shape();
  const r = width / 2;
  shape.moveTo(-r, 0);
  shape.lineTo(-r, height - r);
  shape.absarc(0, height - r, r, Math.PI, 0, true);
  shape.lineTo(r, 0);
  shape.closePath();
  return shape;
}

