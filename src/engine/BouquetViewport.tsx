import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BouquetState, PixelDensity } from '../types/bouquet';
import { clampToBouquetDome } from '../utils/autoArrange';
import { buildFlowerObject, buildWrapperObject } from './voxelModels';

export interface BouquetViewportHandle {
  resetCamera: () => void;
  capturePng: (options?: { transparent?: boolean; width?: number; height?: number }) => string;
  projectClientPointToBouquet: (clientX: number, clientY: number) => [number, number, number] | null;
}

interface BouquetViewportProps {
  bouquet: BouquetState;
  selectedFlowerId: string | null;
  pixelDensity: PixelDensity;
  readOnly?: boolean;
  autoRotate?: boolean;
  onSelectFlower: (id: string | null) => void;
  onMoveFlower: (id: string, nextPos: [number, number, number], commit: boolean) => void;
}

const PIXEL_HEIGHT_BY_DENSITY: Record<PixelDensity, number> = {
  chunky: 170,
  balanced: 250,
  fine: 340,
};

const STUDIO_BG_HEX = 0xf4ecdc;

export const BouquetViewport = forwardRef<BouquetViewportHandle, BouquetViewportProps>(
  function BouquetViewport(
    {
      bouquet,
      selectedFlowerId,
      pixelDensity,
      readOnly = false,
      autoRotate = false,
      onSelectFlower,
      onMoveFlower,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Latest callbacks/props in refs so pointer listeners don't rebind constantly
    const propsRef = useRef({
      bouquet,
      selectedFlowerId,
      pixelDensity,
      readOnly,
      autoRotate,
      onSelectFlower,
      onMoveFlower,
    });
    propsRef.current = {
      bouquet,
      selectedFlowerId,
      pixelDensity,
      readOnly,
      autoRotate,
      onSelectFlower,
      onMoveFlower,
    };

    const engineRef = useRef<{
      renderer: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      controls: OrbitControls;
      renderTarget: THREE.WebGLRenderTarget;
      postScene: THREE.Scene;
      postCamera: THREE.OrthographicCamera;
      postQuadMat: THREE.MeshBasicMaterial;
      coasterMat: THREE.MeshStandardMaterial;
      bouquetRoot: THREE.Group;
      flowersGroup: THREE.Group;
      wrapperGroup: THREE.Group;
      sparklesGroup: THREE.Group;
      renderNow: () => void;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        const eng = engineRef.current;
        if (!eng) return;
        eng.camera.position.set(0.35, 1.35, 3.35);
        eng.controls.target.set(0, 0.55, 0);
        eng.controls.update();
      },
      capturePng: (options) => {
        const eng = engineRef.current;
        if (!eng) return '';
        const transparent = options?.transparent ?? false;

        const prevBg = eng.scene.background;
        const prevClearAlpha = eng.renderer.getClearAlpha();
        if (transparent) {
          eng.scene.background = null;
          eng.renderer.setClearColor(0x000000, 0);
        }

        eng.renderNow();

        // Read back the low-res pixelated canvas and scale crisply to target PNG
        const srcCanvas = eng.renderer.domElement;
        const outW = options?.width ?? 900;
        const outH =
          options?.height ??
          Math.max(400, Math.round((srcCanvas.height / Math.max(1, srcCanvas.width)) * outW));
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = outW;
        exportCanvas.height = outH;
        const ctx = exportCanvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(srcCanvas, 0, 0, outW, outH);

        if (transparent) {
          eng.scene.background = prevBg;
          eng.renderer.setClearColor(new THREE.Color(propsRef.current.bouquet.bgColor || '#f4ecdc'), prevClearAlpha);
          eng.renderNow();
        }
        return exportCanvas.toDataURL('image/png');
      },
      projectClientPointToBouquet: (clientX: number, clientY: number) => {
        const eng = engineRef.current;
        if (!eng) return null;
        const rect = eng.renderer.domElement.getBoundingClientRect();
        if (
          clientX < rect.left ||
          clientX > rect.right ||
          clientY < rect.top ||
          clientY > rect.bottom
        ) {
          return null;
        }
        const ndc = new THREE.Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1,
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(ndc, eng.camera);
        const camNormal = new THREE.Vector3();
        eng.camera.getWorldDirection(camNormal).negate();
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
          camNormal,
          new THREE.Vector3(0, 1.25, 0),
        );
        const hit = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, hit)) {
          return clampToBouquetDome([hit.x, hit.y, hit.z]);
        }
        return null;
      },
    }));

    // Initialize Three.js + Low-Res Pixel Render Pipeline
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);

      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      renderer.setClearColor(STUDIO_BG_HEX, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = 'w-full h-full block pixel-canvas touch-none';
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(STUDIO_BG_HEX);

      const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
      camera.position.set(0.35, 1.35, 3.35);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.55, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.minDistance = 2.1;
      controls.maxDistance = 5.4;
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = Math.PI * 0.62;
      controls.update();

      // Warm cozy lighting
      const hemi = new THREE.HemisphereLight(0xfffaf0, 0x8f9f8a, 1.35);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xfff2dc, 1.45);
      keyLight.position.set(2.5, 4.5, 3.5);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xd9e8ff, 0.65);
      rimLight.position.set(-3.0, 2.0, -2.5);
      scene.add(rimLight);

      // Cozy pixel floor coaster disc under the bouquet
      const coasterGeo = new THREE.CylinderGeometry(0.95, 1.0, 0.06, 12);
      const coasterMat = new THREE.MeshStandardMaterial({
        color: 0xe4dac6,
        roughness: 0.95,
      });
      const coaster = new THREE.Mesh(coasterGeo, coasterMat);
      coaster.position.set(0, -1.03, 0);
      scene.add(coaster);

      const bouquetRoot = new THREE.Group();
      const flowersGroup = new THREE.Group();
      const wrapperGroup = new THREE.Group();
      const sparklesGroup = new THREE.Group();
      bouquetRoot.add(wrapperGroup);
      bouquetRoot.add(flowersGroup);
      scene.add(bouquetRoot);
      scene.add(sparklesGroup);

      // Create decorative floating pixel sparkles for Gift View
      const sparkleGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
      const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xf7d86a });
      for (let i = 0; i < 14; i++) {
        const sp = new THREE.Mesh(sparkleGeo, sparkleMat);
        const angle = (i / 14) * Math.PI * 2;
        const r = 1.05 + (i % 3) * 0.25;
        sp.position.set(Math.cos(angle) * r, 0.4 + (i % 5) * 0.36, Math.sin(angle) * r);
        sp.userData.baseY = sp.position.y;
        sp.userData.phase = i * 0.8;
        sparklesGroup.add(sp);
      }

      // Low-resolution render target & nearest-neighbor screen quad
      const getLowResDims = (w: number, h: number) => {
        const targetH = PIXEL_HEIGHT_BY_DENSITY[propsRef.current.pixelDensity];
        const targetW = Math.max(64, Math.round((w / Math.max(1, h)) * targetH));
        return { targetW, targetH };
      };

      const { targetW, targetH } = getLowResDims(width, height);
      const supportsHalfFloatTarget =
        renderer.extensions.has('EXT_color_buffer_float') ||
        renderer.extensions.has('EXT_color_buffer_half_float');
      const renderTarget = new THREE.WebGLRenderTarget(targetW, targetH, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        type: supportsHalfFloatTarget ? THREE.HalfFloatType : THREE.UnsignedByteType,
        depthBuffer: true,
      });

      const postScene = new THREE.Scene();
      const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const postQuadMat = new THREE.MeshBasicMaterial({
        map: renderTarget.texture,
        transparent: true,
      });
      const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postQuadMat);
      postScene.add(postQuad);

      const renderNow = () => {
        renderer.setRenderTarget(renderTarget);
        renderer.clear();
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(postScene, postCamera);
      };

      engineRef.current = {
        renderer,
        scene,
        camera,
        controls,
        renderTarget,
        postScene,
        postCamera,
        postQuadMat,
        coasterMat,
        bouquetRoot,
        flowersGroup,
        wrapperGroup,
        sparklesGroup,
        renderNow,
      };

      // Dragging state
      const raycaster = new THREE.Raycaster();
      const pointerNdc = new THREE.Vector2();
      const dragPlane = new THREE.Plane();
      const intersectPt = new THREE.Vector3();
      const dragOffset = new THREE.Vector3();
      let draggingFlowerId: string | null = null;
      let lastDraggedPos: [number, number, number] | null = null;

      const updatePointerNdc = (clientX: number, clientY: number) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      };

      const findFlowerId = (obj: THREE.Object3D | null): string | null => {
        let cur: THREE.Object3D | null = obj;
        while (cur) {
          if (typeof cur.userData?.flowerId === 'string') {
            return cur.userData.flowerId;
          }
          cur = cur.parent;
        }
        return null;
      };

      const onPointerDown = (e: PointerEvent) => {
        if (propsRef.current.readOnly || e.button !== 0) return;
        updatePointerNdc(e.clientX, e.clientY);
        raycaster.setFromCamera(pointerNdc, camera);
        const hits = raycaster.intersectObjects(flowersGroup.children, true);
        if (hits.length > 0) {
          const hitId = findFlowerId(hits[0].object);
          if (hitId) {
            const flower = propsRef.current.bouquet.flowers.find((f) => f.id === hitId);
            if (!flower) return;
            propsRef.current.onSelectFlower(hitId);
            draggingFlowerId = hitId;
            controls.enabled = false;

            const camNormal = new THREE.Vector3();
            camera.getWorldDirection(camNormal).negate();
            const headPos = new THREE.Vector3(...flower.position);
            dragPlane.setFromNormalAndCoplanarPoint(camNormal, headPos);

            if (raycaster.ray.intersectPlane(dragPlane, intersectPt)) {
              dragOffset.copy(headPos).sub(intersectPt);
            } else {
              dragOffset.set(0, 0, 0);
            }
            lastDraggedPos = flower.position;
            renderer.domElement.style.cursor = 'grabbing';
            renderer.domElement.setPointerCapture(e.pointerId);
            return;
          }
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        if (propsRef.current.readOnly) return;
        updatePointerNdc(e.clientX, e.clientY);
        raycaster.setFromCamera(pointerNdc, camera);

        if (draggingFlowerId) {
          if (raycaster.ray.intersectPlane(dragPlane, intersectPt)) {
            const worldPt = intersectPt.clone().add(dragOffset);
            const clamped = clampToBouquetDome([worldPt.x, worldPt.y, worldPt.z]);
            lastDraggedPos = clamped;
            propsRef.current.onMoveFlower(draggingFlowerId, clamped, false);
          }
          return;
        }

        // Hover cursor hint
        const hits = raycaster.intersectObjects(flowersGroup.children, true);
        renderer.domElement.style.cursor = hits.length > 0 ? 'grab' : 'default';
      };

      const onPointerUp = (e: PointerEvent) => {
        if (draggingFlowerId) {
          if (lastDraggedPos) {
            propsRef.current.onMoveFlower(draggingFlowerId, lastDraggedPos, true);
          }
          draggingFlowerId = null;
          lastDraggedPos = null;
          controls.enabled = true;
          renderer.domElement.style.cursor = 'grab';
          if (renderer.domElement.hasPointerCapture(e.pointerId)) {
            renderer.domElement.releasePointerCapture(e.pointerId);
          }
        }
      };

      // Tap background to deselect when not dragging camera
      let downPos = { x: 0, y: 0 };
      const onPointerDownTrack = (e: PointerEvent) => {
        downPos = { x: e.clientX, y: e.clientY };
        onPointerDown(e);
      };
      const onPointerUpTrack = (e: PointerEvent) => {
        const wasDraggingFlower = draggingFlowerId !== null;
        onPointerUp(e);
        if (!wasDraggingFlower && !propsRef.current.readOnly) {
          const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
          if (moved < 5) {
            updatePointerNdc(e.clientX, e.clientY);
            raycaster.setFromCamera(pointerNdc, camera);
            const hits = raycaster.intersectObjects(flowersGroup.children, true);
            if (hits.length === 0) {
              propsRef.current.onSelectFlower(null);
            }
          }
        }
      };

      const dom = renderer.domElement;
      dom.addEventListener('pointerdown', onPointerDownTrack);
      dom.addEventListener('pointermove', onPointerMove);
      dom.addEventListener('pointerup', onPointerUpTrack);
      dom.addEventListener('pointercancel', onPointerUpTrack);

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const w = Math.max(1, Math.floor(entry.contentRect.width));
        const h = Math.max(1, Math.floor(entry.contentRect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        const dims = getLowResDims(w, h);
        renderTarget.setSize(dims.targetW, dims.targetH);
      });
      resizeObserver.observe(container);

      let rafId = 0;
      const clock = new THREE.Clock();
      const animate = () => {
        rafId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        controls.autoRotate = propsRef.current.autoRotate;
        controls.autoRotateSpeed = 1.4;
        controls.update();

        // Sparkles visibility and gentle bob in Gift Mode
        sparklesGroup.visible = propsRef.current.autoRotate;
        if (sparklesGroup.visible) {
          sparklesGroup.children.forEach((child) => {
            const base = Number(child.userData.baseY ?? 1);
            const phase = Number(child.userData.phase ?? 0);
            child.position.y = base + Math.sin(elapsed * 2.2 + phase) * 0.08;
            child.rotation.y = elapsed * 1.5 + phase;
          });
        }

        renderNow();
      };
      animate();

      return () => {
        cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        dom.removeEventListener('pointerdown', onPointerDownTrack);
        dom.removeEventListener('pointermove', onPointerMove);
        dom.removeEventListener('pointerup', onPointerUpTrack);
        dom.removeEventListener('pointercancel', onPointerUpTrack);
        controls.dispose();
        renderTarget.dispose();
        renderer.dispose();
        if (dom.parentElement === container) {
          container.removeChild(dom);
        }
        engineRef.current = null;
      };
    }, []);

    // Update low-res target resolution when pixelDensity changes
    useEffect(() => {
      const eng = engineRef.current;
      const container = containerRef.current;
      if (!eng || !container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      const targetH = PIXEL_HEIGHT_BY_DENSITY[pixelDensity];
      const targetW = Math.max(64, Math.round((w / Math.max(1, h)) * targetH));
      eng.renderTarget.setSize(targetW, targetH);
    }, [pixelDensity]);

    // Sync background color & harmonized coaster tint
    useEffect(() => {
      const eng = engineRef.current;
      if (!eng) return;
      const bg = new THREE.Color(bouquet.bgColor || '#f4ecdc');
      eng.scene.background = bg;
      eng.renderer.setClearColor(bg, 1);
      eng.coasterMat.color.copy(bg).lerp(new THREE.Color('#cfc2aa'), 0.55);
    }, [bouquet.bgColor]);

    // Sync Wrapper 3D geometry
    useEffect(() => {
      const eng = engineRef.current;
      if (!eng) return;
      disposeGroupMeshes(eng.wrapperGroup);
      eng.wrapperGroup.clear();
      eng.wrapperGroup.add(buildWrapperObject(bouquet.wrapper));
    }, [bouquet.wrapper]);

    // Sync Flowers 3D geometry
    useEffect(() => {
      const eng = engineRef.current;
      if (!eng) return;
      disposeGroupMeshes(eng.flowersGroup);
      eng.flowersGroup.clear();
      bouquet.flowers.forEach((flower) => {
        const isSelected = !readOnly && flower.id === selectedFlowerId;
        eng.flowersGroup.add(buildFlowerObject(flower, isSelected));
      });
    }, [bouquet.flowers, selectedFlowerId, readOnly]);

    return <div ref={containerRef} className="w-full h-full relative overflow-hidden" />;
  },
);

function disposeGroupMeshes(group: THREE.Group): void {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
}
