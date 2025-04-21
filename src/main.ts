import { strategies } from "./strategies";
import "./style.css";
import { Strategy } from "./types";

let strategy: Strategy | undefined;
let canvas: HTMLCanvasElement | undefined;

function main() {
  const { canvas, dropdown, fpsContainer } = setupElements();

  dropdown.addEventListener("input", (ev) => {
    const newStrategy = (ev.target as HTMLSelectElement).value;
    switchStrategy(newStrategy);
  });

  const initialStrategyId = "image_data";
  dropdown.value = initialStrategyId;

  switchStrategy(initialStrategyId);

  let frameCount = 0;
  let fps = 0;
  let fpsLastUpdate = performance.now();
  function frame() {
    const now = performance.now();

    // Update frame count and calculate FPS every second
    frameCount++;
    if (now - fpsLastUpdate >= 1000) {
      fps = frameCount;
      frameCount = 0;
      fpsLastUpdate = now;
      fpsContainer.innerText = `Frame rate: ${fps}/sec`;
    }

    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
}

document.addEventListener("DOMContentLoaded", main);

const switchStrategy = (newStrategy: string) => {
  const StrategyClass = strategies.get(newStrategy);
  if (!StrategyClass) {
    throw new Error(`Strategy not found`);
  }
  strategy?.stop();
  canvas?.remove();
  canvas = addCanvas();
  strategy = new StrategyClass({ canvas });
  strategy.start();
};

function setupElements() {
  const controlsContainer = document.querySelector(".controls")!;

  // Create dropdown menu
  const dropdown = document.createElement("select");
  dropdown.id = "strategy";
  const options = Array.from(strategies.values()).map((strategy) => ({
    value: strategy.id,
    text: strategy.option,
  }));

  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.text;
    dropdown.appendChild(opt);
  });

  controlsContainer.appendChild(dropdown);

  return {
    canvas: document.querySelector("canvas")!,
    dropdown,
    fpsContainer: document.querySelector(".frame-rate") as HTMLParagraphElement,
  };
}

const addCanvas = () => {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  const { width, height } = canvas.getBoundingClientRect();

  canvas.width = width;
  canvas.height = height;

  return canvas;
};
