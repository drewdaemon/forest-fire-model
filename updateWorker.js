const P = .01;
const F = .001;

const STATES = {
    TREE: 0,
    BURNING: 1,
    EMPTY: 2
}

onmessage = function(e) {
    forest = e.data[0];
    temp = e.data[1];
    performCycle(forest, temp);
    postMessage([forest, temp]);
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
                        W = forest[i-1][j];
                        if (j !== 0) {
                            NW = forest[i-1][j-1];
                        }
                        if (j !== ylen-1) {
                            SW = forest[i-1][j+1];
                        }
                    }
                    if (i !== xlen-1) {
                        E = forest[i+1][j];
                        if (j !== 0) {
                            NE = forest[i+1][j-1];
                        }
                        if (j !== ylen-1) {
                            SE = forest[i+1][j+1];
                        }
                    }
                    if (j !== ylen-1) {
                        S = forest[i][j+1];
                    }
                    if (j !== 0) {
                        N = forest[i][j-1];
                    }
                    if (E === STATES.BURNING ||
                        NE === STATES.BURNING ||
                        SE === STATES.BURNING ||
                        W === STATES.BURNING ||
                        NW === STATES.BURNING ||
                        SW === STATES.BURNING ||
                        S === STATES.BURNING ||
                        N === STATES.BURNING) {
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
                        newState = STATES.TREE
                    }
                    break;
            }
            temp[i][j] = newState;
        }
    }
    return copyTo(temp, forest);
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

function lightning() {
    return Math.random() < F;
}

function regenerate() {
    return Math.random() < P;
}
