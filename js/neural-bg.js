export class NeuralBg {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.nodes = [];
    this.connections = [];
    this.frame = 0;
    this.lastMove = 0;
    this.autoTimer = 0;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.running = false;

    this.handleResize = this.handleResize.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener("resize", this.handleResize, { passive: true });
    window.addEventListener("mousemove", this.handleMove, { passive: true });
    window.addEventListener("click", this.handleClick);
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
    this.mobile = innerWidth < 768;
    this.buildNetwork();
    this.ctx.fillStyle = "#04040f";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  buildNetwork() {
    this.nodes = [];
    this.connections = [];
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
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 4)
          .forEach(({ candidate }) => addConnection(node, candidate));
      });
    }

    for (let layer = 0; layer < 5; layer += 1) {
      const nodes = byLayer.get(layer) || [];
      nodes.forEach((node) => {
        nodes
          .filter((candidate) => candidate !== node)
          .map((candidate) => ({ candidate, distance: dist(node, candidate) }))
          .filter((item) => item.distance < 80)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 1)
          .forEach(({ candidate }) => addConnection(node, candidate));
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
    this.updatePositions(now);
    this.nodes.forEach((node) => {
      node.activation = Math.max(0, node.activation - 0.015);
    });
    this.draw(false);
    this.frame = requestAnimationFrame(this.loop);
  }

  updatePositions(now) {
    this.nodes.forEach((node) => {
      node.x = node.baseX + Math.sin(now * node.speedX + node.phaseX) * node.driftX;
      node.y = node.baseY + Math.cos(now * node.speedY + node.phaseY) * node.driftY;
    });
  }

  draw(staticFrame) {
    const ctx = this.ctx;
    ctx.fillStyle = staticFrame ? "#04040f" : "rgba(4, 4, 15, 0.18)";
    ctx.fillRect(0, 0, this.width, this.height);

    this.connections.forEach(({ a, b }) => {
      const activation = Math.max(0, Math.min(1, (a.activation + b.activation) / 2));
      const baseOpacity = staticFrame ? 0.075 : 0.05;
      ctx.strokeStyle = colorMix([60, 100, 200, baseOpacity], [80, 220, 255, 0.62], activation);
      ctx.lineWidth = 0.5 + activation;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    this.nodes.forEach((node) => {
      const activation = Math.max(0, Math.min(1, node.activation));
      if (!this.mobile && activation > 0.3) {
        ctx.shadowBlur = activation * 16;
        ctx.shadowColor = "rgba(80, 220, 255, 0.8)";
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = colorMix([60, 120, 220, 0.35], [80, 220, 255, 1], activation);
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + activation * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
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

function colorMix(from, to, amount) {
  const mix = from.map((value, index) => value + (to[index] - value) * amount);
  return `rgba(${Math.round(mix[0])}, ${Math.round(mix[1])}, ${Math.round(mix[2])}, ${mix[3].toFixed(3)})`;
}
