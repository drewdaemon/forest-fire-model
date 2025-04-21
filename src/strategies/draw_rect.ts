import { buildForest, performCycle } from "../simulation";
import { STATE } from "../states";
import { Strategy } from "../types";

export class DrawRectStrategy extends Strategy {
  static id = "draw_rect";
  static option = "Calls to fillRect";
  static description =
    "Uses the fillRect method to draw rectangles on the canvas.";

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
      drawCanvas(this.forest, 1, this.ctx);
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

const COLORS = {
  0: "#2e913a",
  1: "#ff2b23",
  2: "#000000",
};

function drawCanvas(
  updated: STATE[][],
  squareSize: number,
  ctx: CanvasRenderingContext2D
) {
  for (let row = 0; row < updated.length; row++) {
    for (let col = 0; col < updated[0].length; col++) {
      ctx.fillStyle = COLORS[updated[row][col]];
      ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
    }
  }
}
