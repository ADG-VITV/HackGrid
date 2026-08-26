import * as THREE from "three";
import {
  EffectComposer,
} from "three/addons/postprocessing/EffectComposer.js";
import {
  RenderPass,
} from "three/addons/postprocessing/RenderPass.js";
import {
  UnrealBloomPass,
} from "three/addons/postprocessing/UnrealBloomPass.js";

type HeroElements = {
  canvas: HTMLCanvasElement;
  cursor: HTMLDivElement;
  logoWrapper: HTMLDivElement;
  logoImg: HTMLImageElement;
  logoGlow: HTMLDivElement;
  glitchLayers: HTMLDivElement[];
  noiseBars: HTMLDivElement[];
};

export function initHero(elements: HeroElements) {
  const {
    canvas,
    cursor,
    logoWrapper,
    logoImg,
    logoGlow,
    glitchLayers,
    noiseBars,
  } = elements;

  /* ========================================
     RENDERER
  ======================================== */

  const R = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

  R.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  R.setSize(window.innerWidth, window.innerHeight);

  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.2;

  const S = new THREE.Scene();

  const C = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  C.position.set(0, 0, 40);

  /* ========================================
     BLOOM
  ======================================== */

  const comp = new EffectComposer(R);

  comp.addPass(
    new RenderPass(S, C),
  );

  comp.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(
        window.innerWidth,
        window.innerHeight,
      ),
      1.0,
      0.6,
      0.75,
    ),
  );

  /* ========================================
     LIGHTS
  ======================================== */

  S.add(
    new THREE.AmbientLight(
      0x082010,
      0.8,
    ),
  );

  const dl1 = new THREE.DirectionalLight(
    0x42ff5a,
    0.8,
  );

  dl1.position.set(5, 15, 10);
  S.add(dl1);

  const dl2 = new THREE.DirectionalLight(
    0x22cc55,
    0.5,
  );

  dl2.position.set(-8, -5, 8);
  S.add(dl2);

  const pl1 = new THREE.PointLight(
    0x42ff5a,
    1.2,
    70,
  );

  pl1.position.set(12, 8, 15);
  S.add(pl1);

  const pl2 = new THREE.PointLight(
    0x22dd66,
    0.8,
    60,
  );

  pl2.position.set(-12, -6, -5);
  S.add(pl2);

  const pl3 = new THREE.PointLight(
    0x88ffaa,
    0.5,
    50,
  );

  pl3.position.set(0, 12, -10);
  S.add(pl3);

  const mob = window.innerWidth < 768;

  /* ========================================
     MATERIALS
  ======================================== */

  const greens = [
    0x42ff5a,
    0x30ee50,
    0x22cc44,
    0x66ff88,
    0x88ffbb,
    0x20ddaa,
    0xaaffcc,
  ];

  function pickC() {
    if (Math.random() < 0.3) {
      return 0xffffff;
    }

    return greens[
      Math.floor(Math.random() * greens.length)
    ];
  }

  function mWire(
    c: number,
    o = 0.18,
  ) {
    return new THREE.MeshBasicMaterial({
      color: c,
      wireframe: true,
      transparent: true,
      opacity: o,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  function mEdge(
    c: number,
    o = 0.45,
  ) {
    return new THREE.LineBasicMaterial({
      color: c,
      transparent: true,
      opacity: o,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  const uWobble = {
    value: 0,
  };

  function mGlass(
    c: number,
    ei = 0.2,
  ) {
    const m =
      new THREE.MeshPhysicalMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: ei,
        metalness: 0,
        roughness: 1,
        transmission: 0,
        thickness: 0,
        ior: 1,
        transparent: true,
        opacity: 0.4,
        clearcoat: 0,
        clearcoatRoughness: 1,
        side: THREE.DoubleSide,
      });

    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uWobble;

      shader.vertexShader =
        "uniform float uTime;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          `
          #include <begin_vertex>

          float wob =
            sin(
              uTime * 1.3 +
              position.x * 2.4 +
              position.y * 1.8 +
              position.z * 2.1
            ) * 0.055;

          transformed += normal * wob;
          `,
        );
    };

    return m;
  }

  /* ========================================
     CRYSTAL GEOMETRIES
  ======================================== */

  const gCrystal =
    (() => {
      const g =
        new THREE.IcosahedronGeometry(
          0.5,
          0,
        );

      g.scale(
        0.55,
        1.7,
        0.55,
      );

      return g;
    })();

  const gCrystalL =
    (() => {
      const g =
        new THREE.IcosahedronGeometry(
          0.65,
          0,
        );

      g.scale(
        0.5,
        2.1,
        0.5,
      );

      return g;
    })();

  function ndC1(c: number) {
    const g = new THREE.Group();

    g.add(
      new THREE.Mesh(
        gCrystal,
        mGlass(c, 0.25),
      ),
    );

    g.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(gCrystal),
        mEdge(c, 0.5),
      ),
    );

    return g;
  }

  function ndC2(c: number) {
    const g = new THREE.Group();

    g.add(
      new THREE.Mesh(
        gCrystalL,
        mGlass(c, 0.2),
      ),
    );

    g.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(gCrystalL),
        mEdge(c, 0.4),
      ),
    );

    g.add(
      new THREE.Mesh(
        gCrystalL.clone(),
        mWire(c, 0.05),
      ),
    );

    return g;
  }

  const makers = [
    ndC1,
    ndC2,
  ];

  const wt = [60, 40];
  const tw = wt.reduce(
    (a, b) => a + b,
    0,
  );

  function pickT() {
    const r = Math.random() * tw;

    let s = 0;

    for (let i = 0; i < wt.length; i++) {
      s += wt[i];

      if (r < s) {
        return i;
      }
    }

    return 0;
  }

  /* ========================================
     SPAWN OBJECTS
  ======================================== */

  const objs: {
    mesh: THREE.Group;
    home: THREE.Vector3;
    rs: THREE.Vector3;
    dAngle: number;
    dTurn: number;
    dSpeed: number;
    dRadius: number;
    vel: THREE.Vector3;
  }[] = [];

  const COUNT = 55;

  const aspect =
    window.innerWidth /
    window.innerHeight;

  for (let i = 0; i < COUNT; i++) {
    const c = pickC();

    const mesh =
      makers[pickT()](c);

    const angle =
      Math.random() *
      Math.PI *
      2;

    let r: number;

    if (Math.random() < 0.85) {
      r = 8 + Math.random() * 16;

      if (mob) {
        r *= 0.8;
      }
    } else {
      r = 3 + Math.random() * 5;

      mesh.position.z =
        -8 - Math.random() * 6;
    }

    const x =
      Math.cos(angle) * r;

    const ySquash =
      aspect > 1
        ? 0.5
        : (1 / aspect) * 0.4;

    const y =
      Math.sin(angle) *
      r *
      ySquash;

    const z =
      mesh.position.z ||
      (-4 + Math.random() * 8);

    mesh.position.set(
      x,
      y,
      z,
    );

    mesh.rotation.set(
      Math.random() * 6.28,
      Math.random() * 6.28,
      Math.random() * 6.28,
    );

    const sc =
      0.8 +
      Math.random() * 0.5;

    mesh.scale.setScalar(sc);

    S.add(mesh);

    const driftAngle =
      Math.random() * 6.28;

    const driftSpeed =
      0.3 +
      Math.random() * 0.6;

    objs.push({
      mesh,
      home: mesh.position.clone(),

      rs: new THREE.Vector3(
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.005,
      ),

      dAngle: driftAngle,

      dTurn:
        0.1 +
        Math.random() * 0.3,

      dSpeed: driftSpeed,

      dRadius:
        1.5 +
        Math.random() * 3,

      vel:
        new THREE.Vector3(
          0,
          0,
          0,
        ),
    });
  }

  /* ========================================
     MOUSE
  ======================================== */

  const m = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    nx: 0,
    ny: 0,
  };

  const m3 =
    new THREE.Vector3(
      9999,
      9999,
      0,
    );

  function onMove(
    cx: number,
    cy: number,
  ) {
    m.x = cx;
    m.y = cy;

    m.nx =
      (cx / window.innerWidth) *
        2 -
      1;

    m.ny =
      -(cy / window.innerHeight) *
        2 +
      1;

    cursor.style.left =
      `${cx}px`;

    cursor.style.top =
      `${cy}px`;

    const v =
      new THREE.Vector3(
        m.nx,
        m.ny,
        0.5,
      ).unproject(C);

    const d =
      v.sub(C.position).normalize();

    m3
      .copy(C.position)
      .add(
        d.multiplyScalar(
          -C.position.z / d.z,
        ),
      );
  }

  const handlePointerMove =
    (event: PointerEvent) => {
      onMove(
        event.clientX,
        event.clientY,
      );
    };

  const handleTouchMove =
    (event: TouchEvent) => {
      if (event.touches.length) {
        onMove(
          event.touches[0].clientX,
          event.touches[0].clientY,
        );
      }
    };

  window.addEventListener(
    "pointermove",
    handlePointerMove,
  );

  window.addEventListener(
    "touchmove",
    handleTouchMove,
    { passive: true },
  );

  /* ========================================
     LOGO TILT + GLOW
  ======================================== */

  let glowVal = 0;

  function updateLogo() {
    const rect =
      logoWrapper.getBoundingClientRect();

    const pad = 80;

    const nearX =
      m.x >= rect.left - pad &&
      m.x <= rect.right + pad;

    const nearY =
      m.y >= rect.top - pad &&
      m.y <= rect.bottom + pad;

    const isNear =
      nearX && nearY;

    let target = 0;

    if (isNear) {
      const lcx =
        rect.left +
        rect.width / 2;

      const lcy =
        rect.top +
        rect.height / 2;

      const dx =
        (m.x - lcx) /
        (rect.width / 2 + pad);

      const dy =
        (m.y - lcy) /
        (rect.height / 2 + pad);

      const d =
        Math.sqrt(
          dx * dx +
          dy * dy,
        );

      target =
        Math.max(
          0,
          1 - d,
        );
    }

    glowVal +=
      (target - glowVal) *
      0.08;

    logoGlow.style.opacity =
      (
        glowVal * 1.5
      ).toFixed(3);

    logoGlow.style.transform =
      `scale(${1 + glowVal * 0.4})`;

    if (glowVal > 0.01) {
      const b =
        1 +
        glowVal * 0.25;

      const s1 =
        20 +
        glowVal * 80;

      const s2 =
        60 +
        glowVal * 160;

      logoImg.style.filter =
        `drop-shadow(0 0 ${s1}px rgba(66,255,90,${(
          0.2 +
          glowVal * 0.7
        ).toFixed(2)})) drop-shadow(0 0 ${s2}px rgba(66,255,90,${(
          0.1 +
          glowVal * 0.4
        ).toFixed(2)})) brightness(${b.toFixed(2)})`;
    } else {
      logoImg.style.filter =
        "drop-shadow(0 0 20px rgba(66,255,90,.1))";
    }
  }

  /* ========================================
     GLITCH
  ======================================== */

  let gb = false;

  function glitch() {
    if (gb) return;

    gb = true;

    const dur =
      160 +
      Math.random() * 220;

    const t0 =
      performance.now();

    const pp =
      glitchLayers.map(() => ({
        y: Math.random() * 90,

        h:
          3 +
          Math.random() * 15,

        x:
          (Math.random() < 0.5
            ? -1
            : 1) *
          (5 +
            Math.random() * 28),

        d:
          Math.random() * 40,
      }));

    function tk(now: number) {
      const e =
        now - t0;

      const p =
        Math.min(
          1,
          e / dur,
        );

      glitchLayers.forEach(
        (layer, i) => {
          const s = pp[i];

          const q =
            Math.max(
              0,
              Math.min(
                1,
                (e - s.d) /
                  (dur - s.d),
              ),
            );

          if (q <= 0) {
            layer.style.opacity =
              "0";

            return;
          }

          const lc2 =
            Math.sin(
              Math.PI * q,
            );

          const st =
            Math.random() < 0.2
              ? (Math.random() -
                  0.5) *
                15
              : 0;

          layer.style.opacity =
            (
              0.35 +
              0.6 * lc2
            ).toFixed(3);

          layer.style.clipPath =
            `inset(${s.y}% 0 ${Math.max(
              0,
              100 -
                s.y -
                s.h *
                  (0.7 +
                    Math.random() *
                      0.6),
            )}% 0)`;

          layer.style.transform =
            `translate3d(${
              s.x * lc2 + st
            }px, ${
              (Math.random() - 0.5) *
              3
            }px, 0)`;
        },
      );

      noiseBars.forEach(
        (bar, i) => {
          const on =
            ((e + i * 50) %
              100 <
              55) &&
            e < dur * 0.85;

          if (!on) {
            bar.style.opacity =
              "0";

            return;
          }

          bar.style.top =
            `${
              5 +
              Math.random() *
                90
            }%`;

          bar.style.opacity =
            (
              0.15 +
              Math.random() *
                0.5
            ).toFixed(2);

          bar.style.transform =
            `scaleX(${
              0.4 +
              Math.random() *
                1.2
            })`;
        },
      );

      if (p < 1) {
        requestAnimationFrame(tk);
      } else {
        glitchLayers.forEach(
          (layer) => {
            layer.style.opacity =
              "0";

            layer.style.clipPath =
              "none";
          },
        );

        noiseBars.forEach(
          (bar) => {
            bar.style.opacity =
              "0";
          },
        );

        gb = false;
      }
    }

    requestAnimationFrame(tk);
  }

  let logoGlitchInterval: ReturnType<typeof setInterval> | null = null;

  function handleLogoEnter() {
    glitch();

    if (logoGlitchInterval === null) {
      logoGlitchInterval = setInterval(() => {
        glitch();
      }, 1800);
    }
  }

  function handleLogoLeave() {
    if (logoGlitchInterval !== null) {
      clearInterval(logoGlitchInterval);
      logoGlitchInterval = null;
    }
  }

  logoWrapper.addEventListener(
    "mouseenter",
    handleLogoEnter,
  );

  logoWrapper.addEventListener(
    "mouseleave",
    handleLogoLeave,
  );

  /* ========================================
     ANIMATION LOOP
  ======================================== */

  const clk =
    new THREE.Clock();

  const dt = 1 / 60;

  let animationFrameId = 0;
  let stopped = false;

  function loop() {
    if (stopped) return;

    animationFrameId =
      requestAnimationFrame(loop);

    const t =
      clk.getElapsedTime();

    uWobble.value = t;

    objs.forEach((o) => {
      const {
        mesh,
        home,
        rs,
        vel,
      } = o;

      o.dAngle +=
        o.dTurn * dt;

      const driftX =
        Math.cos(o.dAngle) *
        o.dSpeed *
        dt;

      const driftY =
        Math.sin(o.dAngle) *
        o.dSpeed *
        dt *
        0.6;

      vel.x +=
        driftX * 0.15;

      vel.y +=
        driftY * 0.15;

      const hx =
        home.x -
        mesh.position.x;

      const hy =
        home.y -
        mesh.position.y;

      const hz =
        home.z -
        mesh.position.z;

      const homeDist =
        Math.sqrt(
          hx * hx +
            hy * hy +
            hz * hz,
        );

      if (
        homeDist >
        o.dRadius
      ) {
        const pull =
          (homeDist -
            o.dRadius) *
          0.008;

        vel.x +=
          (hx / homeDist) *
          pull;

        vel.y +=
          (hy / homeDist) *
          pull;

        vel.z +=
          (hz / homeDist) *
          pull;
      }

      const dx =
        mesh.position.x -
        m3.x;

      const dy =
        mesh.position.y -
        m3.y;

      const dist =
        Math.sqrt(
          dx * dx +
            dy * dy,
        );

      if (
        dist < 8 &&
        dist > 0.01
      ) {
        const f =
          1 - dist / 8;

        const force =
          f * f * 2.5;

        vel.x +=
          (dx / dist) *
          force *
          0.1;

        vel.y +=
          (dy / dist) *
          force *
          0.1;

        vel.z +=
          (Math.random() - 0.5) *
          force *
          0.02;

        mesh.rotation.x +=
          rs.x * f * 20;

        mesh.rotation.y +=
          rs.y * f * 20;
      }

      vel.multiplyScalar(
        0.96,
      );

      mesh.position.x +=
        vel.x;

      mesh.position.y +=
        vel.y;

      mesh.position.z +=
        vel.z;

      mesh.rotation.x +=
        rs.x;

      mesh.rotation.y +=
        rs.y;

      mesh.rotation.z +=
        rs.z;
    });

    pl1.position.x =
      Math.cos(t * 0.2) *
      15;

    pl1.position.z =
      Math.sin(t * 0.2) *
      12;

    pl2.position.x =
      Math.cos(
        t * 0.15 + 2,
      ) * 13;

    pl2.position.z =
      Math.sin(
        t * 0.15 + 2,
      ) * 10;

    updateLogo();

    C.position.x +=
      (m.nx * 2 -
        C.position.x) *
      0.012;

    C.position.y +=
      (m.ny -
        C.position.y) *
      0.012;

    C.lookAt(
      0,
      0,
      0,
    );

    comp.render();
  }

  loop();

  /* ========================================
     RESIZE
  ======================================== */

  function handleResize() {
    C.aspect =
      window.innerWidth /
      window.innerHeight;

    C.updateProjectionMatrix();

    R.setSize(
      window.innerWidth,
      window.innerHeight,
    );

    comp.setSize(
      window.innerWidth,
      window.innerHeight,
    );
  }

  window.addEventListener(
    "resize",
    handleResize,
  );

  /* ========================================
     CLICK
  ======================================== */

  /* ========================================
     CLEANUP
  ======================================== */

  return () => {
    stopped = true;

    cancelAnimationFrame(
      animationFrameId,
    );

    window.removeEventListener(
      "pointermove",
      handlePointerMove,
    );

    window.removeEventListener(
      "touchmove",
      handleTouchMove,
    );

    window.removeEventListener(
      "resize",
      handleResize,
    );

    logoWrapper.removeEventListener(
      "mouseenter",
      handleLogoEnter,
    );

    logoWrapper.removeEventListener(
      "mouseleave",
      handleLogoLeave,
    );

    if (logoGlitchInterval !== null) {
      clearInterval(logoGlitchInterval);
      logoGlitchInterval = null;
    }

    /* Stop WebGL rendering */

    R.setAnimationLoop(null);

    /* Dispose crystal resources */

    const materials =
      new Set<THREE.Material>();

    S.traverse((object) => {
      if (
        object instanceof
        THREE.Mesh
      ) {
        object.geometry.dispose();

        if (
          Array.isArray(
            object.material,
          )
        ) {
          object.material.forEach(
            (material) =>
              materials.add(
                material,
              ),
          );
        } else {
          materials.add(
            object.material,
          );
        }
      }

      if (
        object instanceof
        THREE.LineSegments
      ) {
        object.geometry.dispose();

        materials.add(
          object.material,
        );
      }

      if (
        object instanceof
        THREE.Points
      ) {
        object.geometry.dispose();

        materials.add(
          object.material,
        );
      }
    });

    materials.forEach(
      (material) => {
        material.dispose();
      },
    );

    /* Dispose shared geometries */

    gCrystal.dispose();
    gCrystalL.dispose();

    /* Dispose post-processing */

    comp.dispose();

    /* Dispose renderer */

    R.dispose();

    R.forceContextLoss();

    /* Remove canvas WebGL context */

    canvas.width = 1;
    canvas.height = 1;
  };
}