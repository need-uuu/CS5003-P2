function displayInfo() {
    const gameInfoDiv = document.getElementById('gameInfo');

    let info = '';
    info += `<div>Current Turn: ${gameState.currentPlayer === 1 ? nameP1 : nameP2}</div>`;
    info += `<div>Remaining Time: ${timeOut} s</div>`;
    info += `<div>Grid Size: ${gridRows} x ${gridColumns}</div><br>`;

    info += `<div>Player 1: ${nameP1}</div>`;
    info += `<div>Player 1 Score: ${scoreP1}</div>`;
    info += `<div>
                <label>Player 1 Color: </label>
                <input type="color" value="${colorPlayer1}" />
            </div><br>`;

    info += `<div>Player 2: ${nameP2}</div>`;
    info += `<div>Player 2 Score: ${scoreP2}</div>`;
    info += `<div>
                <label>Player 2 Color: </label>
                <input type="color" value="${colorPlayer2}" />
            </div><br>`;


    info += `<div>
                <label>Bonus Color: </label>
                <input type="color" value="${cooperSide}" />
            </div>`;


    info += `<div>Player1 Total Score: ${prevSumScoreP1}</div>`
    info += `<div>Player2 Total Score: ${prevSumScoreP2}</div>`

    gameInfoDiv.innerHTML = info;
}

//  Record tracking

var currentScore1win = 0;
var currentScore1lose = 0;
var currentScore1draw = 0;
var currentScore2win = 0;
var currentScore2lose = 0;
var currentScore2draw = 0;
let scoreUpdated = false;
let scoreCheckInterval = null;

function winRecords() {
    if (!scoreUpdated) {
        const prevScores = {
            currentScore1win,
            currentScore1lose,
            currentScore1draw,
            currentScore2win,
            currentScore2lose,
            currentScore2draw
        };

        if (scoreP1 > scoreP2) {
            currentScore1win++;
            currentScore2lose++;
        } else if (scoreP2 > scoreP1) {
            currentScore2win++;
            currentScore1lose++;
        } else {
            currentScore1draw++;
            currentScore2draw++;
        }

        displayRecords();
        scoreUpdated = true;

        // the time should be bigger than the server one
        scoreCheckInterval = setInterval(() => {
            const scoreChanged =
                prevScores.currentScore1win !== currentScore1win ||
                prevScores.currentScore1lose !== currentScore1lose ||
                prevScores.currentScore1draw !== currentScore1draw ||
                prevScores.currentScore2win !== currentScore2win ||
                prevScores.currentScore2lose !== currentScore2lose ||
                prevScores.currentScore2draw !== currentScore2draw;

            if (scoreChanged) {
                if (scoreP1 > scoreP2) {
                    currentScore1win = prevScores.currentScore1win + (currentScore1win !== prevScores.currentScore1win ? 1 : 0);
                    currentScore2lose = prevScores.currentScore2lose + (currentScore2lose !== prevScores.currentScore2lose ? 1 : 0);
                } else if (scoreP2 > scoreP1) {
                    currentScore2win = prevScores.currentScore2win + (currentScore2win !== prevScores.currentScore2win ? 1 : 0);
                    currentScore1lose = prevScores.currentScore1lose + (currentScore1lose !== prevScores.currentScore1lose ? 1 : 0);
                } else {
                    currentScore1draw = prevScores.currentScore1draw + (currentScore1draw !== prevScores.currentScore1draw ? 1 : 0);
                    currentScore2draw = prevScores.currentScore2draw + (currentScore2draw !== prevScores.currentScore2draw ? 1 : 0);
                }
                displayRecords();
                clearInterval(scoreCheckInterval);
                scoreUpdated = false;
            }
        }, 3000);
    }
}

window.addEventListener('message', (event) => {
    if (event.data.runRecord) {
        winRecords();
    }
});

function displayRecords() {
    var player1win = document.getElementById("player1-win");
    var player1lose = document.getElementById("player1-lose");
    var player1draw = document.getElementById("player1-draw");
    var player2win = document.getElementById("player2-win");
    var player2lose = document.getElementById("player2-lose");
    var player2draw = document.getElementById("player2-draw");

    player1win.innerHTML = currentScore1win;
    player1lose.innerHTML = currentScore1lose;
    player1draw.innerHTML = currentScore1draw;
    player2win.innerHTML = currentScore2win;
    player2lose.innerHTML = currentScore2lose;
    player2draw.innerHTML = currentScore2draw;
}

let scoreP1Store = [];
let scoreP2Store = [];
let sumScoreP1 = 0;
let sumScoreP2 = 0;
let isScoreStored = false;
let prevSumScoreP1 = 0;
let prevSumScoreP2 = 0;

function saveScore() {
    if (scoreP1 + scoreP2 === gridRows * gridColumns && !isScoreStored) {
        prevSumScoreP1 += scoreP1;
        prevSumScoreP2 += scoreP2;

        scoreP1Store.push(scoreP1);
        scoreP2Store.push(scoreP2);

        // console.log("Game End:", prevSumScoreP1, prevSumScoreP2);
        isScoreStored = true;

        const scoreCheckInterval = setInterval(() => {
            // console.log("During Reset:", prevSumScoreP1, prevSumScoreP2);
            clearInterval(scoreCheckInterval);
            isScoreStored = false;
        }, 3000);
    }
}

