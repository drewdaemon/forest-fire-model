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

  const COLORS_IMAGE_DATA = {
    0: [46, 145, 58, 255],
    1: [255, 43, 35, 255],
    2: [0, 0, 0, 255],
  };

  // Regeneration factor
  const P = 0.02;
  // Probability of a lightening strike
  const F = 1e-5;
  // Size of each square in pixels
  const SQUARE_SIZE = 1;

  let STRATEGY = "image-data";

  document.addEventListener("DOMContentLoaded", function (event) {
    const { canvas, fpsContainer } = buildElements();

    const ctx = canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
    });

    const { width, height } = canvas.getBoundingClientRect();

    canvas.width = width;
    canvas.height = height;

    const forestWidth = Math.floor(canvas.width / SQUARE_SIZE);
    const forestHeight = Math.floor(canvas.height / SQUARE_SIZE);

    const forest = populateForest(forestWidth, forestHeight);
    const temp = populateForest(forestWidth, forestHeight);

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
  });

  function buildElements(canvasWidth, canvasHeight) {
    const canvas = document.querySelector("canvas");
    document.body.appendChild(canvas);

    const controlsContainer = document.querySelector(".controls");

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
      STRATEGY = ev.target.value;
    });

    controlsContainer.appendChild(dropdown);

    return { canvas, fpsContainer: document.querySelector(".frame-rate") };
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
    for (let row = 0; row < updated.length; row++) {
      for (let col = 0; col < updated[0].length; col++) {
        ctx.fillStyle = getColor(updated[row][col]);
        ctx.fillRect(
          col * squareSize,
          row * squareSize,
          squareSize,
          squareSize
        );
      }
    }
  }

  function drawCanvasUsingImageData(
    updated,
    squareSize,
    canvasWidth,
    canvasHeight,
    ctx
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

  function populateForest(width, height) {
    const forest = [];
    for (let row = 0; row < height; row++) {
      const row = [];
      for (let col = 0; col < width; col++) {
        row.push(STATES.TREE);
      }
      forest.push(row);
    }
    return forest;
  }

  function getColor(state) {
    return COLORS[state];
  }
})();
