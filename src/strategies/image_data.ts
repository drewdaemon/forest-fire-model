import { buildForest, performCycle } from "../simulation";
import { STATE } from "../states";
import { Strategy } from "../types";

export class ImageDataStrategy extends Strategy {
  static id = "image_data";
  static option = "ImageData API";
  static description =
    "Uses the ImageData API to manipulate the pixels directly.";

  private forest: STATE[][];
  private temp: STATE[][];
  private ctx: CanvasRenderingContext2D;
  private stopped = true;

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    super({ canvas });
    const ctx = canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
    });

    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }

    this.ctx = ctx;
    this.forest = buildForest(canvas.width, canvas.height);
    this.temp = buildForest(canvas.width, canvas.height);
  }

  start() {
    this.stopped = false;

    const cycle = () => {
      drawCanvasUsingImageData(this.forest, this.ctx);
      performCycle(this.forest, this.temp);

      if (!this.stopped) {
        window.requestAnimationFrame(() => cycle());
      }
    };

    cycle();
  }

  stop() {
    // Stop the simulation
    this.forest = [];
    this.temp = [];
    this.stopped = true;
  }
}

const COLORS_IMAGE_DATA = {
  0: [46, 145, 58, 255],
  1: [255, 43, 35, 255],
  2: [0, 0, 0, 255],
};

function drawCanvasUsingImageData(
  updated: STATE[][],
  ctx: CanvasRenderingContext2D
) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  for (let row = 0; row < updated.length; row++) {
    for (let col = 0; col < updated[0].length; col++) {
      const pixelStart = (row * imageData.width + col) * 4;
      const color = COLORS_IMAGE_DATA[updated[row][col]];
      for (let i = 0; i < color.length; i++) {
        data[pixelStart + i] = color[i];
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
