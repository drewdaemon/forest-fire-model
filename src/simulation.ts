import { STATE } from "./states";

// A burning cell turns into an empty cell
// A tree will burn if at least one neighbor is burning
// A tree ignites with probability f even if no neighbor is burning
// An empty space fills with a tree with probability p

// Regeneration factor
export const P = 0.02;
// Probability of a lightening strike
export const F = 1e-5;

export function performCycle(forest: number[][], temp: number[][]) {
  const ylen = forest.length;
  const xlen = forest[0].length;
  for (let row = 0; row < ylen; row++) {
    for (let col = 0; col < xlen; col++) {
      const state = forest[row][col];
      let newState = state;
      switch (state) {
        case STATE.TREE:
          if (
            forest[row - 1]?.[col - 1] === STATE.BURNING ||
            forest[row - 1]?.[col] === STATE.BURNING ||
            forest[row - 1]?.[col + 1] === STATE.BURNING ||
            forest[row][col + 1] === STATE.BURNING ||
            forest[row + 1]?.[col + 1] === STATE.BURNING ||
            forest[row + 1]?.[col] === STATE.BURNING ||
            forest[row + 1]?.[col - 1] === STATE.BURNING ||
            forest[row][col - 1] === STATE.BURNING ||
            lightning()
          ) {
            newState = STATE.BURNING;
          }
          break;
        case STATE.BURNING:
          newState = STATE.EMPTY;
          break;
        case STATE.EMPTY:
          if (regenerate()) {
            newState = STATE.TREE;
          }
          break;
      }
      temp[row][col] = newState;
    }
  }
  copyTo(temp, forest);
}

export function performIntCycle(
  forest: Uint8Array,
  temp: Uint8Array,
  width: number
) {
  const ylen = forest.length / width;
  const xlen = width;
  for (let row = 0; row < ylen; row++) {
    for (let col = 0; col < xlen; col++) {
      const state = forest[row * width + col];
      let newState = state;
      switch (state) {
        case STATE.TREE:
          if (
            forest[(row - 1) * width + col - 1] === STATE.BURNING ||
            forest[(row - 1) * width + col] === STATE.BURNING ||
            forest[(row - 1) * width + col + 1] === STATE.BURNING ||
            forest[row * width + col + 1] === STATE.BURNING ||
            forest[(row + 1) * width + col + 1] === STATE.BURNING ||
            forest[(row + 1) * width + col] === STATE.BURNING ||
            forest[(row + 1) * width + col - 1] === STATE.BURNING ||
            forest[row * width + col - 1] === STATE.BURNING ||
            lightning()
          ) {
            newState = STATE.BURNING;
          }
          break;
        case STATE.BURNING:
          newState = STATE.EMPTY;
          break;
        case STATE.EMPTY:
          if (regenerate()) {
            newState = STATE.TREE;
          }
          break;
      }
      temp[row * width + col] = newState;
    }
  }
  for (let i = 0; i < forest.length; i++) {
    forest[i] = temp[i];
  }
}

function lightning() {
  return Math.random() < F;
}

function regenerate() {
  return Math.random() < P;
}

function copyTo(from: any[][], to: any[][]) {
  const ylen = from.length;
  const xlen = from[0].length;
  for (let row = 0; row < ylen; row++) {
    for (let col = 0; col < xlen; col++) {
      to[row][col] = from[row][col];
    }
  }
  return to;
}

export function buildForest(width: number, height: number) {
  const forest = [];
  for (let row = 0; row < height; row++) {
    const row = [];
    for (let col = 0; col < width; col++) {
      row.push(STATE.TREE);
    }
    forest.push(row);
  }
  return forest;
}
