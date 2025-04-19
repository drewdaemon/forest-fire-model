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
  const xlen = forest.length;
  const ylen = forest[0].length;
  for (let i = 0; i < xlen; i++) {
    for (let j = 0; j < ylen; j++) {
      const state = forest[i][j];
      let newState = state;
      switch (state) {
        case STATE.TREE:
          let W, NW, N, NE, E, SE, S, SW;
          if (i !== 0) {
            W = forest[i - 1][j];
            if (j !== 0) {
              NW = forest[i - 1][j - 1];
            }
            if (j !== ylen - 1) {
              SW = forest[i - 1][j + 1];
            }
          }
          if (i !== xlen - 1) {
            E = forest[i + 1][j];
            if (j !== 0) {
              NE = forest[i + 1][j - 1];
            }
            if (j !== ylen - 1) {
              SE = forest[i + 1][j + 1];
            }
          }
          if (j !== ylen - 1) {
            S = forest[i][j + 1];
          }
          if (j !== 0) {
            N = forest[i][j - 1];
          }
          if (
            E === STATE.BURNING ||
            NE === STATE.BURNING ||
            SE === STATE.BURNING ||
            W === STATE.BURNING ||
            NW === STATE.BURNING ||
            SW === STATE.BURNING ||
            S === STATE.BURNING ||
            N === STATE.BURNING
          ) {
            newState = STATE.BURNING;
          } else if (lightning()) {
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
      temp[i][j] = newState;
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
  const xlen = from.length;
  const ylen = from[0].length;
  for (let i = 0; i < xlen; i++) {
    for (let j = 0; j < ylen; j++) {
      to[i][j] = from[i][j];
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
