export class NeuralBg {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.nodes = [];
    this.connections = [];
    this.signals = [];
    this.frame = 0;
    this.lastMove = 0;
    this.autoTimer = 0;
    this.scrollTarget = 0;
    this.scrollOffset = 0;
    this.palette = {};
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.running = false;

    this.handleResize = this.handleResize.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.syncPalette = this.syncPalette.bind(this);
    this.handleThemeChange = this.handleThemeChange.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener("resize", this.handleResize, { passive: true });
    window.addEventListener("mousemove", this.handleMove, { passive: true });
    window.addEventListener("click", this.handleClick);
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    window.addEventListener("portfolio-theme-change", this.handleThemeChange);
    if (this.reducedMotion.addEventListener) {
      this.reducedMotion.addEventListener("change", () => this.restart());
    } else if (this.reducedMotion.addListener) {
      this.reducedMotion.addListener(() => this.restart());
    }

    this.restart();
  }

  restart() {
    cancelAnimationFrame(this.frame);
    clearInterval(this.autoTimer);
    this.handleResize();

    if (this.reducedMotion.matches) {
      this.running = false;
      this.draw(true);
      return;
    }

    this.running = true;
    this.autoTimer = window.setInterval(() => this.quietPulse(), 4000);
    this.loop();
  }

  handleResize() {
    const { innerWidth, innerHeight } = window;
    this.width = innerWidth;
    this.height = innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(innerWidth * this.dpr);
    this.canvas.height = Math.floor(innerHeight * this.dpr);
    this.canvas.style.width = `${innerWidth}px`;
    this.canvas.style.height = `${innerHeight}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.syncPalette();
    this.mobile = innerWidth < 768;
    this.maxForwardEdgeLength = clamp(innerWidth * 0.28, this.mobile ? 135 : 260, this.mobile ? 205 : 460);
    this.maxLocalEdgeLength = this.mobile ? 64 : 86;
    this.handleScroll();
    this.buildNetwork();
    this.ctx.fillStyle = this.palette.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  syncPalette() {
    const styles = getComputedStyle(document.documentElement);
    this.palette = {
      bg: readCssVar(styles, "--bg-void", "#04040f"),
      edgeRest: parseColor(readCssVar(styles, "--edge-rest", "rgba(60, 100, 200, 0.08)"), [60, 100, 200, 0.08]),
      edgeActive: parseColor(readCssVar(styles, "--edge-active", "rgba(80, 220, 255, 0.6)"), [80, 220, 255, 0.6]),
      nodeRest: parseColor(readCssVar(styles, "--node-rest", "rgba(60, 120, 220, 0.35)"), [60, 120, 220, 0.35]),
      nodeActive: parseColor(readCssVar(styles, "--node-active", "rgba(80, 220, 255, 1)"), [80, 220, 255, 1]),
      glow: parseColor(readCssVar(styles, "--neural-glow", "rgba(80, 220, 255, 0.8)"), [80, 220, 255, 0.8]),
      haloCore: readCssVar(styles, "--neural-halo-core", "rgba(0, 212, 255, 0.035)"),
      haloMid: readCssVar(styles, "--neural-halo-mid", "rgba(123, 94, 167, 0.018)"),
      haloEdge: readCssVar(styles, "--neural-halo-edge", "rgba(4, 4, 15, 0)"),
      signal: parseColor(readCssVar(styles, "--neural-signal", "rgba(143, 214, 148, 0.75)"), [143, 214, 148, 0.75])
    };
  }

  handleThemeChange() {
    this.syncPalette();
    if (!this.running) this.draw(true);
  }

  buildNetwork() {
    this.nodes = [];
    this.connections = [];
    this.signals = [];
    const counts = this.mobile ? [8, 14, 16, 14, 8] : [15, 30, 35, 25, 15];
    const xBands = [0.1, 0.3, 0.5, 0.7, 0.9];
    counts.forEach((count, layer) => {
      for (let index = 0; index < count; index += 1) {
        const spread = this.mobile ? 0.08 : 0.1;
        const ySlot = (index + 0.5) / count;
        this.nodes.push({
          id: `${layer}-${index}`,
          layer,
          baseX: this.width * clamp(xBands[layer] + randomBetween(-spread, spread), 0.04, 0.96),
          baseY: this.height * clamp(ySlot + randomBetween(-0.045, 0.045), 0.08, 0.92),
          x: 0,
          y: 0,
          radius: randomBetween(2, this.mobile ? 3.1 : 4),
          driftX: randomBetween(3, this.mobile ? 7 : 12),
          driftY: randomBetween(3, this.mobile ? 7 : 12),
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          speedX: randomBetween(0.00042, 0.00105),
          speedY: randomBetween(0.00036, 0.00092),
          activation: Math.random() * 0.12
        });
      }
    });

    this.updatePositions(performance.now());
    this.connectLayers();
    this.buildSignals();
  }

  connectLayers() {
    const byLayer = groupBy(this.nodes, "layer");
    const connectionCounts = new Map();
    const addConnection = (a, b) => {
      const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
      if (this.connections.some((edge) => edge.key === key)) return;
      if ((connectionCounts.get(a.id) || 0) >= 4) return;
      if ((connectionCounts.get(b.id) || 0) >= 5) return;
      this.connections.push({ key, a, b });
      connectionCounts.set(a.id, (connectionCounts.get(a.id) || 0) + 1);
      connectionCounts.set(b.id, (connectionCounts.get(b.id) || 0) + 1);
    };

    for (let layer = 0; layer < 4; layer += 1) {
      const current = byLayer.get(layer) || [];
      const next = byLayer.get(layer + 1) || [];
      current.forEach((node) => {
        next
          .map((candidate) => ({ candidate, distance: dist(node, candidate) }))
          .filter((item) => item.distance <= this.maxForwardEdgeLength)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3)
          .forEach(({ candidate }) => addConnection(node, candidate));
      });
    }

    for (let layer = 0; layer < 5; layer += 1) {
      const nodes = byLayer.get(layer) || [];
      nodes.forEach((node) => {
        nodes
          .filter((candidate) => candidate !== node)
          .map((candidate) => ({ candidate, distance: dist(node, candidate) }))
          .filter((item) => item.distance <= this.maxLocalEdgeLength)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 1)
          .forEach(({ candidate }) => addConnection(node, candidate));
      });
    }
  }

  buildSignals() {
    const forwardEdges = this.connections.filter((edge) => edge.a.layer !== edge.b.layer);
    const count = Math.min(this.mobile ? 12 : 26, forwardEdges.length);
    this.signals = [];

    for (let index = 0; index < count; index += 1) {
      const edge = forwardEdges[Math.floor(Math.random() * forwardEdges.length)];
      if (!edge) continue;
      const forward = edge.a.layer < edge.b.layer ? edge : { a: edge.b, b: edge.a };
      this.signals.push({
        edge: forward,
        progress: Math.random(),
        speed: randomBetween(0.0012, this.mobile ? 0.0024 : 0.0034),
        size: randomBetween(1.2, this.mobile ? 1.9 : 2.6),
        alpha: randomBetween(0.14, 0.34)
      });
    }
  }

  handleMove(event) {
    const now = performance.now();
    if (now - this.lastMove < 45) return;
    this.lastMove = now;

    const radius = this.mobile ? 110 : 150;
    this.nodes.forEach((node) => {
      const distance = Math.hypot(node.x - event.clientX, node.y - event.clientY);
      if (distance < radius) {
        const amount = 0.42 * (1 - distance / radius);
        this.activateForward(node, amount, 0, new Set());
      }
    });
  }

  handleClick(event) {
    const nearestItem = this.nodes
      .map((node) => ({ node, distance: Math.hypot(node.x - event.clientX, node.y - event.clientY) }))
      .sort((a, b) => a.distance - b.distance)[0];
    const nearest = nearestItem ? nearestItem.node : null;

    if (nearest) nearest.activation = 1;
    this.fireWave(1);
  }

  handleScroll() {
    const factor = this.mobile ? 0.035 : 0.055;
    this.scrollTarget = clamp(window.scrollY * factor, 0, this.height * 0.32);
  }

  quietPulse() {
    const inputLayer = this.nodes.filter((node) => node.layer === 0);
    const start = inputLayer[Math.floor(Math.random() * inputLayer.length)];
    if (!start) return;
    this.activateForward(start, 0.5, 0, new Set());
  }

  activateForward(node, amount, delay, visited) {
    window.setTimeout(() => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      node.activation = Math.min(1, node.activation + amount);
      const rightNeighbors = this.connections
        .map((edge) => {
          if (edge.a === node && edge.b.layer > node.layer) return edge.b;
          if (edge.b === node && edge.a.layer > node.layer) return edge.a;
          return null;
        })
        .filter(Boolean);

      rightNeighbors.forEach((neighbor) => {
        this.activateForward(neighbor, amount * 0.72, 50, visited);
      });
    }, delay);
  }

  fireWave(strength) {
    for (let layer = 0; layer < 5; layer += 1) {
      window.setTimeout(() => {
        this.nodes
          .filter((node) => node.layer === layer)
          .forEach((node) => {
            node.activation = Math.max(node.activation, strength * (1 - layer * 0.08));
          });
      }, layer * 120);
    }
  }

  loop(now = performance.now()) {
    if (!this.running) return;
    this.scrollOffset += (this.scrollTarget - this.scrollOffset) * 0.08;
    this.updatePositions(now);
    this.nodes.forEach((node) => {
      node.activation = Math.max(0, node.activation - 0.015);
    });
    this.signals.forEach((signal) => {
      signal.progress += signal.speed;
      if (signal.progress > 1) {
        signal.progress = 0;
        signal.alpha = randomBetween(0.14, 0.34);
      }
    });
    this.draw(false);
    this.frame = requestAnimationFrame(this.loop);
  }

  updatePositions(now) {
    this.nodes.forEach((node) => {
      node.x = node.baseX + Math.sin(now * node.speedX + node.phaseX) * node.driftX;
      node.y = node.baseY + Math.cos(now * node.speedY + node.phaseY) * node.driftY - this.scrollOffset;
    });
  }

  draw(staticFrame) {
    const ctx = this.ctx;
    ctx.fillStyle = this.palette.bg;
    ctx.fillRect(0, 0, this.width, this.height);
    this.drawField();

    this.connections.forEach(({ a, b }) => {
      const activation = Math.max(0, Math.min(1, (a.activation + b.activation) / 2));
      const baseOpacity = staticFrame ? 0.075 : 0.05;
      const edgeRest = [...this.palette.edgeRest];
      edgeRest[3] = Math.max(edgeRest[3], baseOpacity);
      ctx.strokeStyle = colorMix(edgeRest, this.palette.edgeActive, activation);
      ctx.lineWidth = 0.5 + activation;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    if (!staticFrame) {
      this.drawSignals();
    }

    this.nodes.forEach((node) => {
      const activation = Math.max(0, Math.min(1, node.activation));
      if (!this.mobile && activation > 0.3) {
        ctx.shadowBlur = activation * 16;
        ctx.shadowColor = withAlpha(this.palette.glow, this.palette.glow[3]);
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = colorMix(this.palette.nodeRest, this.palette.nodeActive, activation);
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + activation * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  drawField() {
    const ctx = this.ctx;
    const centerY = this.height * 0.42;

    const halo = ctx.createRadialGradient(this.width * 0.5, centerY, 0, this.width * 0.5, centerY, Math.max(this.width, this.height) * 0.7);
    halo.addColorStop(0, this.palette.haloCore);
    halo.addColorStop(0.48, this.palette.haloMid);
    halo.addColorStop(1, this.palette.haloEdge);
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  drawSignals() {
    const ctx = this.ctx;
    ctx.save();
    this.signals.forEach(({ edge, progress, size, alpha }) => {
      const x = edge.a.x + (edge.b.x - edge.a.x) * progress;
      const y = edge.a.y + (edge.b.y - edge.a.y) * progress;
      const activation = Math.max(edge.a.activation, edge.b.activation);
      const glow = alpha + activation * 0.42;

      if (!this.mobile) {
        ctx.shadowBlur = 10 + activation * 18;
        ctx.shadowColor = withAlpha(this.palette.glow, Math.min(this.palette.glow[3], glow + 0.2));
      }
      ctx.fillStyle = withAlpha(this.palette.signal, Math.min(this.palette.signal[3], glow));
      ctx.beginPath();
      ctx.arc(x, y, size + activation * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.restore();
  }
}

function groupBy(items, key) {
  return items.reduce((map, item) => {
    const value = item[key];
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(item);
    return map;
  }, new Map());
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function readCssVar(styles, name, fallback) {
  return styles.getPropertyValue(name).trim() || fallback;
}

function parseColor(value, fallback) {
  const color = value.trim();
  if (color.startsWith("#")) return parseHexColor(color, fallback);

  const match = color.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return fallback;

  const parts = match[1].split(/[\s,\/]+/).filter(Boolean);
  if (parts.length < 3) return fallback;

  const red = Number.parseFloat(parts[0]);
  const green = Number.parseFloat(parts[1]);
  const blue = Number.parseFloat(parts[2]);
  const alpha = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);

  if ([red, green, blue, alpha].some((part) => Number.isNaN(part))) return fallback;
  return [red, green, blue, alpha];
}

function parseHexColor(color, fallback) {
  const hex = color.slice(1);
  const full = hex.length === 3
    ? hex.split("").map((char) => `${char}${char}`).join("")
    : hex;

  if (full.length !== 6) return fallback;
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return fallback;

  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
    1
  ];
}

function withAlpha(color, alpha) {
  return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${alpha.toFixed(3)})`;
}

function colorMix(from, to, amount) {
  const mix = from.map((value, index) => value + (to[index] - value) * amount);
  return `rgba(${Math.round(mix[0])}, ${Math.round(mix[1])}, ${Math.round(mix[2])}, ${mix[3].toFixed(3)})`;
}
