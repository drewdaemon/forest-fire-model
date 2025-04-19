import { STATE } from "./states";

const COLORS = {
  0: "#2e913a",
  1: "#ff2b23",
  2: "#000000",
};

const COLORS_IMAGE_DATA = {
  0: [46, 145, 58, 255],
  1: [255, 43, 35, 255],
  2: [0, 0, 0, 255],
};

export function drawCanvas(
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

export function drawCanvasUsingImageData(
  updated: STATE[][],
  _squareSize: number,
  canvasWidth: number,
  canvasHeight: number,
  ctx: CanvasRenderingContext2D
) {
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
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
