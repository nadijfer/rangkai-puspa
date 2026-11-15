import * as THREE from 'three';
import { SPECIES_BY_ID } from '../data/catalog';
import { PlacedFlower, WrapperConfig } from '../types/bouquet';
import {
  getPetalTexture,
  getSeedCenterTexture,
  getTagTexture,
  getWrapperTexture,
} from './pixelTextures';

interface VoxelBox {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  shade?: number;
  rx?: number;
  ry?: number;
  rz?: number;
}

const unitBox = new THREE.BoxGeometry(1, 1, 1);

/**
 * Merges a list of voxel boxes into a single optimized BufferGeometry
 * with subtle per-voxel vertex color shading for crisp Minecraft-like depth.
 */
function buildMergedVoxels(boxes: VoxelBox[]): THREE.BufferGeometry {
  const posAttr = unitBox.getAttribute('position') as THREE.BufferAttribute;
  const normAttr = unitBox.getAttribute('normal') as THREE.BufferAttribute;
  const uvAttr = unitBox.getAttribute('uv') as THREE.BufferAttribute;
  const indexAttr = unitBox.getIndex()!;

  const vertCountPerBox = posAttr.count;
  const idxCountPerBox = indexAttr.count;

  const positions = new Float32Array(boxes.length * vertCountPerBox * 3);
  const normals = new Float32Array(boxes.length * vertCountPerBox * 3);
  const uvs = new Float32Array(boxes.length * vertCountPerBox * 2);
  const colors = new Float32Array(boxes.length * vertCountPerBox * 3);
  const indices = new Uint32Array(boxes.length * idxCountPerBox);

  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  const euler = new THREE.Euler();
  const quat = new THREE.Quaternion();
  const mat = new THREE.Matrix4();
  const scaleVec = new THREE.Vector3();
  const posVec = new THREE.Vector3();

  boxes.forEach((box, bIdx) => {
    const shade = box.shade ?? 1.0;
    euler.set(box.rx ?? 0, box.ry ?? 0, box.rz ?? 0);
    quat.setFromEuler(euler);
    scaleVec.set(box.w, box.h, box.d);
    posVec.set(box.x, box.y, box.z);
    mat.compose(posVec, quat, scaleVec);

    const vBase = bIdx * vertCountPerBox;
    for (let i = 0; i < vertCountPerBox; i++) {
      v.fromBufferAttribute(posAttr, i).applyMatrix4(mat);
      n.fromBufferAttribute(normAttr, i).applyQuaternion(quat).normalize();

      const p3 = (vBase + i) * 3;
      positions[p3] = v.x;
      positions[p3 + 1] = v.y;
      positions[p3 + 2] = v.z;

      normals[p3] = n.x;
      normals[p3 + 1] = n.y;
      normals[p3 + 2] = n.z;

      // Subtle directional AO bias on faces for extra voxel crispness
      const faceBias = n.y > 0.5 ? 1.04 : n.y < -0.5 ? 0.84 : Math.abs(n.x) > 0.5 ? 0.94 : 0.98;
      const finalShade = Math.min(1.12, shade * faceBias);
      colors[p3] = finalShade;
      colors[p3 + 1] = finalShade;
      colors[p3 + 2] = finalShade;

      const u2 = (vBase + i) * 2;
      uvs[u2] = uvAttr.getX(i);
      uvs[u2 + 1] = uvAttr.getY(i);
    }

    const iBase = bIdx * idxCountPerBox;
    for (let i = 0; i < idxCountPerBox; i++) {
      indices[iBase + i] = indexAttr.getX(i) + vBase;
    }
  });

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  return geom;
}

const U = 0.05; // Base voxel unit size

interface FlowerParts {
  petals: VoxelBox[];
  center: VoxelBox[];
  foliage: VoxelBox[];
  centerColor: string;
}

function getSpeciesHeadBoxes(species: PlacedFlower['species']): FlowerParts {
  const petals: VoxelBox[] = [];
  const center: VoxelBox[] = [];
  const foliage: VoxelBox[] = [];
  let centerColor = '#f2c144';

  switch (species) {
    case 'rose': {
      // Cupped outer petals, mid layer, inner tight spiral bud
      const outer = [
        [0, 1, 2.2, 4.2, 3.2, 1.1, 0.96],
        [0, 1, -2.2, 4.2, 3.2, 1.1, 0.94],
        [2.2, 1, 0, 1.1, 3.2, 4.2, 0.98],
        [-2.2, 1, 0, 1.1, 3.2, 4.2, 0.95],
      ];
      for (const [x, y, z, w, h, d, s] of outer) {
        petals.push({ x: x * U, y: y * U, z: z * U, w: w * U, h: h * U, d: d * U, shade: s });
      }
      // Mid ring rotated slightly
      const mid = [
        [1.1, 1.7, 1.1, 2.0, 2.8, 1.0, 1.03, 0, Math.PI / 4],
        [-1.1, 1.7, 1.1, 2.0, 2.8, 1.0, 1.01, 0, -Math.PI / 4],
        [1.1, 1.7, -1.1, 2.0, 2.8, 1.0, 0.99, 0, -Math.PI / 4],
        [-1.1, 1.7, -1.1, 2.0, 2.8, 1.0, 0.97, 0, Math.PI / 4],
      ];
      for (const [x, y, z, w, h, d, s, rx, ry] of mid) {
        petals.push({ x: x * U, y: y * U, z: z * U, w: w * U, h: h * U, d: d * U, shade: s, rx, ry });
      }
      // Inner bud core
      petals.push({ x: 0, y: 2.1 * U, z: 0, w: 2.2 * U, h: 2.6 * U, d: 2.2 * U, shade: 0.88 });
      petals.push({ x: 0.3 * U, y: 2.6 * U, z: 0.2 * U, w: 1.2 * U, h: 1.5 * U, d: 1.2 * U, shade: 1.06 });
      // Green sepal cup
      foliage.push({ x: 0, y: -0.6 * U, z: 0, w: 3.0 * U, h: 1.0 * U, d: 3.0 * U, shade: 0.95 });
      break;
    }

    case 'peony': {
      // Plump ruffled dome of overlapping petal blocks
      petals.push({ x: 0, y: 1.1 * U, z: 0, w: 5.2 * U, h: 2.2 * U, d: 5.2 * U, shade: 0.92 });
      petals.push({ x: 0, y: 2.2 * U, z: 0, w: 4.4 * U, h: 2.0 * U, d: 4.4 * U, shade: 1.0 });
      petals.push({ x: 0, y: 3.1 * U, z: 0, w: 2.8 * U, h: 1.4 * U, d: 2.8 * U, shade: 1.06 });
      const puffs = [
        [2.4, 1.6, 1.4], [-2.4, 1.6, 1.4], [2.4, 1.6, -1.4], [-2.4, 1.6, -1.4],
        [1.4, 2.4, 2.2], [-1.4, 2.4, 2.2], [1.4, 2.4, -2.2], [-1.4, 2.4, -2.2],
      ];
      for (const [px, py, pz] of puffs) {
        petals.push({
          x: px * U,
          y: py * U,
          z: pz * U,
          w: 1.8 * U,
          h: 1.6 * U,
          d: 1.8 * U,
          shade: 1.04,
        });
      }
      center.push({ x: 0, y: 3.6 * U, z: 0, w: 1.4 * U, h: 0.8 * U, d: 1.4 * U, shade: 1.08 });
      foliage.push({ x: 0, y: -0.2 * U, z: 0, w: 3.4 * U, h: 0.8 * U, d: 3.4 * U, shade: 0.92 });
      break;
    }

    case 'tulip': {
      // Tall cup tulip
      petals.push({ x: 0, y: 0.8 * U, z: 0, w: 3.4 * U, h: 1.6 * U, d: 3.4 * U, shade: 0.94 });
      const walls = [
        [0, 2.4, 1.45, 3.2, 3.0, 0.9, 1.02],
        [0, 2.4, -1.45, 3.2, 3.0, 0.9, 0.96],
        [1.45, 2.4, 0, 0.9, 3.0, 3.2, 1.0],
        [-1.45, 2.4, 0, 0.9, 3.0, 3.2, 0.98],
      ];
      for (const [x, y, z, w, h, d, s] of walls) {
        petals.push({ x: x * U, y: y * U, z: z * U, w: w * U, h: h * U, d: d * U, shade: s });
      }
      petals.push({ x: 0.6 * U, y: 3.6 * U, z: 0.6 * U, w: 1.2 * U, h: 1.0 * U, d: 1.2 * U, shade: 1.06 });
      petals.push({ x: -0.6 * U, y: 3.6 * U, z: -0.6 * U, w: 1.2 * U, h: 1.0 * U, d: 1.2 * U, shade: 1.05 });
      center.push({ x: 0, y: 2.2 * U, z: 0, w: 1.2 * U, h: 1.2 * U, d: 1.2 * U, shade: 1.0 });
      // Sleek upright tulip leaves
      foliage.push({ x: 1.6 * U, y: -1.8 * U, z: 0, w: 0.7 * U, h: 4.8 * U, d: 1.4 * U, rz: -0.22, shade: 1.02 });
      foliage.push({ x: -1.6 * U, y: -2.2 * U, z: 0.3 * U, w: 0.7 * U, h: 4.2 * U, d: 1.4 * U, rz: 0.2, shade: 0.95 });
      break;
    }

    case 'sunflower': {
      centerColor = '#4f3321';
      // Forward-facing chunky voxel sunflower disc
      center.push({ x: 0, y: 1.8 * U, z: 0.5 * U, w: 3.8 * U, h: 3.8 * U, d: 1.4 * U, rx: -0.25, shade: 1.0 });
      center.push({ x: 0, y: 1.8 * U, z: 0.9 * U, w: 2.6 * U, h: 2.6 * U, d: 0.8 * U, rx: -0.25, shade: 0.9 });
      const count = 12;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const r = 2.85 * U;
        const px = Math.cos(angle) * r;
        const py = 1.8 * U + Math.sin(angle) * r;
        const pz = (i % 2 === 0 ? 0.25 : 0.0) * U;
        petals.push({
          x: px,
          y: py,
          z: pz,
          w: 2.2 * U,
          h: 1.15 * U,
          d: 0.65 * U,
          rx: -0.25,
          rz: angle,
          shade: i % 2 === 0 ? 1.05 : 0.95,
        });
      }
      foliage.push({ x: 0, y: 1.5 * U, z: -0.6 * U, w: 3.6 * U, h: 3.6 * U, d: 0.8 * U, rx: -0.25, shade: 0.9 });
      break;
    }

    case 'daisy': {
      centerColor = '#f4b938';
      center.push({ x: 0, y: 1.3 * U, z: 0, w: 2.2 * U, h: 1.2 * U, d: 2.2 * U, shade: 1.05 });
      const count = 10;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const r = 2.2 * U;
        petals.push({
          x: Math.cos(angle) * r,
          y: 1.1 * U,
          z: Math.sin(angle) * r,
          w: 2.3 * U,
          h: 0.55 * U,
          d: 1.1 * U,
          ry: -angle,
          rz: -0.14,
          shade: i % 2 === 0 ? 1.04 : 0.96,
        });
      }
      foliage.push({ x: 0, y: 0.5 * U, z: 0, w: 1.8 * U, h: 0.6 * U, d: 1.8 * U, shade: 0.92 });
      break;
    }

    case 'lily': {
      centerColor = '#d98c36';
      // 6 flared trumpet star petals
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = 2.0 * U;
        const inner = i % 2 === 0;
        petals.push({
          x: Math.cos(angle) * r,
          y: (inner ? 2.1 : 1.7) * U,
          z: Math.sin(angle) * r,
          w: 3.6 * U,
          h: 0.65 * U,
          d: 1.55 * U,
          ry: -angle,
          rz: inner ? 0.52 : 0.36,
          shade: inner ? 1.05 : 0.96,
        });
        // Tip curl
        const rTip = 3.6 * U;
        petals.push({
          x: Math.cos(angle) * rTip,
          y: (inner ? 2.8 : 2.2) * U,
          z: Math.sin(angle) * rTip,
          w: 1.3 * U,
          h: 0.55 * U,
          d: 1.0 * U,
          ry: -angle,
          rz: 0.1,
          shade: 1.08,
        });
      }
      // Stamens
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + 0.4;
        center.push({
          x: Math.cos(angle) * 0.7 * U,
          y: 2.4 * U,
          z: Math.sin(angle) * 0.7 * U,
          w: 0.45 * U,
          h: 1.8 * U,
          d: 0.45 * U,
          rz: -Math.cos(angle) * 0.2,
          rx: Math.sin(angle) * 0.2,
          shade: 1.04,
        });
      }
      foliage.push({ x: 0, y: 0.4 * U, z: 0, w: 1.6 * U, h: 1.0 * U, d: 1.6 * U, shade: 0.92 });
      break;
    }

    case 'lavender': {
      // Tall tiered spike of fragrant voxel clusters
      const tiers = [
        { y: 0.2, s: 1.7 },
        { y: 1.4, s: 1.9 },
        { y: 2.6, s: 1.75 },
        { y: 3.8, s: 1.5 },
        { y: 4.9, s: 1.2 },
        { y: 5.9, s: 0.85 },
      ];
      tiers.forEach((tier, idx) => {
        const off = idx % 2 === 0 ? 0.5 * U : -0.5 * U;
        petals.push({
          x: off,
          y: tier.y * U,
          z: (idx % 3 === 0 ? 0.4 : -0.4) * U,
          w: tier.s * U,
          h: 1.15 * U,
          d: tier.s * U,
          shade: 0.94 + idx * 0.025,
        });
        petals.push({
          x: -off * 0.8,
          y: (tier.y + 0.35) * U,
          z: (idx % 2 === 0 ? -0.4 : 0.4) * U,
          w: tier.s * 0.85 * U,
          h: 1.0 * U,
          d: tier.s * 0.85 * U,
          shade: 1.0 + idx * 0.02,
        });
      });
      foliage.push({ x: 0, y: 2.4 * U, z: 0, w: 0.65 * U, h: 5.6 * U, d: 0.65 * U, shade: 0.9 });
      break;
    }

    case 'hydrangea': {
      // Big spherical cloud of 4-voxel cross florets
      centerColor = '#f7e599';
      const nodes = [
        [0, 3.0, 0],
        [1.7, 2.5, 1.1], [-1.7, 2.5, 1.1], [1.7, 2.5, -1.1], [-1.7, 2.5, -1.1],
        [0, 2.4, 2.1], [0, 2.4, -2.1], [2.2, 1.6, 0], [-2.2, 1.6, 0],
        [1.4, 1.2, 1.9], [-1.4, 1.2, 1.9], [1.4, 1.2, -1.9], [-1.4, 1.2, -1.9],
        [0, 1.0, 2.5], [0, 1.0, -2.5],
      ];
      nodes.forEach(([nx, ny, nz], idx) => {
        petals.push({
          x: nx * U,
          y: ny * U,
          z: nz * U,
          w: 1.95 * U,
          h: 1.2 * U,
          d: 1.95 * U,
          ry: idx * 0.5,
          shade: 0.93 + (idx % 3) * 0.055,
        });
        if (idx % 2 === 0) {
          center.push({
            x: nx * U,
            y: (ny + 0.55) * U,
            z: nz * U,
            w: 0.5 * U,
            h: 0.4 * U,
            d: 0.5 * U,
            shade: 1.05,
          });
        }
      });
      foliage.push({ x: 2.1 * U, y: -0.4 * U, z: 0, w: 2.4 * U, h: 0.55 * U, d: 2.0 * U, rz: -0.3, shade: 0.95 });
      foliage.push({ x: -2.1 * U, y: -0.4 * U, z: 0, w: 2.4 * U, h: 0.55 * U, d: 2.0 * U, rz: 0.3, shade: 0.92 });
      break;
    }

    case 'babys-breath': {
      centerColor = '#f7e5a8';
      const sprays = [
        [0, 3.6, 0],
        [1.8, 2.8, 1.1], [-1.8, 2.9, 0.9],
        [1.4, 2.1, -1.4], [-1.5, 2.2, -1.3],
        [0.4, 1.5, 1.8], [-0.8, 1.4, -0.3],
        [2.3, 1.4, 0.2], [-2.2, 1.6, -0.4],
      ];
      sprays.forEach(([sx, sy, sz], idx) => {
        // Twigs from stem to spray
        foliage.push({
          x: (sx * 0.5) * U,
          y: (sy * 0.5) * U,
          z: (sz * 0.5) * U,
          w: 0.38 * U,
          h: (Math.hypot(sx, sy, sz) * 0.9) * U,
          d: 0.38 * U,
          rz: -Math.atan2(sx, sy),
          rx: Math.atan2(sz, sy),
          shade: 0.95,
        });
        petals.push({
          x: sx * U,
          y: sy * U,
          z: sz * U,
          w: 1.25 * U,
          h: 1.1 * U,
          d: 1.25 * U,
          shade: idx % 2 === 0 ? 1.05 : 0.96,
        });
        center.push({
          x: sx * U,
          y: (sy + 0.45) * U,
          z: sz * U,
          w: 0.45 * U,
          h: 0.45 * U,
          d: 0.45 * U,
          shade: 1.05,
        });
      });
      break;
    }

    case 'eucalyptus': {
      // Arched branch with staggered coin-like dusty voxel leaves
      for (let i = 0; i < 6; i++) {
        const y = (-1.4 + i * 1.35) * U;
        const side = i % 2 === 0 ? 1 : -1;
        // Central twig segment
        foliage.push({
          x: 0,
          y,
          z: 0,
          w: 0.5 * U,
          h: 1.6 * U,
          d: 0.5 * U,
          shade: 0.88,
        });
        // Pair of staggered rounded voxel coin leaves
        petals.push({
          x: side * 1.45 * U,
          y: y + 0.3 * U,
          z: (i % 3 === 0 ? 0.5 : -0.3) * U,
          w: 1.9 * U,
          h: 0.48 * U,
          d: 1.8 * U,
          rz: -side * 0.35,
          ry: side * 0.25,
          shade: 1.03,
        });
        petals.push({
          x: -side * 1.25 * U,
          y: y - 0.15 * U,
          z: (i % 3 === 0 ? -0.4 : 0.4) * U,
          w: 1.65 * U,
          h: 0.48 * U,
          d: 1.65 * U,
          rz: side * 0.32,
          ry: -side * 0.2,
          shade: 0.94,
        });
      }
      petals.push({ x: 0, y: 6.2 * U, z: 0, w: 1.3 * U, h: 0.5 * U, d: 1.3 * U, rz: 0.1, shade: 1.06 });
      break;
    }

    case 'fern': {
      // Feathery tapered frond with stepped voxel leaflets
      for (let i = 0; i < 8; i++) {
        const y = (-1.6 + i * 1.05) * U;
        const span = Math.max(0.8, 3.3 - i * 0.33);
        const zCurve = (i * i) * 0.045 * U;
        foliage.push({
          x: 0,
          y,
          z: zCurve,
          w: 0.48 * U,
          h: 1.25 * U,
          d: 0.48 * U,
          rx: 0.14,
          shade: 0.86,
        });
        petals.push({
          x: (span * 0.65) * U,
          y,
          z: zCurve,
          w: span * U,
          h: 0.38 * U,
          d: 0.85 * U,
          ry: -0.22,
          rz: -0.15,
          shade: 1.02 - i * 0.01,
        });
        petals.push({
          x: -(span * 0.65) * U,
          y: y + 0.2 * U,
          z: zCurve,
          w: span * U,
          h: 0.38 * U,
          d: 0.85 * U,
          ry: 0.22,
          rz: 0.15,
          shade: 0.95 - i * 0.01,
        });
      }
      petals.push({ x: 0, y: 6.8 * U, z: 2.9 * U, w: 0.8 * U, h: 0.9 * U, d: 0.6 * U, rx: 0.35, shade: 1.06 });
      break;
    }
  }

  return { petals, center, foliage, centerColor };
}

const STEM_ANCHOR = new THREE.Vector3(0, -0.45, 0);

/**
 * Builds a complete 3D voxel flower group with stem automatically oriented
 * from the bouquet tie anchor up through its head position.
 */
export function buildFlowerObject(flower: PlacedFlower, isSelected = false): THREE.Group {
  const spec = SPECIES_BY_ID[flower.species];
  const root = new THREE.Group();
  root.userData.flowerId = flower.id;

  const headPos = new THREE.Vector3(...flower.position);
  const stemDir = headPos.clone().sub(STEM_ANCHOR);
  const dist = Math.max(0.35, stemDir.length());
  stemDir.normalize();

  // Orient root at STEM_ANCHOR pointing along stemDir (+Y local -> stemDir)
  root.position.copy(STEM_ANCHOR);
  const alignQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), stemDir);
  root.quaternion.copy(alignQuat);

  // Inner spinning & scaling group along the stem axis
  const stemGroup = new THREE.Group();
  stemGroup.rotation.y = flower.spin;
  root.add(stemGroup);

  // Voxel stem segments
  const stemBoxes: VoxelBox[] = [
    { x: 0, y: dist * 0.5, z: 0, w: 0.045, h: dist, d: 0.045, shade: 0.94 },
  ];
  // Add small decorative stem leaves on non-foliage stems
  if (spec.category !== 'foliage') {
    stemBoxes.push({
      x: 0.075,
      y: dist * 0.58,
      z: 0,
      w: 0.11,
      h: 0.03,
      d: 0.06,
      rz: 0.45,
      shade: 1.02,
    });
    stemBoxes.push({
      x: -0.075,
      y: dist * 0.46,
      z: 0.02,
      w: 0.1,
      h: 0.03,
      d: 0.055,
      rz: -0.45,
      shade: 0.95,
    });
  }

  const stemMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(spec.stemColor),
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.02,
    emissive: isSelected ? new THREE.Color('#3b2814') : new THREE.Color('#000000'),
  });
  const stemMesh = new THREE.Mesh(buildMergedVoxels(stemBoxes), stemMat);
  stemMesh.userData.flowerId = flower.id;
  stemGroup.add(stemMesh);

  // Flower Head Group at tip of stem
  const headGroup = new THREE.Group();
  headGroup.position.set(0, dist, 0);
  headGroup.scale.setScalar(flower.scale);
  headGroup.rotation.x = flower.tilt;
  stemGroup.add(headGroup);

  const parts = getSpeciesHeadBoxes(flower.species);
  const petalTex = getPetalTexture(flower.color, flower.secondaryColor, flower.motif);

  if (parts.petals.length > 0) {
    const petalMat = new THREE.MeshStandardMaterial({
      map: petalTex,
      vertexColors: true,
      roughness: 0.72,
      metalness: 0.02,
      emissive: isSelected ? new THREE.Color('#3a252c') : new THREE.Color('#000000'),
    });
    const petalMesh = new THREE.Mesh(buildMergedVoxels(parts.petals), petalMat);
    petalMesh.userData.flowerId = flower.id;
    headGroup.add(petalMesh);
  }

  if (parts.center.length > 0) {
    const centerMat = new THREE.MeshStandardMaterial({
      map: getSeedCenterTexture(parts.centerColor),
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.02,
    });
    const centerMesh = new THREE.Mesh(buildMergedVoxels(parts.center), centerMat);
    centerMesh.userData.flowerId = flower.id;
    headGroup.add(centerMesh);
  }

  if (parts.foliage.length > 0) {
    const foliageMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(spec.stemColor),
      vertexColors: true,
      roughness: 0.84,
      metalness: 0.02,
    });
    const foliageMesh = new THREE.Mesh(buildMergedVoxels(parts.foliage), foliageMat);
    foliageMesh.userData.flowerId = flower.id;
    headGroup.add(foliageMesh);
  }

  // Selection halo ring around selected flower head
  if (isSelected) {
    const markerBoxes: VoxelBox[] = [
      { x: 0.24, y: 0.14, z: 0, w: 0.05, h: 0.05, d: 0.05, shade: 1.1 },
      { x: -0.24, y: 0.14, z: 0, w: 0.05, h: 0.05, d: 0.05, shade: 1.1 },
      { x: 0, y: 0.14, z: 0.24, w: 0.05, h: 0.05, d: 0.05, shade: 1.1 },
      { x: 0, y: 0.14, z: -0.24, w: 0.05, h: 0.05, d: 0.05, shade: 1.1 },
    ];
    const markerMat = new THREE.MeshBasicMaterial({ color: '#ffd84d' });
    const marker = new THREE.Mesh(buildMergedVoxels(markerBoxes), markerMat);
    marker.userData.flowerId = flower.id;
    headGroup.add(marker);
  }

  return root;
}

/**
 * Builds the 3D voxel bouquet wrapper, inner tissue lining, ribbon bow, and optional hanging tag.
 */
export function buildWrapperObject(wrapper: WrapperConfig): THREE.Group {
  const group = new THREE.Group();

  const outerTex = getWrapperTexture(wrapper.outerColor, wrapper.motifColor, wrapper.motif);
  const outerMat = new THREE.MeshStandardMaterial({
    map: outerTex,
    vertexColors: true,
    roughness: 0.84,
    metalness: 0.02,
  });

  const innerMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(wrapper.innerColor),
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.01,
  });

  const outerBoxes: VoxelBox[] = [];
  const innerBoxes: VoxelBox[] = [];

  // Shared lower stem bundle sleeve (base cone / gathered bottom)
  outerBoxes.push(
    { x: 0, y: -0.62, z: 0, w: 0.34, h: 0.44, d: 0.32, shade: 0.92 },
    { x: 0, y: -0.84, z: 0, w: 0.26, h: 0.24, d: 0.26, shade: 0.86 },
  );

  switch (wrapper.shape) {
    case 'korean-layered': {
      // Tall asymmetrical overlapping rear paper sheets
      outerBoxes.push(
        { x: -0.34, y: 0.48, z: -0.46, w: 0.85, h: 1.38, d: 0.08, ry: 0.24, rz: 0.12, shade: 1.02 },
        { x: 0.34, y: 0.56, z: -0.48, w: 0.85, h: 1.46, d: 0.08, ry: -0.24, rz: -0.1, shade: 0.98 },
        { x: 0, y: 0.62, z: -0.58, w: 0.95, h: 1.5, d: 0.08, rx: -0.12, shade: 0.95 },
      );
      // Side wings
      outerBoxes.push(
        { x: -0.64, y: 0.14, z: -0.05, w: 0.09, h: 0.98, d: 0.72, ry: 0.42, rz: 0.24, shade: 0.96 },
        { x: 0.64, y: 0.14, z: -0.05, w: 0.09, h: 0.98, d: 0.72, ry: -0.42, rz: -0.24, shade: 0.96 },
      );
      // Front crisp V-fold panels
      outerBoxes.push(
        { x: -0.26, y: -0.06, z: 0.42, w: 0.68, h: 0.82, d: 0.08, ry: -0.28, rx: 0.22, rz: 0.1, shade: 1.04 },
        { x: 0.26, y: -0.06, z: 0.42, w: 0.68, h: 0.82, d: 0.08, ry: 0.28, rx: 0.22, rz: -0.1, shade: 1.0 },
        { x: 0, y: -0.18, z: 0.34, w: 0.58, h: 0.68, d: 0.1, rx: 0.18, shade: 0.97 },
      );
      // Inner fluffy tissue paper peeking out
      innerBoxes.push(
        { x: -0.24, y: 0.42, z: -0.34, w: 0.62, h: 0.95, d: 0.07, ry: 0.15, rz: 0.08, shade: 1.02 },
        { x: 0.24, y: 0.45, z: -0.35, w: 0.62, h: 0.98, d: 0.07, ry: -0.15, rz: -0.08, shade: 1.0 },
        { x: -0.42, y: 0.2, z: 0.05, w: 0.07, h: 0.72, d: 0.56, ry: 0.35, rz: 0.2, shade: 1.01 },
        { x: 0.42, y: 0.2, z: 0.05, w: 0.07, h: 0.72, d: 0.56, ry: -0.35, rz: -0.2, shade: 1.01 },
        { x: 0, y: 0.04, z: 0.32, w: 0.52, h: 0.55, d: 0.07, rx: 0.2, shade: 1.03 },
      );
      break;
    }

    case 'classic-cone': {
      // Symmetrical 8-sided pleated voxel cone flare
      const sides = 8;
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const rMid = 0.46;
        const isRear = Math.sin(angle) < -0.1;
        outerBoxes.push({
          x: Math.cos(angle) * rMid,
          y: isRear ? 0.24 : 0.06,
          z: Math.sin(angle) * rMid,
          w: 0.52,
          h: isRear ? 1.15 : 0.85,
          d: 0.09,
          ry: -angle + Math.PI / 2,
          rx: 0.26,
          shade: 0.94 + (i % 2) * 0.07,
        });
        innerBoxes.push({
          x: Math.cos(angle) * (rMid - 0.08),
          y: isRear ? 0.32 : 0.14,
          z: Math.sin(angle) * (rMid - 0.08),
          w: 0.44,
          h: isRear ? 1.05 : 0.76,
          d: 0.06,
          ry: -angle + Math.PI / 2,
          rx: 0.24,
          shade: 1.02,
        });
      }
      break;
    }

    case 'ruffled': {
      // Scalloped stepped wavy petals around the collar
      const lobes = 10;
      for (let i = 0; i < lobes; i++) {
        const angle = (i / lobes) * Math.PI * 2;
        const r = 0.52;
        const h = (i % 2 === 0 ? 0.96 : 0.82) + (Math.sin(angle) < 0 ? 0.28 : 0);
        outerBoxes.push({
          x: Math.cos(angle) * r,
          y: 0.12 + (h - 0.85) * 0.4,
          z: Math.sin(angle) * r,
          w: 0.42,
          h,
          d: 0.09,
          ry: -angle + Math.PI / 2,
          rx: 0.32,
          shade: i % 2 === 0 ? 1.03 : 0.94,
        });
        // Ruffle top lip voxel
        outerBoxes.push({
          x: Math.cos(angle) * (r + 0.14),
          y: 0.12 + h * 0.5,
          z: Math.sin(angle) * (r + 0.14),
          w: 0.34,
          h: 0.16,
          d: 0.16,
          ry: -angle + Math.PI / 2,
          shade: 1.06,
        });
      }
      // Inner plush cuff
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        innerBoxes.push({
          x: Math.cos(angle) * 0.38,
          y: 0.22,
          z: Math.sin(angle) * 0.38,
          w: 0.46,
          h: 0.8,
          d: 0.08,
          ry: -angle + Math.PI / 2,
          rx: 0.22,
          shade: 1.03,
        });
      }
      break;
    }

    case 'kraft-sleeve': {
      // Structured crisp florist trapezoid sleeve with open front window
      outerBoxes.push(
        { x: 0, y: 0.36, z: -0.46, w: 1.18, h: 1.44, d: 0.09, rx: -0.1, shade: 0.97 },
        { x: -0.56, y: 0.18, z: -0.04, w: 0.09, h: 1.12, d: 0.86, ry: 0.18, rz: 0.16, shade: 0.95 },
        { x: 0.56, y: 0.18, z: -0.04, w: 0.09, h: 1.12, d: 0.86, ry: -0.18, rz: -0.16, shade: 0.95 },
        { x: 0, y: -0.14, z: 0.36, w: 0.84, h: 0.62, d: 0.09, rx: 0.16, shade: 1.02 },
      );
      innerBoxes.push(
        { x: 0, y: 0.42, z: -0.36, w: 1.02, h: 1.32, d: 0.06, rx: -0.08, shade: 1.03 },
        { x: 0, y: 0.02, z: 0.28, w: 0.72, h: 0.54, d: 0.06, rx: 0.14, shade: 1.01 },
      );
      break;
    }
  }

  group.add(new THREE.Mesh(buildMergedVoxels(outerBoxes), outerMat));
  group.add(new THREE.Mesh(buildMergedVoxels(innerBoxes), innerMat));

  // 3D Voxel Ribbon & Bow at waist (y = -0.38)
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(wrapper.ribbonColor),
    vertexColors: true,
    roughness: 0.65,
    metalness: 0.05,
  });

  const ribbonBoxes: VoxelBox[] = [
    // Wrap band around waist
    { x: 0, y: -0.4, z: 0, w: 0.44, h: 0.12, d: 0.44, shade: 0.96 },
    // Center knot
    { x: 0, y: -0.39, z: 0.25, w: 0.14, h: 0.14, d: 0.12, shade: 1.05 },
  ];

  if (wrapper.ribbonStyle === 'classic-bow' || wrapper.ribbonStyle === 'double-bow') {
    // Bow loops
    ribbonBoxes.push(
      { x: -0.18, y: -0.36, z: 0.26, w: 0.24, h: 0.14, d: 0.1, rz: 0.22, shade: 1.02 },
      { x: 0.18, y: -0.36, z: 0.26, w: 0.24, h: 0.14, d: 0.1, rz: -0.22, shade: 1.02 },
      // Hanging tails
      { x: -0.09, y: -0.58, z: 0.24, w: 0.08, h: 0.34, d: 0.05, rz: 0.22, shade: 0.92 },
      { x: 0.09, y: -0.6, z: 0.24, w: 0.08, h: 0.38, d: 0.05, rz: -0.2, shade: 0.95 },
    );
  }

  if (wrapper.ribbonStyle === 'double-bow') {
    ribbonBoxes.push(
      { x: -0.21, y: -0.46, z: 0.25, w: 0.26, h: 0.12, d: 0.09, rz: -0.26, shade: 0.95 },
      { x: 0.21, y: -0.46, z: 0.25, w: 0.26, h: 0.12, d: 0.09, rz: 0.26, shade: 0.95 },
    );
  }

  if (wrapper.ribbonStyle === 'twine') {
    // Rustic wrapped multi-strand cord
    ribbonBoxes.push(
      { x: 0, y: -0.32, z: 0, w: 0.45, h: 0.05, d: 0.45, shade: 0.9 },
      { x: 0, y: -0.48, z: 0, w: 0.43, h: 0.05, d: 0.43, shade: 0.88 },
      { x: -0.06, y: -0.56, z: 0.24, w: 0.04, h: 0.28, d: 0.04, rz: 0.18, shade: 0.94 },
      { x: 0.07, y: -0.58, z: 0.24, w: 0.04, h: 0.32, d: 0.04, rz: -0.24, shade: 0.94 },
    );
  }

  group.add(new THREE.Mesh(buildMergedVoxels(ribbonBoxes), ribbonMat));

  // Optional hanging pixel gift tag
  if (wrapper.tagText.trim().length > 0) {
    const tagMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.22, 0.03),
      new THREE.MeshStandardMaterial({
        map: getTagTexture(wrapper.tagText),
        roughness: 0.85,
      }),
    );
    tagMesh.position.set(0.24, -0.58, 0.27);
    tagMesh.rotation.z = -0.22;
    tagMesh.rotation.y = 0.18;
    group.add(tagMesh);
  }

  return group;
}
