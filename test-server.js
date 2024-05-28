const express = require('express');
const session = require('express-session');
const expressBasicAuth = require('express-basic-auth');
const app = express();

const API_PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: '1234',
    resave: false,
    saveUninitialized: true
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
};

let players = [];

// initialize the game state
function initGameState(gridRows, gridColumns) {
    gameState.squares = [];
    gameState.gridRows = gridRows;
    gameState.gridColumns = gridColumns;
    gameState.scoreP1 = 0;
    gameState.scoreP2 = 0;
    gameState.currentPlayer = 1;
    
    for (let i = 0; i < gridRows; i++) {
        gameState.squares[i] = [];
        for (let j = 0; j < gridColumns; j++) {
            gameState.squares[i][j] = {
                owner: null,
                numSelected: 0,
                sideBottom: { owner: null, selected: false },
                sideTop: { owner: null, selected: false },
                sideLeft: { owner: null, selected: false },
                sideRight: { owner: null, selected: false }
            };
        }
    }
}

function resetGameState() {
    initGameState(gameState.gridRows, gameState.gridColumns);
    gameState.timeEnd = 0;
}

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
    res.sendStatus(200);
});

app.post('/newGame', (req, res) => {
    resetGameState();
    gameState.nameP1 = null;
    gameState.nameP2 = null;
    req.session.player1 = null;
    req.session.player2 = null;
    res.sendStatus(200);
});

// give player id
// only allow 2 players so far
app.post('/getId', (req, res) => {
    if (players.length < 2) {
        const playerId = players.length + 1; // first player ID will be 0 + 1 = 1
        players.push(playerId);
        res.json({ playerId });
    } else {
        res.sendStatus(666);
    }
});

// player moves
app.post('/move', (req, res) => {
    const { playerId, move } = req.body;

    // check if the player is the current player
    if (playerId === gameState.currentPlayer) {

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
                    gameState.scoreP1++;
                } else {
                    gameState.scoreP2++;
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

// game over
app.post('/gameOver', (req, res) => {
    const { delayEnd } = req.body;
    gameState.timeEnd = Math.ceil(delayEnd);

    // start a timer to reset the game when timeEnd reaches 0
    const timer = setInterval(() => {
        gameState.timeEnd--;
        if (gameState.timeEnd <= 0) {
            resetGameState();
            clearInterval(timer);
        }
    }, 60);

    res.sendStatus(200);
});

// reset game
app.post('/resetGame', (req, res) => {
    initGameState();
    players = [];
    res.sendStatus(200);
});

// User registration
const users = {
    'harry': '1',
    'ruby': '1',
    'hj': '1234',
    'xj': '1234',
    '1': '1',
    '2': '2',
};

app.post('/register', function (req, res) {
    const userId = req.body.userId;
    const password = req.body.password;

    if (users[userId]) {
        return res.status(400).send('The user already exists.');
    }

    users[userId] = password;

    res.status(200).send(`${userId} user has been added.`);
    console.log(users);
});

// User login
const authorise = expressBasicAuth({
    users: users,
    unauthorizedResponse: (req) => ((req.auth) ? 'Credentials rejected' : 'No credentials provided'),
    challenge: true
});

app.use('/login', authorise, function (req, res, next) {
    if (req.session.user) {
        res.status(403).json({ msg: 'User already logged in' });
    } else {
        req.session.user = req.auth.user;
        if (!req.session.player1) {
            req.session.player1 = req.auth.user;
            gameState.nameP1 = req.auth.user;
            res.status(200).json({ msg: 'player 1: ' + req.auth.user });
        } else if (!req.session.player2) {
            req.session.player2 = req.auth.user;
            gameState.nameP2 = req.auth.user;
            res.status(200).json({ msg: 'player 2: ' + req.auth.user });
        } else {
            res.status(403).json({ msg: 'Game is full' });
        }
    }
});

// User logout
app.post('/logout', function (req, res) {
    if (req.session.user) {
        if (req.session.player1 === req.session.user) {
            req.session.player1 = null;
            gameState.nameP1 = null;
        } else if (req.session.player2 === req.session.user) {
            req.session.player2 = null;
            gameState.nameP2 = null;
        }
        req.session.destroy(function (err) {
            res.sendStatus(200);
        });
    } else {
        res.sendStatus(200);
    }
});

// Room creation
let rooms = {};

app.post('/createRoom', function (req, res) {
    if (!req.session.user) {
        return res.status(403).json({ msg: 'User not logged in' });
    }

    const roomId = generateRoomId();
    rooms[roomId] = {
        id: roomId,
        owner: req.session.user,
        players: [req.session.user],
        gameState: JSON.parse(JSON.stringify(gameState))
    };

    res.status(200).json({ roomId: roomId });
});

// Room joining
app.post('/joinRoom', function (req, res) {
    if (!req.session.user) {
        return res.status(403).json({ msg: 'User not logged in' });
    }

    const roomId = req.body.roomId;
    const room = rooms[roomId];

    if (!room) {
        return res.status(404).json({ msg: 'Room not found' });
    }

    if (room.players.length >= 2) {
        return res.status(403).json({ msg: 'Room is full' });
    }

    room.players.push(req.session.user);
    if (room.players.length === 1) {
        room.gameState.nameP1 = req.session.user;
    } else {
        room.gameState.nameP2 = req.session.user;
    }

    res.status(200).json({ msg: 'Joined room successfully' });
});

// Get available rooms
app.get('/rooms', function (req, res) {
    const availableRooms = Object.values(rooms).filter(room => room.players.length < 2);
    res.status(200).json(availableRooms);
});

// Helper function to generate unique room ID
function generateRoomId() {
    return Math.random().toString(36).substr(2, 9);
}

app.listen(API_PORT, () => {
    console.log(`Listening on localhost:${API_PORT}`);
});