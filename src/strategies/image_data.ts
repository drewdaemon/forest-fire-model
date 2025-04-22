import { COLORS } from "../colors";
import { buildForest, performCycle } from "../simulation";
import { Strategy } from "../types";

export class ImageDataStrategy extends Strategy {
  static id = "image_data";
  static option = "ImageData API";
  static description =
    "Uses the ImageData API to manipulate the pixels directly.";

  private forest: number[][];
  private temp: number[][];
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
    this.stopped = true;
  }
}

function drawCanvasUsingImageData(
  updated: number[][],
  ctx: CanvasRenderingContext2D
) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  for (let row = 0; row < updated.length; row++) {
    for (let col = 0; col < updated[0].length; col++) {
      const pixelStart = (row * imageData.width + col) * 4;
      const color = COLORS[updated[row][col]];
      for (let i = 0; i < color.length; i++) {
        data[pixelStart + i] = color[i];
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
