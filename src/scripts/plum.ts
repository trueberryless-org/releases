const R180 = Math.PI;
const R90 = Math.PI / 2;
const R15 = Math.PI / 12;
const COLOR = "#88888825";
const MIN_BRANCH = 30;
const BRANCH_LENGTH = 6;
const FRAME_INTERVAL = 1000 / 40;
const NARROW_WIDTH = 500;

export function initPlum() {
  const canvas = document.getElementById("plum-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const startPlum = createPlumStarter(canvas, context);

  startPlum();
  window.addEventListener("resize", startPlum);
}

function createPlumStarter(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
) {
  let animationId = 0;
  let width = 0;

  return function startPlum() {
    if (window.innerWidth === width) return;
    width = window.innerWidth;

    cancelAnimationFrame(animationId);
    animationId = drawPlum(canvas, context, (id) => {
      animationId = id;
    });
  };
}

function drawPlum(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  onFrame: (animationId: number) => void
): number {
  const width = window.innerWidth;
  const height = window.innerHeight;

  resizeCanvas(canvas, context, width, height);

  let steps: Step[] = [];

  function step(x: number, y: number, rad: number, counter = { value: 0 }) {
    const length = Math.random() * BRANCH_LENGTH;
    counter.value += 1;

    const [nx, ny] = polarToCartesian(x, y, length, rad);

    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(nx, ny);
    context.stroke();

    if (nx < -100 || nx > width + 100 || ny < -100 || ny > height + 100) return;

    const rad1 = rad + Math.random() * R15;
    const rad2 = rad - Math.random() * R15;
    const rate = counter.value <= MIN_BRANCH ? 0.8 : 0.5;

    if (Math.random() < rate) steps.push(() => step(nx, ny, rad1, counter));
    if (Math.random() < rate) steps.push(() => step(nx, ny, rad2, counter));
  }

  steps = [
    () => step(getRandomMiddle() * width, -5, R90),
    () => step(getRandomMiddle() * width, height + 5, -R90),
    () => step(-5, getRandomMiddle() * height, 0),
    () => step(width + 5, getRandomMiddle() * height, R180),
  ];
  if (width < NARROW_WIDTH) steps = steps.slice(0, 2);

  let lastTime = performance.now();

  function frame() {
    if (performance.now() - lastTime >= FRAME_INTERVAL) {
      const previousSteps = steps;
      steps = [];
      lastTime = performance.now();

      if (!previousSteps.length) return;

      for (const previousStep of previousSteps) {
        if (Math.random() < 0.5) steps.push(previousStep);
        else previousStep();
      }
    }

    onFrame(requestAnimationFrame(frame));
  }

  return requestAnimationFrame(frame);
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const dpi = window.devicePixelRatio || 1;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = dpi * width;
  canvas.height = dpi * height;

  context.scale(dpi, dpi);
  context.lineWidth = 1;
  context.strokeStyle = COLOR;
}

function polarToCartesian(
  x: number,
  y: number,
  radius: number,
  theta: number
): [number, number] {
  return [x + radius * Math.cos(theta), y + radius * Math.sin(theta)];
}

function getRandomMiddle() {
  return Math.random() * 0.6 + 0.2;
}

type Step = () => void;
