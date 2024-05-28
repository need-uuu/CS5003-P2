function drawBoard() {
    context.fillStyle = colorBoard;
    context.strokeStyle = colorBoarder;

    context.fillRect(0, 0, width, height);
    context.strokeRect(stroke / 2, stroke / 2, width - stroke, height - stroke);
}

function drawDot(x, y) {
    context.fillStyle = colorDot;
    context.beginPath(); // to draw a circle
    context.arc(x, y, dot, 0, 2 * Math.PI);
    context.fill();
}

function drawGrid() {
    // rows
    for (let i = 0; i < gridRows + 1; i++) {
        // columns
        for (let j = 0; j < gridColumns + 1; j++) {
            drawDot(getGridX(j), getGridY(i));
        }
    }
}

function drawSquare() {
    for (let row of squares) {
        for (let square of row) {
            // cooper land first so that it can be covered by highlight
            square.drawLand();
            square.drawSides();
            square.drawFill();
        }
    }
}

function drawLine(x0, y0, x1, y1, color) {
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.stroke(); // draw the line
}

function displayText(text, x, y, color, size) {
    context.fillStyle = color;
    context.font =  "40px minecraft";
    context.fillText(text, x, y);
}

function displayScore() {

    let colorP1 = gameState.currentPlayer === 1 ? colorPlayer1 : colorPlayer1H;
    let colorP2 = gameState.currentPlayer === 2 ? colorPlayer2 : colorPlayer2H;

    // display the player name
    displayText(nameP1, width * 0.25, margin * 0.25, colorP1, topSize);
    displayText(nameP2, width * 0.75, margin * 0.25, colorP2, topSize);

    // display the score
    displayText(scoreP1, width * 0.25, margin * 0.55, colorP1, topSize);
    displayText(scoreP2, width * 0.75, margin * 0.55, colorP2, topSize);

    // when game is over according to the server game state
    if (gameState.timeEnd > 0) {
        gameState.timeEnd--;

        // Check if the game should be finished based on completed rounds or filled squares
        if (allFilled() || gameState.scoreP1 === gameState.gridRows * gameState.gridColumns || gameState.scoreP2 === gameState.gridRows * gameState.gridColumns) {
            if (scoreP1 == scoreP2) {
                displayText(draw, width * 0.5, margin * 0.55, colorDraw, topSize);
            } else {
                let p1Wins = scoreP1 > scoreP2;
                let color = p1Wins ? colorP1 : colorP2;
                let text = p1Wins ? nameP1 : nameP2;
                displayText(text, width * 0.5, margin * 0.55, color, topSize);
                displayText(win, width * 0.5, margin * 0.75, color, topSize);
            }

            // new game after seconds (timeEnd)
            if (gameState.timeEnd == 0) {
                newGame();
            }
        }
    }
}

function getColor(playerId, light) {
    if (playerId === 1) {
        // for player 1
        return light ? colorPlayer1H : colorPlayer1;
    } else {
        // for player 2
        return light ? colorPlayer2H : colorPlayer2;
    }
}

function getText(playerId, small) {
    if (playerId === 1) {
        // for player 1
        return small ? nameP1S : nameP1;
    } else {
        // for player 2
        return small ? nameP2S : nameP2;
    }
}
