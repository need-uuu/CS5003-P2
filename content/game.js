// random userid
// const playerId = Math.random() >= 0.5 ? 1 : 2;
let playerId = null;

// game parameters
const delayEnd = 60; // after seconds a new game starts

let timeOut = 0; // after seconds without any move the player will lose

let gridRows = 4;
let gridColumns = 4;

const height = 550;
const width = height * 0.9;

let cell = width / (gridColumns + 2); // size of cell
let margin = height - (gridRows + 1) * cell; // space for some info
let stroke = cell / 12; // stroke width
let dot = stroke; // dot radius

// set up colors
const colorBoard = "#fafae3";
const colorBoarder = "#ff94cd";
const colorDot = "#e65e84";

const colorPlayer1 = "#e74c3c";
const colorPlayer1H = "#ffbf80";

const colorPlayer2 = "#2471a3";
const colorPlayer2H = "#9bd8eb";

const colorDraw = "#2471a3";
const colorWin = "#e74c3c";

const bonusColor = "#fae791";  // cooper land
const cooperSide = "#fae791";

// set up text
let nameP1 = "Player 1";
let nameP2 = "Player 2";
const nameP1S = "P1";
const nameP2S = "P2";

let nameSize = cell / 3; // ensure it is inside the cell
let topSize = margin / 6;

const draw = "DRAW!";
const win = "WINS!";

// define an object "fence"
// for convenience
const fence = {
    bottom: 0,
    left: 1,
    right: 2,
    top: 3
}

// set up canvas
let canvas = document.getElementById("gameCanvas");
canvas.height = height;
canvas.width = width;
let canvasRect = canvas.getBoundingClientRect(); // make the mouse movement is related to the canvas position instead of the window position

//set up the context of canvas
let context = canvas.getContext("2d");
context.lineWidth = stroke;
context.textAlign = "center";
context.textBaseline = "middle";

// game variables
let squares;
let turn;
let currentCell; // where's the mouse
let scoreP1;
let scoreP2;
let timeEnd;

// new game
newGame();

// event handlers
canvas.addEventListener("mousemove", highlightGrid); // it would be corrected by using getBoundingClientRect
canvas.addEventListener("click", click);

function newGame() {
    // initialize game variables
    currentCell = [];
    scoreP1 = 0;
    scoreP2 = 0;
    timeEnd = 0;

    initSquares();


    // decide whose turn randomly
    turn = Math.random() >= 0.5;

    // set up the squares
    squares = [];
    for (let i = 0; i < gridRows; i++) {
        squares[i] = [];
        for (let j = 0; j < gridColumns; j++) {
            squares[i][j] = new square(getGridX(j), getGridY(i), cell, cell);
        }
    }

    // reset game state
    resetGame();
    drawBoard();
    drawGrid();

    // send request to server
    fetch('/initGame', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gridRows, gridColumns }),
    });

    // fetch('/newGame', { method: 'POST' });
}

function setGrid() {
    gridRows = parseInt(document.getElementById("gridRows").value);
    gridColumns = parseInt(document.getElementById("gridColumns").value);
    cell = width / (gridColumns + 2);
    margin = height - (gridRows + 1) * cell;
    stroke = cell / 12;
    dot = stroke;
    nameSize = cell / 3;
    topSize = margin / 6;
    context.lineWidth = stroke;

    fetch('/updateGrid', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gridRows, gridColumns }),
    })
        .then(response => response.json())
        .then(state => {
            gameState = state;
            newGame();
        });
}

function initSquares() {
    squares = [];
    for (let i = 0; i < gridRows; i++) {
        squares[i] = [];
        for (let j = 0; j < gridColumns; j++) {
            squares[i][j] = new square(getGridX(j), getGridY(i), cell, cell);
        }
    }
}

function click(event) {
    if (timeEnd > 0) {
        return;
    }

    let move = [];
    for (let cell of currentCell) {
        let side;
        if (squares[cell.row][cell.col].highlight === fence.bottom && !squares[cell.row][cell.col].sideBottom.selected) {
            side = 'bottom';
        } else if (squares[cell.row][cell.col].highlight === fence.top && !squares[cell.row][cell.col].sideTop.selected) {
            side = 'top';
        } else if (squares[cell.row][cell.col].highlight === fence.left && !squares[cell.row][cell.col].sideLeft.selected) {
            side = 'left';
        } else if (squares[cell.row][cell.col].highlight === fence.right && !squares[cell.row][cell.col].sideRight.selected) {
            side = 'right';
        }

        if (side) {
            move.push({ row: cell.row, col: cell.col, side: side });
        }
    }

    if (move.length > 0) {
        fetch('/move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ playerId, move })
        })
            .then(response => {
                if (response.ok) {
                    getGameState();
                    currentCell = [];
                }
            });
    }
}


// for mouse hover
function highlightGrid(event) {

    // if, no highlight
    if (timeEnd > 0) {
        return;
    }

    // get mouse position relative to the canvas
    let x = event.clientX - canvasRect.left;
    let y = event.clientY - canvasRect.top;

    // highlight the square side
    highlightSide(x, y);
}

function highlightSide(x, y) {

    // clear the previous highlight, only highlight one side
    for (let row of squares) {
        for (let square of row) {
            square.highlight = null;
        }
    }

    // get the gameboard's size
    let rows = squares.length;
    let cols = squares[0].length;

    // for check highlighted or not
    let highlighted = null;

    // where's the mouse
    currentCell = [];

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            // check inside or not
            if (squares[i][j].contains(x, y)) {

                // highlight current cell
                let side = squares[i][j].highlightSide(x, y);

                if (side != null) {
                    currentCell.push({ row: i, col: j })  // now save the position for selection
                }

                // fix a problem: when the side is selected, it cannot be highlighted again
                // determine the neighbour
                let row = i;
                let col = j;
                let highlight;
                let neighbour = true;
                if (side == fence.left && j > 0) {
                    col = j - 1;
                    highlight = fence.right;
                } else if (side == fence.right && j < cols - 1) {
                    col = j + 1;
                    highlight = fence.left;
                } else if (side == fence.top && i > 0) {
                    row = i - 1;
                    highlight = fence.bottom;
                } else if (side == fence.bottom && i < rows - 1) {
                    row = i + 1;
                    highlight = fence.top;
                } else {
                    // no neighbour
                    neighbour = false;
                }

                // highlight the neighbour
                if (neighbour) {
                    squares[row][col].highlight = highlight;
                    currentCell.push({ row: row, col: col });
                }

                break;
            }
        }
        // check highlighted or not
        if (highlighted != null) {
            break;
        }
    }
}

function selectSide() {

    // nothing selected then do nothing
    if (currentCell == null || currentCell.length == 0) {
        return;
    }

    // select side
    let filledSquare = false; // for claim the land
    for (let cell of currentCell) {
        if (squares[cell.row][cell.col].selectSide()) {
            filledSquare = true;
        };
    }

    let move = [];
    for (let cell of currentCell) {
        let side;
        if (squares[cell.row][cell.col].highlight === fence.bottom) {
            side = 'bottom';
        } else if (squares[cell.row][cell.col].highlight === fence.top) {
            side = 'top';
        } else if (squares[cell.row][cell.col].highlight === fence.left) {
            side = 'left';
        } else if (squares[cell.row][cell.col].highlight === fence.right) {
            side = 'right';
        }
        move.push({
            row: cell.row,
            col: cell.col,
            side: side
        });
    }

    fetch('/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerId, move })
    })
        .then(response => {
            if (response.ok) {
                getGameState();
                currentCell = []; // initialize for reselecting
            }
        });


    // currentCell = []; // initialize for reselecting

    // finish the game and check winner
    if (filledSquare) {
        // finish the game when all squares are filled
        if (allFilled() || gameState.scoreP1 === gameState.gridRows * gameState.gridColumns || gameState.scoreP2 === gameState.gridRows * gameState.gridColumns) {
            timeEnd = Math.ceil(delayEnd);
        }
    }

}

function joinGame() {
    // console.log("join game pressed");
    if (playerId === 1) {
        fetch('/joinPlayer1', {
            method: 'POST',
            headers: { "Authorization": "Basic " + user_key }
        })
            .then(response => {
                if (response.ok) {
                    nameP1 = gameState.nameP1;
                    getGameState();
                    console.log(nameP1);
                }
            });
    } else if (playerId === 2) {
        fetch('/joinPlayer2', {
            method: 'POST',
            headers: { "Authorization": "Basic " + user_key }
        })
            .then(response => {
                if (response.ok) {
                    nameP2 = gameState.nameP2;
                    getGameState();
                    console.log(nameP2);
                }
            });
    }
    
    document.getElementById("joinGame").style.display = "none";
    document.getElementById("startGame").style.display = "inline";
    
}

function startGame() {
    fetch('/startGame', { method: 'POST' })
        .then(response => {
            if (response.ok) {
                getGameState();
                enableGameControl();
            }
        });
    
    document.getElementById("startGame").style.display = "none";
    document.getElementById("exitGame").style.display = "inline";
    document.getElementById("restart").style.display = "inline";
}

function exitGame() {
    fetch('/exitGame', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerId }) // who exits the game
    })
        .then(response => {
            if (response.ok) {
                getGameState();
            }
        });

    
    document.getElementById("exitGame").style.display = "none";
    document.getElementById("restart").style.display = "none";  
    document.getElementById("joinGame").style.display = "inline";
}

// start a new game after gameover
function restart() {
    // console.log("restart");
    fetch('/newGame', { method: 'POST' });
    enableGameControl();

}

// reset game
function resetGame() {
    prevSumScoreP1 = sumScoreP1;
    prevSumScoreP2 = sumScoreP2;

    fetch('/resetGame', { method: 'POST' })
        .then(response => {
            if (response.ok) {
                getGameState();
                disableGameControl();
            }
        });

    sumScoreP1 = prevSumScoreP1;
    sumScoreP2 = prevSumScoreP2;
}

// enable game control
function enableGameControl() {
    canvas.addEventListener("mousemove", highlightGrid);
    canvas.addEventListener("click", click);
}

// disable game control
function disableGameControl() {
    canvas.removeEventListener("mousemove", highlightGrid);
    canvas.removeEventListener("click", click);
    // clear the highlight
    for (let row of squares) {
        for (let square of row) {
            square.highlight = null;
        }
    }
}

// column
function getGridX(col) {
    return cell * (col + 1);
}

// row
function getGridY(row) {
    return margin + cell * row;
}
