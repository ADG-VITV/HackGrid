export type FooterCoinElements = {
  canvas: HTMLCanvasElement;
  coinSrc: string;
  getAreaTop?: () => number;
};

type Coin = {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseRotation: number;
  rotation: number;
  vRotation: number;
};

export function initFooterCoins(elements: FooterCoinElements) {
  const { canvas, coinSrc, getAreaTop } = elements;

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let width = 0;
  let height = 0;

  const FALLBACK_LINE_RATIO = 0.32;

  const SPACING = 8;
  const JITTER_RATIO = 0.9;

  const MAX_COINS = 14000;

  const coinImg = new Image();
  coinImg.src = coinSrc;
  let imgLoaded = false;
  coinImg.onload = () => {
    imgLoaded = true;
  };

  let coins: Coin[] = [];

  function buildCoins() {
    const measuredTop = getAreaTop ? getAreaTop() : null;
    const areaTop =
      measuredTop !== null && measuredTop !== undefined && measuredTop > 0 && measuredTop < height
        ? measuredTop
        : height - height * FALLBACK_LINE_RATIO;

    const bandHeight = height - areaTop;

    const cols = Math.max(1, Math.floor(width / SPACING));
    const rows = Math.max(1, Math.floor(bandHeight / SPACING));

    const slots: { x: number; y: number }[] = [];

    for (let r = 0; r < rows; r++) {
      const rowOffset = (Math.random() - 0.5) * SPACING;

      for (let c = 0; c < cols; c++) {
        const baseX = c * SPACING + SPACING / 2 + rowOffset;
        const baseY = areaTop + r * SPACING + SPACING / 2;

        if (baseX < -SPACING || baseX > width + SPACING) continue;

        const jitterX = (Math.random() - 0.5) * SPACING * JITTER_RATIO;
        const jitterY = (Math.random() - 0.5) * SPACING * JITTER_RATIO;

        slots.push({
          x: Math.min(width - 4, Math.max(4, baseX + jitterX)),
          y: Math.min(height - 4, Math.max(areaTop, baseY + jitterY)),
        });
      }
    }

    let chosen = slots;

    if (slots.length > MAX_COINS) {
      for (let i = slots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
      }
      chosen = slots.slice(0, MAX_COINS);
    }

    coins = chosen.map((slot) => {
      const size = 9 + Math.random() * 7;
      const baseRotation = Math.random() * Math.PI * 2;

      return {
        homeX: slot.x,
        homeY: slot.y,
        x: slot.x + (Math.random() - 0.5) * 30,
        y: -Math.random() * height * 2 - 40,
        vx: 0,
        vy: 0.3 + Math.random() * 0.5,
        size,
        baseRotation,
        rotation: baseRotation,
        vRotation: 0,
      };
    });
  }

  function resize() {
    const rect = canvas.parentElement
      ? canvas.parentElement.getBoundingClientRect()
      : canvas.getBoundingClientRect();

    width = rect.width;
    height = rect.height;

    canvas.width = width;
    canvas.height = height;

    buildCoins();
  }

  const ro = new ResizeObserver(() => resize());
  if (canvas.parentElement) ro.observe(canvas.parentElement);
  resize();

  const mouse = { x: -9999, y: -9999, active: false };

  function handlePointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  }

  function handlePointerLeave() {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  }

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerleave", handlePointerLeave);

  const GRAVITY = 900;
  const SPRING_K = 22;
  const DAMPING = 0.92;
  const HOVER_RADIUS = 110;
  const REPEL_ACCEL = 9000;
  const LIFT_BIAS = 2.6;
  const MAX_SPEED = 650;
  const MAX_LIFT = 400;

  let animationFrameId = 0;
  let stopped = false;
  let lastTime = performance.now();

  function tick(now: number) {
    if (stopped) return;
    animationFrameId = requestAnimationFrame(tick);

    const dt = Math.min(0.032, (now - lastTime) / 1000);
    lastTime = now;

    ctx!.clearRect(0, 0, width, height);

    if (!imgLoaded) return;

    for (const c of coins) {
      c.vx += -(c.x - c.homeX) * SPRING_K * dt;
      c.vy += GRAVITY * dt;

      if (mouse.active) {
        const dx = c.x - mouse.x;
        const dy = c.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < HOVER_RADIUS && dist > 0.01) {
          const falloff = 1 - dist / HOVER_RADIUS;
          const accel = REPEL_ACCEL * falloff * falloff;

          c.vx += (dx / dist) * accel * dt * 0.7;
          c.vy += (dy / dist) * accel * dt * 0.7 - accel * dt * LIFT_BIAS;
          c.vRotation += (Math.random() - 0.5) * 0.6 * falloff;
        }
      }

      const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
      if (speed > MAX_SPEED) {
        const scale = MAX_SPEED / speed;
        c.vx *= scale;
        c.vy *= scale;
      }

      c.vx *= DAMPING;
      c.vy *= DAMPING;
      c.vRotation *= DAMPING;

      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rotation += c.vRotation * dt;

      if (c.y < c.homeY - MAX_LIFT) {
        c.y = c.homeY - MAX_LIFT;
        if (c.vy < 0) c.vy = 0;
      }

      if (c.y >= c.homeY) {
        c.y = c.homeY;
        c.vy = -c.vy * 0.45;
        if (Math.abs(c.vy) < 8) c.vy = 0;
      }

      c.rotation += (c.baseRotation - c.rotation) * Math.min(1, dt * 2);

      ctx!.save();
      ctx!.translate(c.x, c.y);
      ctx!.rotate(c.rotation);
      ctx!.drawImage(coinImg, -c.size / 2, -c.size / 2, c.size, c.size);
      ctx!.restore();
    }
  }

  animationFrameId = requestAnimationFrame(tick);

  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrameId);
    ro.disconnect();
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerleave", handlePointerLeave);
  };
}