(function () {
    // A burning cell turns into an empty cell
    // A tree will burn if at least one neighbor is burning
    // A tree ignites with probability f even if no neighbor is burning
    // An empty space fills with a tree with probability p

    const STATES = {
        TREE: 0,
        BURNING: 1,
        EMPTY: 2
    }

    const COLORS = {
        0: '#2e913a',
        1: '#ff2b23',
        2: '#000000'
    }

    const CYCLE_DELAY = 100;

    document.addEventListener("DOMContentLoaded", function(event) {
        // const canvasWidth = window.outerWidth;
        // const canvasHeight = window.outerHeight;
        const canvasWidth = 700;
        const canvasHeight = 500;

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        let forest = populateForest(canvasWidth, canvasHeight);
        let temp = populateForest(canvasWidth, canvasHeight);

        const updateWorker = new Worker('updateWorker.js');

        updateWorker.postMessage([forest, temp]);
        updateWorker.onmessage = ev => {
            forest = ev.data[0];
            temp = ev.data[1];
            drawCanvas(forest, ctx);
            setTimeout(() => {
                updateWorker.postMessage([forest, temp]);
            }, CYCLE_DELAY);
        };
    });

    function drawCanvas(updated, ctx) {
        for (let i = 0; i < updated.length; i++) {
            for (let j = 0; j < updated[0].length; j++) {
                ctx.fillStyle = getColor(updated[i][j]);
                ctx.fillRect(i,j,1,1);
            }
        }
    }

    function populateForest(width, height) {
        const forest = [];
        for (let i = 0; i < width; i++) {
            const col = [];
            for (let j = 0; j < height; j++) {
                col.push(STATES.BURNING);
            }
            forest.push(col);
        }
        return forest;
    }

    function getColor(state) {
        return COLORS[state];
    }
})()
