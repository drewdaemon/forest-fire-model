(function () {
  // A burning cell turns into an empty cell
  // A tree will burn if at least one neighbor is burning
  // A tree ignites with probability f even if no neighbor is burning
  // An empty space fills with a tree with probability p

  const STATES = {
    TREE: 0,
    BURNING: 1,
    EMPTY: 2,
  };

  const COLORS = {
    0: "#2e913a",
    1: "#ff2b23",
    2: "#000000",
  };

  // Regeneration factor
  window.P = 0.02;
  // Probability of a lightening strike
  window.F = 1e-4;
  // Size of each square in pixels
  window.SQUARE_SIZE = 3;

  document.addEventListener("DOMContentLoaded", function (event) {
    const canvas = buildElements();

    const ctx = canvas.getContext("2d");

    const { width, height } = canvas.getBoundingClientRect();

    canvas.width = width;
    canvas.height = height;

    const forestWidth = Math.floor(canvas.width / SQUARE_SIZE);
    const forestHeight = Math.floor(canvas.height / SQUARE_SIZE);

    const forest = populateForest(forestWidth, forestHeight);
    const temp = populateForest(forestWidth, forestHeight);

    function step() {
      drawCanvas(forest, SQUARE_SIZE, ctx);
      performCycle(forest, temp);
      window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  });

  function buildElements(canvasWidth, canvasHeight) {
    const canvas = document.querySelector("canvas");
    document.body.appendChild(canvas);

    // Add slider to control F
    const sliderF = document.createElement("input");
    sliderF.type = "range";
    sliderF.min = Math.log10(1e-10);
    sliderF.max = Math.log10(1);
    sliderF.value = Math.log10(F);
    sliderF.step = 0.1;

    const sliderFLabel = document.createElement("label");
    sliderFLabel.innerText = `F: ${F.toExponential(2)}`;

    sliderF.addEventListener("input", function () {
      F = Math.pow(10, sliderF.value);
      sliderFLabel.innerText = `F: ${F.toExponential(2)}`;
    });

    // Add slider to control P
    const sliderP = document.createElement("input");
    sliderP.type = "range";
    sliderP.min = 0.01; // Minimum value for P
    sliderP.max = 0.05; // Maximum value for P
    sliderP.value = P;
    sliderP.step = 0.01;

    sliderP.addEventListener("input", function () {
      P = Math.pow(10, sliderP.value);
      sliderPLabel.innerText = `P: ${P.toExponential(2)}`;
    });

    const sliderPLabel = document.createElement("label");
    sliderPLabel.innerText = `P: ${P.toFixed(5)}`;

    const controlsContainer = document.querySelector(".controls");
    controlsContainer.appendChild(sliderP);
    controlsContainer.appendChild(sliderPLabel);
    controlsContainer.appendChild(sliderF);
    controlsContainer.appendChild(sliderFLabel);
    return canvas;
  }

  function performCycle(forest, temp) {
    const xlen = forest.length;
    const ylen = forest[0].length;
    for (let i = 0; i < xlen; i++) {
      for (let j = 0; j < ylen; j++) {
        const state = forest[i][j];
        let newState = state;
        switch (state) {
          case STATES.TREE:
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
              E === STATES.BURNING ||
              NE === STATES.BURNING ||
              SE === STATES.BURNING ||
              W === STATES.BURNING ||
              NW === STATES.BURNING ||
              SW === STATES.BURNING ||
              S === STATES.BURNING ||
              N === STATES.BURNING
            ) {
              newState = STATES.BURNING;
            } else if (lightning()) {
              newState = STATES.BURNING;
            }
            break;
          case STATES.BURNING:
            newState = STATES.EMPTY;
            break;
          case STATES.EMPTY:
            if (regenerate()) {
              newState = STATES.TREE;
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

  function copyTo(from, to) {
    const xlen = from.length;
    const ylen = from[0].length;
    for (let i = 0; i < xlen; i++) {
      for (let j = 0; j < ylen; j++) {
        to[i][j] = from[i][j];
      }
    }
    return to;
  }

  function drawCanvas(updated, squareSize, ctx) {
    for (let i = 0; i < updated.length; i++) {
      for (let j = 0; j < updated[0].length; j++) {
        ctx.fillStyle = getColor(updated[i][j]);
        ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
      }
    }
  }

  function populateForest(width, height) {
    const forest = [];
    for (let i = 0; i < width; i++) {
      const col = [];
      for (let j = 0; j < height; j++) {
        col.push(STATES.TREE);
      }
      forest.push(col);
    }
    return forest;
  }

  function getColor(state) {
    return COLORS[state];
  }
})();
