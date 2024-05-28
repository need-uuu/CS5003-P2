const express = require('express');
const session = require('express-session');
const expressBasicAuth = require('express-basic-auth');
const app = express();

const API_PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('content'));

app.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
  }));

// game state
let gameState = {
    gridRows: 0,
    gridColumns: 0,
    squares: [],
    scoreP1: 0,
    scoreP2: 0,
    currentPlayer: 1,
    nameP1: "Player 1",
    nameP2: "Player 2",
    landType: {
        regular: 1,
        copper: 2,
    },
    currentTime: null,
    timeOut: 60000, // time out after 60 seconds
    gameover: false,
    
};

let players = [];
let timeoutInterval = null;

// initialize the game state
function initGameState(gridRows, gridColumns) {
    gameState.squares = [];
    gameState.gridRows = gridRows;
    gameState.gridColumns = gridColumns;
    gameState.scoreP1 = 0;
    gameState.scoreP2 = 0;
    gameState.currentPlayer = 1;
    gameState.currentTime = null;
    
    for (let i = 0; i < gridRows; i++) {
        gameState.squares[i] = [];
        for (let j = 0; j < gridColumns; j++) {

            let landType = Math.random() < 0.8 ? 'regular' : 'copper';

            gameState.squares[i][j] = {
                owner: null,
                numSelected: 0,
                sideBottom: { owner: null, selected: false },
                sideTop: { owner: null, selected: false },
                sideLeft: { owner: null, selected: false },
                sideRight: { owner: null, selected: false },
                landType: landType,
            };
        }
    }
}

function resetGameState() {
    initGameState(gameState.gridRows, gameState.gridColumns);
    gameState.timeEnd = 0;
    gameState.currentTime = null;
}

function checkTimeout() {
    // only when the game is not over
    if (gameState.currentTime !== null && gameState.timeEnd === 0) {

        const timeGap = Date.now() - gameState.currentTime;

        // only when the game is running
        if (players.length === 2 && gameState.currentTime !== null) {
            if (timeGap > gameState.timeOut) {
                const winner = gameState.currentPlayer === 1 ? 2 : 1;
                gameState.scoreP1 = winner === 1 ? gameState.gridRows * gameState.gridColumns : 0;
                gameState.scoreP2 = winner === 2 ? gameState.gridRows * gameState.gridColumns : 0;
                gameState.timeEnd = Math.ceil(gameState.delayEnd);
            }
        };
    }
}

// setInterval(checkTimeout, 100); // keep checking time out every 100ms

// get game state
app.get('/gameState', (req, res) => {
    res.json(gameState);
});

app.post('/initGame', (req, res) => {
    const { gridRows, gridColumns } = req.body;

    gameState.gridRows = gridRows;
    gameState.gridColumns = gridColumns;

    initGameState(gridRows, gridColumns);
    res.sendStatus(200);
});

app.post('/updateGrid', (req, res) => {
    const { gridRows, gridColumns } = req.body;
    gameState.gridRows = gridRows;
    gameState.gridColumns = gridColumns;
    resetGameState();
    res.json(gameState);
});

app.post('/newGame', (req, res) => {
    resetGameState();
    gameState.currentTime = Date.now();
    // clearInterval(timeoutInterval);
    timeoutInterval = setInterval(checkTimeout, 30);
    res.sendStatus(200);
});

app.post('/startGame', (req, res) => {
    if (players.length === 2) {
        gameState.currentTime = Date.now();
        timeoutInterval = setInterval(checkTimeout, 30);
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

// give player id
app.post('/getId', (req, res) => {
    const playerId = players.length + 1; // first player ID will be 0 + 1 = 1
    players.push(playerId);
    res.json({ playerId });


});

// player moves
app.post('/move', (req, res) => {
    const { playerId, move } = req.body;

    // check if the player is the current player
    if (playerId === gameState.currentPlayer) {

        // every turn set up the current time for check timeout
        gameState.currentTime = Date.now();

        let filledSquare = false; // to check filled square or not

        for (let cell of move) {
            // current square
            let square = gameState.squares[cell.row][cell.col];
            // selected side
            let side = square[`side${cell.side.charAt(0).toUpperCase()}${cell.side.slice(1)}`];  // sideTop, sideBottom, sideLeft, sideRight 

            // avoid duplicate selection
            if (side.selected) {
                res.sendStatus(666);
                return;
            }

            // increase number of selected sides
            square.numSelected++;
            
            // update selected side on the board
            switch (cell.side) {
                case 'bottom':
                    square.sideBottom.owner = playerId;
                    square.sideBottom.selected = true;
                    break;
                case 'top':
                    square.sideTop.owner = playerId;
                    square.sideTop.selected = true;
                    break;
                case 'left':
                    square.sideLeft.owner = playerId;
                    square.sideLeft.selected = true;
                    break;
                case 'right':
                    square.sideRight.owner = playerId;
                    square.sideRight.selected = true;
                    break;
            }

            // score
            if (square.numSelected === 4) {
                square.owner = playerId;
                if (playerId === 1) {
                    // gameState.scoreP1++;
                    gameState.scoreP1 += gameState.landType[square.landType];
                } else {
                    // gameState.scoreP2++;
                    gameState.scoreP2 += gameState.landType[square.landType];
                }
                filledSquare = true;
            }
        }

        // when the square is not filled, switch to the next player
        if (!filledSquare) {
            gameState.currentPlayer = playerId === 1 ? 2 : 1;
        }

        res.json(gameState);
    } else {
        res.sendStatus(666);
    }
});

app.post('/exitGame', (req, res) => {
    const { playerId } = req.body;

    if (playerId === 1) {
        gameState.scoreP2 = gameState.gridRows * gameState.gridColumns;
    } else if (playerId === 2) {
        gameState.scoreP1 = gameState.gridRows * gameState.gridColumns;
    }

    if (players.length < 2) {
        clearInterval(timeoutInterval);
        timeoutInterval = null;
    }

    // timeEnd = Math.ceil(delayEnd);
    res.sendStatus(200);
});

// game over
app.post('/gameOver', (req, res) => {
    const { delayEnd } = req.body;
    gameState.timeEnd = Math.ceil(delayEnd);
    gameState.gameOver = true;
    clearInterval(timeoutInterval);

    const timer = setInterval(() => {
        gameState.timeEnd--;
        if (gameState.timeEnd <= 0) {
            resetGameState();
            clearInterval(timer);
        }
    }, 80);

    // run winRecords in the client
    res.json({ runRecord: true });
});

// reset game
app.post('/resetGame', (req, res) => {
    initGameState();
    players = [];
    clearInterval(timeoutInterval);
    timeoutInterval = null;
    res.sendStatus(200);
});

app.listen(API_PORT, () => {
    console.log(`Listening on localhost:${API_PORT}`)
}); 


//login

const users = {
    '1': '1',
    '2': '2'
}

const authorise = expressBasicAuth({
    users: users,
    unauthorizedResponse: (req) => ((req.auth) ? 'Credentials  rejected' : 'No credentials provided'),
    challenge: true	//make the browser ask for credentials if none/wrong are provided
})

// after login before join game
app.use('/player1', authorise, function (req, res, next) {
    const username = req.auth.user;
    // gameState.nameP1 = username;
    res.status(200).json({ msg: 'You are player 1: ' + username });
});

app.use('/player2', authorise, function (req, res, next) {
    const username = req.auth.user;
    // gameState.nameP2 = username;
    res.status(200).json({ msg: 'You are player 2: ' + username });
});

// after join game before start game
app.post('/joinPlayer1', authorise, function (req, res, next) {
    const username = req.auth.user;
    gameState.nameP1 = username;
    res.sendStatus(200);
});

app.post('/joinPlayer2', authorise, function (req, res, next) {
    const username = req.auth.user;
    gameState.nameP2 = username;
    res.sendStatus(200);
});



app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username in users && users[username] === password) {
      req.session.user = { username }; 
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Authentication failed');
    }
  });

app.post('/logout', (req, res) => {
 
    req.session.destroy((err) => {
        if(err) {
            return res.status(500).send('Logout failed.');
        }
        res.sendStatus(200);
        console.log("logout");
    });
});

//register 

//get all the users
app.get('/users', function (req, res, next) {
    res.status(200).json(users);
});


//add a new module
app.post('/addUser', function (req, res) {
    const userId = req.body.userId; // User ID
    const password = req.body.password; // User password

    // Check if the same ID already exists in the `users` object
    if (users[userId]) {
        return res.status(666).send('The user already exists.');
    }

    // Add the new user to the `users` object
    users[userId] = password;

    // Send success response
    res.status(200).send(`${userId} user has been added.`);
    console.log(users);
});