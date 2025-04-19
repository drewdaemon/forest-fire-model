import { drawCanvas, drawCanvasUsingImageData } from "./rendering";
import { buildForest, performCycle } from "./simulation";
import "./style.css";

// Size of each square in pixels
const SQUARE_SIZE = 1;

let STRATEGY = "image-data";

function main() {
  const { canvas, fpsContainer } = setupElements();

  const ctx = canvas.getContext("2d", {
    alpha: false,
    willReadFrequently: true,
  })!;

  const { width, height } = canvas.getBoundingClientRect();

  canvas.width = width;
  canvas.height = height;

  const forestWidth = Math.floor(canvas.width / SQUARE_SIZE);
  const forestHeight = Math.floor(canvas.height / SQUARE_SIZE);

  const forest = buildForest(forestWidth, forestHeight);
  const temp = buildForest(forestWidth, forestHeight);

  let frameCount = 0;
  let fps = 0;
  let fpsLastUpdate = performance.now();
  function step() {
    const now = performance.now();

    // Update frame count and calculate FPS every second
    frameCount++;
    if (now - fpsLastUpdate >= 1000) {
      fps = frameCount;
      frameCount = 0;
      fpsLastUpdate = now;
      fpsContainer.innerText = `Frame rate: ${fps}/sec`;
    }

    if (STRATEGY === "image-data") {
      drawCanvasUsingImageData(
        forest,
        SQUARE_SIZE,
        canvas.width,
        canvas.height,
        ctx
      );
    } else {
      drawCanvas(forest, SQUARE_SIZE, ctx);
    }
    performCycle(forest, temp);
    window.requestAnimationFrame(step);
  }

  window.requestAnimationFrame(step);
}

document.addEventListener("DOMContentLoaded", main);

function setupElements() {
  const controlsContainer = document.querySelector(".controls")!;

  // Create dropdown menu
  const dropdown = document.createElement("select");
  dropdown.id = "strategy";
  const options = [
    { value: "draw-calls", text: "Calls to fillRect" },
    { value: "image-data", text: "ImageData API" },
  ];
  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.text;
    dropdown.appendChild(opt);
  });

  dropdown.value = STRATEGY;

  dropdown.addEventListener("input", (ev) => {
    STRATEGY = (ev.target as HTMLSelectElement).value;
  });

  controlsContainer.appendChild(dropdown);

  return {
    canvas: document.querySelector("canvas")!,
    fpsContainer: document.querySelector(".frame-rate") as HTMLParagraphElement,
  };
}
