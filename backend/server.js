const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const questions = require('./questions.json');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const cookieParser = require('cookie-parser');
const { OAuth2Client } = require('google-auth-library');
const imposterLocations = require('./imposter_locations.json');
const charadesCategories = require('./charades_words.json');
const jeopardyQuestions = require('./jeopardy_questions.json');
const seenjeemQuestions = require('./seenjeem_questions.json');
const { isAuthenticated, socketAuthenticator, sanitizeInput } = require('./securityMiddleware');
const rateLimit = require('express-rate-limit');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Initialize Google OAuth2 Client
const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID || '1078121644331-q9epun5kqmhgu629tla4ntroubds9p1d.apps.googleusercontent.com');

// Express Rate Limiting for Auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per 15 minutes
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/auth/', authLimiter);

app.get('/', (req, res) => {
    res.send('Games Hub Backend is running!');
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity in development
        methods: ["GET", "POST"]
    }
});

io.use(socketAuthenticator);

// Game state per room
const rooms = {};

const QUESTION_TIMER = 15; // 15 seconds per question

function initRoom(roomId, gameType = 'trivia') {
    if (!rooms[roomId]) {
        // Base room state
        const room = {
            gameType: gameType,
            players: {}, // socketId -> ...
            status: 'waiting', // waiting, playing, finished
            timer: 0,
            intervalId: null,
            hostId: null // to track who created it
        };

        if (gameType === 'trivia') {
            room.currentQuestionIndex = -1;
        } else if (gameType === 'imposter') {
            room.location = null;
            room.imposterSocketId = null;
            room.imposterName = null;
        } else if (gameType === 'charades') {
            room.actorSocketId = null;
            room.currentWord = null;
            room.scores = {};
            room.rounds = 0;
            room.maxRounds = 3;
        } else if (gameType === 'jeopardy') {
            room.boardState = jeopardyQuestions.map(cat => ({
                category: cat.category,
                questions: cat.questions.map(q => ({
                    points: q.points,
                    answered: false
                }))
            }));
            room.activeQuestion = null; // { categoryIndex, questionIndex }
            room.buzzedPlayerId = null;
            room.players = {}; // Ensure players maintain scores across questions
        } else if (gameType === 'cahoot') {
            room.currentQuestionIndex = -1;
            room.optionsMap = []; // To optionally shuffle options
            room.players = {};
            room.questions = null; // Custom questions array
        } else if (gameType === 'tictactoe') {
            room.board = Array(9).fill(null);
            room.xIsNext = true;
        } else if (gameType === 'seenjeem') {
            room.currentQuestionIndex = -1;
            room.players = {};
        }

        rooms[roomId] = room;
    }
}

// rate limiting map per socket
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 1000;
const MAX_EVENTS_PER_WINDOW = 5;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id, 'User:', socket.user?.username);

    // Global Socket Rate Limiter & Room Scoping Middleware
    socket.use(([event, ...args], next) => {
        // Rate Limiting
        const limits = rateLimits.get(socket.id) || { count: 0, startTime: Date.now() };
        const now = Date.now();
        if (now - limits.startTime > RATE_LIMIT_WINDOW) {
            limits.count = 1;
            limits.startTime = now;
        } else {
            limits.count++;
        }
        rateLimits.set(socket.id, limits);

        if (limits.count > MAX_EVENTS_PER_WINDOW) {
            return next(new Error('Rate limit exceeded: Please slow down.'));
        }

        // Room Scoping Authorization (prevent emitting room events if not in room)
        const roomEvents = ['start_game', 'submit_answer', 'imposter_vote', 'charades_got_it', 'jeopardy_select_question', 'jeopardy_buzz', 'jeopardy_answer', 'tictactoe_move', 'cahoot_start', 'cahoot_submit_answer', 'cahoot_next_question', 'seenjeem_submit_answer'];
        if (roomEvents.includes(event)) {
            let roomIdArg;
            if (typeof args[0] === 'object' && args[0] !== null) {
                roomIdArg = args[0].roomId;
            } else if (typeof args[0] === 'string') {
                roomIdArg = args[0];
            }
            if (roomIdArg && !socket.rooms.has(roomIdArg)) {
                return next(new Error('Room scoping error: You are not in this room.'));
            }
        }
        next();
    });

    socket.on('error', (err) => {
        if (err && err.message) {
            socket.emit('game_error', err.message);
        }
    });

    // 1) Join/Create Room
    socket.on('join_room', async ({ roomId, playerName, gameType, userId }) => {
        playerName = sanitizeInput(playerName || socket.user?.displayName || 'Unknown');
        // If it's a new room and a premium game, verify the host owns it
        if (!rooms[roomId] && ['imposter', 'charades', 'jeopardy', 'cahoot', 'seenjeem'].includes(gameType)) {
            if (!userId) {
                socket.emit('game_error', 'يجب تسجيل الدخول لإنشاء غرفة مميزة.');
                return;
            }
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { ownerships: true }
            });
            const ownsGame = user?.ownerships.some(o => o.gameId === gameType && new Date(o.expiresAt) > new Date());
            if (!ownsGame) {
                socket.emit('game_error', 'يجب عليك شراء هذه اللعبة لإنشاء غرفة.');
                return;
            }
        }

        socket.join(roomId);
        initRoom(roomId, gameType || 'trivia');

        // Track room in Database for IDOR / expiration
        try {
            await prisma.room.upsert({
                where: { id: roomId },
                update: { lastActive: new Date() },
                create: { id: roomId, gameType: gameType || 'trivia', hostId: socket.user?.userId || userId }
            });
        } catch (e) {
            console.error('Error tracking room in DB', e);
        }

        // Set host if first player
        if (Object.keys(rooms[roomId].players).length === 0) {
            rooms[roomId].hostId = socket.id;
        }

        // Add player
        rooms[roomId].players[socket.id] = {
            name: playerName,
            score: 0,
            answerSubmitted: false
        };

        // Notify room of new player list
        io.to(roomId).emit('update_players', Object.values(rooms[roomId].players));
        io.to(roomId).emit('game_status', rooms[roomId].status);
        io.to(roomId).emit('room_host', rooms[roomId].hostId);
    });

    // 2) Start Game
    socket.on('start_game', (roomId) => {
        const room = rooms[roomId];
        if (room && room.status === 'waiting') {
            room.status = 'playing';

            if (room.gameType === 'trivia') {
                room.currentQuestionIndex = 0;
                io.to(roomId).emit('game_status', room.status);
                sendQuestion(roomId);
            } else if (room.gameType === 'imposter') {
                startImposter(roomId);
            } else if (room.gameType === 'charades') {
                startCharadesTurn(roomId);
            } else if (room.gameType === 'jeopardy') {
                room.status = 'board';
                io.to(roomId).emit('game_status', room.status);
                io.to(roomId).emit('jeopardy_board', room.boardState);
            } else if (room.gameType === 'cahoot') {
                // Cahoot just stays waiting until host triggers first question
                room.status = 'playing';
                room.currentQuestionIndex = 0;
                io.to(roomId).emit('game_status', room.status);
            } else if (room.gameType === 'tictactoe') {
                room.status = 'playing';
                const playerIds = Object.keys(room.players);
                io.to(roomId).emit('game_status', room.status);
                io.to(roomId).emit('tictactoe_state', {
                    board: room.board,
                    xIsNext: room.xIsNext,
                    playerX: playerIds[0] ? room.players[playerIds[0]].name : 'Player 1',
                    playerO: playerIds[1] ? room.players[playerIds[1]].name : 'Player 2',
                    winner: null
                });
            } else if (room.gameType === 'seenjeem') {
                room.status = 'playing';
                room.currentQuestionIndex = 0;
                io.to(roomId).emit('game_status', room.status);
                startSeenJeemQuestion(roomId);
            }
        }
    });

    // 3) Submit Answer
    socket.on('submit_answer', ({ roomId, answerIndex }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'playing') return;

        const player = room.players[socket.id];
        if (player && !player.answerSubmitted) {
            player.answerSubmitted = true;

            const currentQ = questions[room.currentQuestionIndex];
            // Check if correct
            if (answerIndex === currentQ.answer) {
                // Points based on time left (e.g., 10 points * timer) or just flat 10
                player.score += 10;
            }

            // Update everyone on scores
            io.to(roomId).emit('update_players', Object.values(room.players));

            // Check if all players answered
            const allAnswered = Object.values(room.players).every(p => p.answerSubmitted);
            if (allAnswered) {
                // Force next question early
                nextQuestion(roomId);
            }
        }
    });

    // --- IMPOSTER SPECIFIC SOCKETS ---
    socket.on('imposter_vote', ({ roomId, targetSocketId }) => {
        // Placeholder for voting logic later
        io.to(roomId).emit('vote_registered', { voter: socket.id, target: targetSocketId });
    });

    // --- CHARADES SPECIFIC SOCKETS ---
    socket.on('charades_got_it', (roomId) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'playing') return;
        if (socket.id === room.actorSocketId) {
            // Actor got it!
            const actorPlayer = room.players[socket.id];
            if (actorPlayer) {
                actorPlayer.score += 10;
                io.to(roomId).emit('update_players', Object.values(room.players));
            }
            startCharadesTurn(roomId); // Next round
        }
    });

    // --- JEOPARDY SPECIFIC SOCKETS ---
    socket.on('jeopardy_select_question', ({ roomId, categoryIndex, questionIndex }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'board') return;

        // Verify question hasn't been answered
        if (room.boardState[categoryIndex] && room.boardState[categoryIndex].questions[questionIndex]) {
            if (room.boardState[categoryIndex].questions[questionIndex].answered) return;

            room.activeQuestion = { categoryIndex, questionIndex };
            room.buzzedPlayerId = null;
            room.status = 'question_active';

            const qData = jeopardyQuestions[categoryIndex].questions[questionIndex];

            io.to(roomId).emit('game_status', room.status);
            io.to(roomId).emit('jeopardy_active_question', {
                category: jeopardyQuestions[categoryIndex].category,
                points: qData.points,
                question: qData.question
            });
        }
    });

    socket.on('jeopardy_buzz', (roomId) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'question_active') return;

        // First to buzz wins the chance
        if (!room.buzzedPlayerId) {
            room.buzzedPlayerId = socket.id;
            room.status = 'answering';

            const { categoryIndex, questionIndex } = room.activeQuestion;
            const fullQuestion = jeopardyQuestions[categoryIndex].questions[questionIndex];

            io.to(roomId).emit('game_status', room.status);

            // Tell everyone who buzzed
            io.to(roomId).emit('jeopardy_buzzed', {
                playerId: socket.id,
                playerName: room.players[socket.id].name
            });

            // Send options ONLY to the buzzed player to prevent others from guessing
            io.to(socket.id).emit('jeopardy_options', fullQuestion.options);
        }
    });

    socket.on('jeopardy_answer', ({ roomId, answerIndex }) => {
        const room = rooms[roomId];
        console.log(`[Jeopardy] Answer received in room ${roomId}. AnswerIndex: ${answerIndex}, BuzzedPlayer: ${room?.buzzedPlayerId}, Socket: ${socket.id}`);
        if (!room || room.status !== 'answering' || room.buzzedPlayerId !== socket.id) {
            console.log(`[Jeopardy] Invalid answer state.`);
            return;
        }

        const { categoryIndex, questionIndex } = room.activeQuestion;
        const qData = jeopardyQuestions[categoryIndex].questions[questionIndex];
        console.log(`[Jeopardy] Evaluating answer. Expected: ${qData.answer}, Received: ${answerIndex}`);

        if (answerIndex === qData.answer) {
            // Correct! Add points
            room.players[socket.id].score += qData.points;
            // Mark as answered
            room.boardState[categoryIndex].questions[questionIndex].answered = true;

            // Go back to board
            room.activeQuestion = null;
            room.status = 'board';
        } else {
            // Incorrect! Deduct points
            room.players[socket.id].score -= qData.points;
            // Re-open question for others
            room.buzzedPlayerId = null;
            room.status = 'question_active';
        }

        io.to(roomId).emit('update_players', Object.values(room.players));
        io.to(roomId).emit('game_status', room.status);
        if (room.status === 'board') {
            io.to(roomId).emit('jeopardy_board', room.boardState);
        } else {
            // Re-emit active question so others know it's available again
            io.to(roomId).emit('jeopardy_active_question', {
                category: jeopardyQuestions[categoryIndex].category,
                points: qData.points,
                question: qData.question,
                missedBy: room.players[socket.id].name // Optional: tell them who missed
            });
        }
    });

    // --- CAHOOT SPECIFIC SOCKETS ---
    socket.on('cahoot_start', (roomId) => {
        const room = rooms[roomId];
        if (!room || (room.status !== 'playing' && room.status !== 'waiting') || socket.id !== room.hostId) return;

        if (room.status === 'waiting' || room.currentQuestionIndex === -1) {
            room.currentQuestionIndex = 0;
        }

        startCahootQuestion(roomId);
    });

    socket.on('cahoot_submit_answer', ({ roomId, answerIndex }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'question_active') return;

        const player = room.players[socket.id];
        if (player && !player.answerSubmitted) {
            player.answerSubmitted = true;

            const activeQuestions = room.questions || questions;
            const currentQ = activeQuestions[room.currentQuestionIndex];
            // Verify correctly mapped answer
            // Assume answerIndex provided corresponds to 0, 1, 2, or 3
            if (answerIndex === currentQ.answer) {
                // Calculate score based on reaction time (out of 1000)
                const timeRatio = room.timer / QUESTION_TIMER;
                const points = Math.round(1000 * timeRatio) || 0; // Prevent 0 if very close
                player.score += Math.max(points, 500); // Give at least 500 for correct
            }

            // Check if all players (excluding host) answered
            const playerIds = Object.keys(room.players).filter(id => id !== room.hostId);
            const allAnswered = playerIds.every(id => room.players[id].answerSubmitted);

            // Notify host that someone answered (to update count on host screen)
            io.to(room.hostId).emit('cahoot_answer_received', { count: playerIds.filter(id => room.players[id].answerSubmitted).length, total: playerIds.length });

            if (allAnswered) {
                endCahootQuestion(roomId);
            }
        }
    });

    socket.on('cahoot_show_leaderboard', (roomId) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'revealing_answer' || socket.id !== room.hostId) return;

        room.status = 'leaderboard';
        io.to(roomId).emit('game_status', room.status);
    });

    socket.on('cahoot_next_question', (roomId) => {
        const room = rooms[roomId];
        if (!room || (room.status !== 'revealing_answer' && room.status !== 'leaderboard') || socket.id !== room.hostId) return;

        room.currentQuestionIndex++;
        const activeQuestions = room.questions || questions;
        if (room.currentQuestionIndex >= activeQuestions.length) {
            room.status = 'finished';
            io.to(roomId).emit('game_status', room.status);
            io.to(roomId).emit('cahoot_podium', Object.values(room.players));
        } else {
            startCahootQuestion(roomId);
        }
    });

    socket.on('cahoot_set_questions', ({ roomId, customQuestions }) => {
        const room = rooms[roomId];
        if (!room || room.hostId !== socket.id || room.status !== 'waiting') return;

        // Ensure max 25 questions
        const limited = customQuestions.slice(0, 25);
        room.questions = limited;
    });


    // --- TIC TAC TOE SPECIFIC SOCKETS ---
    socket.on('tictactoe_move', ({ roomId, index }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'playing') return;

        const playerIds = Object.keys(room.players);
        if (playerIds.length < 2) return;

        const isPlayerX = socket.id === playerIds[0];
        const isPlayerO = socket.id === playerIds[1];

        if (!isPlayerX && !isPlayerO) return; // Spectator

        if ((room.xIsNext && !isPlayerX) || (!room.xIsNext && !isPlayerO)) return; // Not their turn

        if (room.board[index] || calculateWinner(room.board)) return;

        room.board[index] = room.xIsNext ? 'X' : 'O';
        room.xIsNext = !room.xIsNext;

        io.to(roomId).emit('tictactoe_state', {
            board: room.board,
            xIsNext: room.xIsNext,
            playerX: room.players[playerIds[0]].name,
            playerO: room.players[playerIds[1]].name,
            winner: calculateWinner(room.board)
        });
    });

    // --- SEEN JEEM SPECIFIC SOCKETS ---
    socket.on('seenjeem_submit_answer', ({ roomId, textAnswer }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'playing') return;

        const player = room.players[socket.id];
        if (player && !player.answerSubmitted) {

            const currentQ = seenjeemQuestions[room.currentQuestionIndex];
            // Check if correct
            const isCorrect = currentQ.answers.some(a => a.toLowerCase() === textAnswer.trim().toLowerCase());

            player.answerSubmitted = true;

            if (isCorrect) {
                // Points based on time left (e.g., max 1000)
                const timeRatio = room.timer / QUESTION_TIMER;
                const points = Math.max(Math.round(1000 * timeRatio), 200);
                player.score += points;

                // Notify everyone that someone got it right!
                io.to(roomId).emit('seenjeem_correct_guess', { playerName: player.name, points });
            }

            // Update everyone on scores/status
            io.to(roomId).emit('update_players', Object.values(room.players));

            // Check if all players answered
            const allAnswered = Object.values(room.players).every(p => p.answerSubmitted);
            if (allAnswered) {
                endSeenJeemQuestion(roomId);
            }
        }
    });


    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        rateLimits.delete(socket.id);
        // Find which room they were in and remove them
        for (const roomId in rooms) {
            if (rooms[roomId].players[socket.id]) {
                delete rooms[roomId].players[socket.id];
                io.to(roomId).emit('update_players', Object.values(rooms[roomId].players));

                // If room is empty, clean it up
                if (Object.keys(rooms[roomId].players).length === 0) {
                    if (rooms[roomId].intervalId) clearInterval(rooms[roomId].intervalId);
                    delete rooms[roomId];
                    // Also set inactive in DB if necessary
                }
                break;
            }
        }
    });
});

// Periodic Cleanup Job (every 1 hour) for rooms inactive > 24 hours
setInterval(async () => {
    try {
        const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const deletedRooms = await prisma.room.deleteMany({
            where: {
                lastActive: {
                    lt: threshold
                }
            }
        });
        if (deletedRooms.count > 0) {
            console.log(`Cleaned up ${deletedRooms.count} inactive rooms from DB.`);
        }
    } catch (e) {
        console.error('Failed to cleanup old rooms', e);
    }
}, 60 * 60 * 1000);

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    if (squares.every(s => s !== null)) return 'draw';
    return null;
}

function sendQuestion(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    // Check if game over
    if (room.currentQuestionIndex >= questions.length) {
        room.status = 'finished';
        io.to(roomId).emit('game_status', room.status);
        return;
    }

    // Reset answer states
    Object.values(room.players).forEach(p => p.answerSubmitted = false);

    const currentQ = questions[room.currentQuestionIndex];

    // Send question WITHOUT the answer index
    const questionToClient = {
        question: currentQ.question,
        options: currentQ.options,
        category: currentQ.category
    };

    io.to(roomId).emit('new_question', questionToClient);

    // Start Timer
    room.timer = QUESTION_TIMER;
    io.to(roomId).emit('timer', room.timer);

    room.intervalId = setInterval(() => {
        room.timer--;
        io.to(roomId).emit('timer', room.timer);

        if (room.timer <= 0) {
            // Time's up, next question
            nextQuestion(roomId);
        }
    }, 1000);
}

function nextQuestion(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    // Brief pause before next question to let users see the answer
    const currentQ = questions[room.currentQuestionIndex];
    io.to(roomId).emit('correct_answer', currentQ.answer);

    setTimeout(() => {
        room.currentQuestionIndex++;
        sendQuestion(roomId);
    }, 3000); // 3 second pause
}

// --- IMPOSTER LOGIC ---
function startImposter(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.status = 'role_reveal';
    io.to(roomId).emit('game_status', room.status);

    const playerIds = Object.keys(room.players);
    if (playerIds.length < 3) {
        // Technically playable with 2 but usually 3+
        console.warn('Imposter started with less than 3 players in room', roomId);
    }

    // Pick location
    const randomLocationIndex = Math.floor(Math.random() * imposterLocations.length);
    const locationData = imposterLocations[randomLocationIndex];
    room.location = locationData.location;

    // Pick Imposter
    const imposterId = playerIds[Math.floor(Math.random() * playerIds.length)];
    room.imposterSocketId = imposterId;
    room.imposterName = room.players[imposterId].name;

    // Shuffle roles for normal players
    let rolesCopy = [...locationData.roles];
    rolesCopy.sort(() => Math.random() - 0.5);

    // Send roles privately
    playerIds.forEach(id => {
        if (id === imposterId) {
            io.to(id).emit('imposter_role', { role: 'المحتال', location: '???', isImposter: true });
        } else {
            const assignedRole = rolesCopy.pop() || 'مواطن';
            io.to(id).emit('imposter_role', { role: assignedRole, location: room.location, isImposter: false });
        }
    });

    // Start Question Timer (e.g. 3 minutes = 180s)
    room.timer = 180;
    io.to(roomId).emit('timer', room.timer);
    if (room.intervalId) clearInterval(room.intervalId);

    room.intervalId = setInterval(() => {
        room.timer--;
        io.to(roomId).emit('timer', room.timer);
        if (room.timer <= 0) {
            clearInterval(room.intervalId);
            room.status = 'voting';
            io.to(roomId).emit('game_status', room.status);
        }
    }, 1000);
}

// --- CHARADES LOGIC ---
function startCharadesTurn(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    const playerIds = Object.keys(room.players);
    if (playerIds.length < 2) return;

    // Pick a random actor
    const actorId = playerIds[Math.floor(Math.random() * playerIds.length)];
    room.actorSocketId = actorId;

    // Pick random category and word
    const randCatIdx = Math.floor(Math.random() * charadesCategories.categories.length);
    const categoryObj = charadesCategories.categories[randCatIdx];
    const categoryName = categoryObj.name;
    const randWordIdx = Math.floor(Math.random() * categoryObj.words.length);
    const word = categoryObj.words[randWordIdx];

    room.currentWord = word;
    room.status = 'playing';
    io.to(roomId).emit('game_status', room.status);

    // Send data
    playerIds.forEach(id => {
        if (id === actorId) {
            io.to(id).emit('charades_turn', { role: 'actor', word: word, category: categoryName, actorName: room.players[actorId].name });
        } else {
            io.to(id).emit('charades_turn', { role: 'guesser', word: '???', category: categoryName, actorName: room.players[actorId].name });
        }
    });

    // Timer per round (say 60 seconds)
    room.timer = 60;
    io.to(roomId).emit('timer', room.timer);

    room.intervalId = setInterval(() => {
        room.timer--;
        io.to(roomId).emit('timer', room.timer);
        if (room.timer <= 0) {
            // Time's up - proceed to next round
            startCharadesTurn(roomId);
        }
    }, 1000);
}

// --- CAHOOT LOGIC ---
function startCahootQuestion(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    room.status = 'question_active';
    io.to(roomId).emit('game_status', room.status);

    // Reset answer states for all players
    Object.values(room.players).forEach(p => { p.answerSubmitted = false; });

    const activeQuestions = room.questions || questions;
    const currentQ = activeQuestions[room.currentQuestionIndex];
    io.to(roomId).emit('cahoot_question', {
        question: currentQ.question,
        options: currentQ.options, // Options are ordered 0..3
        category: currentQ.category
    });

    room.timer = QUESTION_TIMER;
    io.to(roomId).emit('timer', room.timer);

    room.intervalId = setInterval(() => {
        room.timer--;
        io.to(roomId).emit('timer', room.timer);

        if (room.timer <= 0) {
            endCahootQuestion(roomId);
        }
    }, 1000);
}

function endCahootQuestion(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    room.status = 'revealing_answer';
    io.to(roomId).emit('game_status', room.status);

    // Broadcast the correct answer index
    const activeQuestions = room.questions || questions;
    const currentQ = activeQuestions[room.currentQuestionIndex];
    io.to(roomId).emit('cahoot_reveal', currentQ.answer);

    // Update scoreboard
    io.to(roomId).emit('update_players', Object.values(room.players));
}


// --- SEEN JEEM LOGIC ---
function startSeenJeemQuestion(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    if (room.currentQuestionIndex >= seenjeemQuestions.length) {
        room.status = 'finished';
        io.to(roomId).emit('game_status', room.status);
        io.to(roomId).emit('update_players', Object.values(room.players)); // Final scores
        return;
    }

    room.status = 'playing';
    io.to(roomId).emit('game_status', room.status);

    // Reset answer states
    Object.values(room.players).forEach(p => p.answerSubmitted = false);

    const currentQ = seenjeemQuestions[room.currentQuestionIndex];

    // Send question WITHOUT the answers array
    const questionToClient = {
        question: currentQ.question,
        category: currentQ.category
    };

    io.to(roomId).emit('seenjeem_new_question', questionToClient);

    // Start Timer
    room.timer = QUESTION_TIMER;
    io.to(roomId).emit('timer', room.timer);

    room.intervalId = setInterval(() => {
        room.timer--;
        io.to(roomId).emit('timer', room.timer);

        if (room.timer <= 0) {
            endSeenJeemQuestion(roomId);
        }
    }, 1000);
}

function endSeenJeemQuestion(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    room.status = 'revealing_answer';
    io.to(roomId).emit('game_status', room.status);

    const currentQ = seenjeemQuestions[room.currentQuestionIndex];
    // Emit the main correct answer to show everyone
    io.to(roomId).emit('seenjeem_reveal', currentQ.answers[0]);

    setTimeout(() => {
        room.currentQuestionIndex++;
        startSeenJeemQuestion(roomId);
    }, 4000); // 4 second pause
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, displayName } = req.body;
        if (!username || !password || !displayName) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, password: hashedPassword, displayName }
        });

        const token = jwt.sign({ userId: user.id, username: user.username, displayName: user.displayName }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'User created successfully', token, user: { id: user.id, username: user.username, displayName: user.displayName } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, username: user.username, displayName: user.displayName }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, displayName: user.displayName } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Google credential missing' });
        }

        // Verify the Google JWT token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            // Audience should ideally be set to process.env.VITE_GOOGLE_CLIENT_ID
            // Here we rely on the client instance initialization, which is usually sufficient
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google token payload' });
        }

        const { sub: googleId, email, name } = payload;

        // Try to find the user by googleId or email
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { googleId },
                    { email }
                ]
            }
        });

        // If the user doesn't exist, create a new one automatically
        if (!user) {
            // Generate a random unique username fallback
            const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const username = `${baseUsername}${randomSuffix}`;

            user = await prisma.user.create({
                data: {
                    username: username,
                    displayName: name || 'Google User',
                    email: email,
                    googleId: googleId,
                    // password is intentionally null for Google-only signups
                }
            });
        } else if (!user.googleId) {
            // If user exists by email but hasn't linked Google yet, link it now
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: googleId }
            });
        }

        // Issue our standard platform JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username, displayName: user.displayName },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Google Login successful',
            token,
            user: { id: user.id, username: user.username, displayName: user.displayName }
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ error: 'Failed to authenticate with Google' });
    }
});

app.get('/api/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { ownerships: true }
        });
        if (!user) return res.status(401).json({ error: 'User not found' });

        res.json({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            ownedGames: user.ownerships.filter(o => new Date(o.expiresAt) > new Date()).map(o => o.gameId)
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Mock Payment Route (Simulates Stripe Checkout)
app.post('/api/checkout/mock', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const { gameId, packageId } = req.body;

        if (!gameId && !packageId) {
            return res.status(400).json({ error: 'gameId or packageId is required' });
        }

        const now = new Date();
        const gamesToUnlock = packageId === 'party_bundle'
            ? ['imposter', 'charades', 'cahoot', 'jeopardy']
            : [gameId];

        // Process all games in parallel
        await Promise.all(gamesToUnlock.map(async (gId) => {
            const existingOwnership = await prisma.gameOwnership.findUnique({
                where: { userId_gameId: { userId: decoded.userId, gameId: gId } }
            });

            let newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

            if (existingOwnership && existingOwnership.expiresAt > now) {
                // Extend the expiration date by 7 days from the *current expiration date*
                newExpiresAt = new Date(existingOwnership.expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000);
            }

            await prisma.gameOwnership.upsert({
                where: {
                    userId_gameId: {
                        userId: decoded.userId,
                        gameId: gId
                    }
                },
                update: {
                    expiresAt: newExpiresAt
                },
                create: {
                    userId: decoded.userId,
                    gameId: gId,
                    expiresAt: newExpiresAt
                }
            });
        }));

        res.json({ message: 'Purchase successful (Mock)', gamesUnlocked: gamesToUnlock });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: 'Checkout failed' });
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
