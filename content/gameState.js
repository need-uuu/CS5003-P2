let gameState = null;

// get the game state from the server and update the local game

function getGameState() {
    fetch('/gameState')
        .then(response => response.json())
        .then(state => {
            gameState = state;
            if (gameState.nameP1) {
                nameP1 = gameState.nameP1;
            }
            if (gameState.nameP2) {
                nameP2 = gameState.nameP2;
            }
        });
}

// always update all game states
function update() {
    if (!gameState) {
        return;
    }

    getGameState();

    saveScore();

    drawBoard();

    if (gameState.currentTime !== null && gameState.timeEnd === 0) {
        // timeOut = Math.ceil((gameState.timeOut - (Date.now() - gameState.currentTime)) / 1000);
        timeOut = Math.max(0, Math.ceil((gameState.timeOut - (Date.now() - gameState.currentTime)) / 1000));  // not show negative number
    } else {
        timeOut = "60";
    }

    // if grid size is changed, update related variables
    if (gridRows !== gameState.gridRows || gridColumns !== gameState.gridColumns) {
        gridRows = gameState.gridRows;
        gridColumns = gameState.gridColumns;
        cell = width / (gridColumns + 2);
        margin = height - (gridRows + 1) * cell;
        stroke = cell / 12;
        dot = stroke;
        nameSize = cell / 3;
        topSize = margin / 6;
        context.lineWidth = stroke;
        initSquares();
    }

    // update the board from the server
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridColumns; j++) {
            let square = gameState.squares[i][j];
            squares[i][j].owner = square.owner;
            squares[i][j].numSelected = square.numSelected;
            squares[i][j].sideBottom.owner = square.sideBottom.owner;
            squares[i][j].sideBottom.selected = square.sideBottom.selected;
            squares[i][j].sideTop.owner = square.sideTop.owner;
            squares[i][j].sideTop.selected = square.sideTop.selected;
            squares[i][j].sideLeft.owner = square.sideLeft.owner;
            squares[i][j].sideLeft.selected = square.sideLeft.selected;
            squares[i][j].sideRight.owner = square.sideRight.owner;
            squares[i][j].sideRight.selected = square.sideRight.selected;
            squares[i][j].landType = gameState.squares[i][j].landType;
            // squares[i][j].drawSides(); // save the sides drawed
        }
    }
    drawSquare();
    drawGrid();

    // update score
    scoreP1 = gameState.scoreP1;
    scoreP2 = gameState.scoreP2;
    displayScore();

    // update timeend from the server
    timeEnd = gameState.timeEnd;

    // game is over
    if (allFilled() || gameState.scoreP1 === gameState.gridRows * gameState.gridColumns || gameState.scoreP2 === gameState.gridRows * gameState.gridColumns) {
        timeEnd = Math.ceil(delayEnd);
        fetch('/gameOver', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ delayEnd }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.runRecord) {
                    winRecords();
                }
            });

        disableGameControl();
    }

    // update the current player
    turn = gameState.currentPlayer === playerId;

    // enable or disable the game control
    if (gameState.currentTime !== null && !gameState.timeEnd && gameState.currentPlayer === playerId) {        // activate control
        enableGameControl();
    } else {
        // deactivate control
        disableGameControl();
    }

    displayInfo();
}

// update game automatically
setInterval(update, 100);
setInterval(getGameState, 100);

// check if all squares are filled which means that the game is over
function allFilled() {
    for (let row of gameState.squares) {
        for (let square of row) {
            if (square.owner === null) {
                return false;
            }
        }
    }
    return true;
}