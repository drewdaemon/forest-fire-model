import { STATE } from "./states";

// A burning cell turns into an empty cell
// A tree will burn if at least one neighbor is burning
// A tree ignites with probability f even if no neighbor is burning
// An empty space fills with a tree with probability p

// Regeneration factor
const P = 0.02;
// Probability of a lightening strike
const F = 1e-5;

export function performCycle(forest: STATE[][], temp: STATE[][]) {
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
  return copyTo(temp, forest);
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
