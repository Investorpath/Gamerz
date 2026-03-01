require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { admin, db } = require('./firebaseAdmin');
const { socketAuthenticator, sanitizeInput } = require('./securityMiddleware');

// Load Questions/Data
const questions = require('./questions.json');
const jeopardyQuestions = require('./jeopardy_questions.json');

// Import Managers & Games
const { rooms, initRoom, trackRoomInFirestore, cleanupInactiveRooms } = require('./src/managers/roomManager');
const trivia = require('./src/games/trivia');
const imposter = require('./src/games/imposter');
const charades = require('./src/games/charades');
const jeopardy = require('./src/games/jeopardy');
const cahoot = require('./src/games/cahoot');
const seenjeem = require('./src/games/seenjeem');
const samesame = require('./src/games/samesame');
const tictactoe = require('./src/games/tictactoe');

// Import Routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const adminRoutes = require('./src/routes/admin');
const checkoutRoutes = require('./src/routes/checkout');

const app = express();
const allowedOrigins = [
    'http://localhost:5173',
    'https://gamerz-e22c0.web.app',
    'https://gamerz-e22c0.firebaseapp.com'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Express Rate Limiting for Auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/auth/', authLimiter);

// Attach Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/checkout', checkoutRoutes);

app.get('/', (req, res) => {
    res.send('Games Hub Backend is running (Modular)!');
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.use(socketAuthenticator);

const QUESTION_TIMER = 15;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id, 'User:', socket.user?.username);

    // Socket Middleware for Rate Limiting and Room Scoping
    socket.use(([event, ...args], next) => {
        const roomEvents = ['start_game', 'submit_answer', 'imposter_vote', 'charades_got_it', 'jeopardy_select_question', 'jeopardy_buzz', 'jeopardy_answer', 'tictactoe_move', 'cahoot_start', 'cahoot_submit_answer', 'cahoot_next_question', 'seenjeem_submit_answer', 'submit_funny_answer', 'samesame_pick_winner'];
        if (roomEvents.includes(event)) {
            let roomIdArg = (typeof args[0] === 'object' && args[0] !== null) ? args[0].roomId : args[0];
            if (roomIdArg && !socket.rooms.has(roomIdArg)) {
                return next(new Error('Room scoping error: You are not in this room.'));
            }
        }
        next();
    });

    socket.on('join_room', async ({ roomId, playerName, gameType, userId }) => {
        playerName = sanitizeInput(playerName || socket.user?.displayName || 'Unknown');

        // Ownership Verification Logic
        if (!rooms[roomId] && ['imposter', 'charades', 'jeopardy', 'cahoot', 'seenjeem', 'same_same'].includes(gameType)) {
            const socketUserId = socket.user?.userId;
            const effectiveUserId = socketUserId || userId;
            let userRole = socket.user?.role || 'USER';

            if (!effectiveUserId) {
                socket.emit('game_error', 'يجب تسجيل الدخول لإنشاء غرفة مميزة.');
                return;
            }

            if (userRole === 'USER') {
                try {
                    const freshUserDoc = await db.collection('users').doc(effectiveUserId).get();
                    if (freshUserDoc.exists && freshUserDoc.data().role === 'ADMIN') {
                        userRole = 'ADMIN';
                    }
                } catch (e) {
                    console.error("Fresh role check failed", e);
                }
            }

            if (userRole !== 'ADMIN') {
                try {
                    const ownershipSnap = await db.collection('ownerships')
                        .where('userId', '==', effectiveUserId)
                        .where('gameId', '==', gameType)
                        .get();

                    const ownsGame = !ownershipSnap.empty && ownershipSnap.docs.some(doc => {
                        const data = doc.data();
                        let expiresAt;
                        if (data.expiresAt && typeof data.expiresAt.toDate === 'function') {
                            expiresAt = data.expiresAt.toDate();
                        } else if (data.expiresAt && data.expiresAt._seconds) {
                            expiresAt = new Date(data.expiresAt._seconds * 1000);
                        } else {
                            expiresAt = new Date(data.expiresAt);
                        }
                        return expiresAt >= new Date();
                    });

                    if (!ownsGame) {
                        socket.emit('game_error', 'يجب عليك شراء هذه اللعبة لإنشاء غرفة.');
                        return;
                    }
                } catch (err) {
                    console.error('Ownership query error:', err);
                    socket.emit('game_error', 'حدث خطأ أثناء التحقق من ملكية اللعبة.');
                    return;
                }
            }
        }

        socket.join(roomId);
        const room = initRoom(roomId, gameType || 'trivia', jeopardyQuestions);

        await trackRoomInFirestore(roomId, gameType, socket.user?.userId || userId);

        if (Object.keys(room.players).length === 0) {
            room.hostId = socket.id;
            room.hostSocketId = socket.id; // Correct reference for host-only actions
        }

        room.players[socket.id] = {
            name: playerName,
            score: 0,
            answerSubmitted: false
        };

        io.to(roomId).emit('update_players', Object.values(room.players));
        io.to(roomId).emit('game_status', room.status);
        io.to(roomId).emit('room_host', room.hostId);
    });

    socket.on('start_game', (roomId) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'waiting') return;

        room.status = 'playing';
        switch (room.gameType) {
            case 'trivia':
                room.currentQuestionIndex = 0;
                io.to(roomId).emit('game_status', room.status);
                trivia.sendQuestion(io, rooms, roomId, QUESTION_TIMER);
                break;
            case 'imposter':
                imposter.startImposter(io, rooms, roomId);
                break;
            case 'charades':
                charades.startCharadesTurn(io, rooms, roomId);
                break;
            case 'jeopardy':
                room.status = 'board';
                io.to(roomId).emit('game_status', room.status);
                io.to(roomId).emit('jeopardy_board', room.boardState);
                break;
            case 'cahoot':
                room.currentQuestionIndex = 0;
                io.to(roomId).emit('game_status', room.status);
                cahoot.startCahootQuestion(io, rooms, roomId, QUESTION_TIMER);
                break;
            case 'tictactoe':
                const playerIds = Object.keys(room.players);
                io.to(roomId).emit('game_status', room.status);
                io.to(roomId).emit('tictactoe_state', {
                    board: room.board,
                    xIsNext: room.xIsNext,
                    playerX: room.players[playerIds[0]]?.name || 'Player 1',
                    playerO: room.players[playerIds[1]]?.name || 'Player 2',
                    winner: null
                });
                break;
            case 'seenjeem':
                room.currentQuestionIndex = 0;
                io.to(roomId).emit('game_status', room.status);
                seenjeem.startSeenJeemQuestion(io, rooms, roomId, QUESTION_TIMER);
                break;
            case 'same_same':
                room.currentRound = 1;
                samesame.startSameSameTurn(io, rooms, roomId, sanitizeInput);
                break;
        }
    });

    socket.on('submit_answer', ({ roomId, answerIndex }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'playing') return;
        const player = room.players[socket.id];
        if (player && !player.answerSubmitted) {
            player.answerSubmitted = true;
            if (answerIndex === questions[room.currentQuestionIndex]?.answer) player.score += 10;
            io.to(roomId).emit('update_players', Object.values(room.players));
            if (Object.values(room.players).every(p => p.answerSubmitted)) trivia.nextQuestion(io, rooms, roomId, QUESTION_TIMER);
        }
    });

    socket.on('imposter_vote', ({ roomId, targetSocketId }) => {
        io.to(roomId).emit('vote_registered', { voter: socket.id, target: targetSocketId });
    });

    socket.on('charades_got_it', (roomId) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'playing') return;
        if (socket.id === room.actorSocketId) {
            if (room.players[socket.id]) room.players[socket.id].score += 10;
            io.to(roomId).emit('update_players', Object.values(room.players));
            charades.startCharadesTurn(io, rooms, roomId);
        }
    });

    socket.on('jeopardy_select_question', (data) => jeopardy.handleJeopardySelection(io, rooms, data.roomId, data.categoryIndex, data.questionIndex));
    socket.on('jeopardy_buzz', (roomId) => jeopardy.handleJeopardyBuzz(io, rooms, roomId, socket));
    socket.on('jeopardy_answer', (data) => jeopardy.handleJeopardyAnswer(io, rooms, data.roomId, socket, data.answerIndex));

    socket.on('cahoot_start', (roomId) => {
        const room = rooms[roomId];
        if (!room || socket.id !== room.hostId) return;
        if (room.status === 'waiting' || room.currentQuestionIndex === -1) room.currentQuestionIndex = 0;
        cahoot.startCahootQuestion(io, rooms, roomId, QUESTION_TIMER);
    });

    socket.on('cahoot_submit_answer', ({ roomId, answerIndex }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'question_active') return;
        const player = room.players[socket.id];
        if (player && !player.answerSubmitted) {
            player.answerSubmitted = true;
            const activeQuestions = room.questions || questions;
            if (answerIndex === activeQuestions[room.currentQuestionIndex]?.answer) {
                const timeRatio = room.timer / QUESTION_TIMER;
                player.score += Math.max(Math.round(1000 * timeRatio), 500);
            }
            const playerIds = Object.keys(room.players).filter(id => id !== room.hostId);
            const answeredCount = playerIds.filter(id => room.players[id].answerSubmitted).length;
            io.to(room.hostId).emit('cahoot_answer_received', { count: answeredCount, total: playerIds.length });
            if (answeredCount === playerIds.length) cahoot.endCahootQuestion(io, rooms, roomId);
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
        if (!room || socket.id !== room.hostId) return;
        room.currentQuestionIndex++;
        const activeQuestions = room.questions || questions;
        if (room.currentQuestionIndex >= activeQuestions.length) {
            room.status = 'finished';
            io.to(roomId).emit('game_status', room.status);
            io.to(roomId).emit('cahoot_podium', Object.values(room.players));
        } else {
            cahoot.startCahootQuestion(io, rooms, roomId, QUESTION_TIMER);
        }
    });

    socket.on('cahoot_set_questions', ({ roomId, customQuestions }) => {
        const room = rooms[roomId];
        if (room && room.hostId === socket.id && room.status === 'waiting') room.questions = customQuestions.slice(0, 25);
    });

    socket.on('seenjeem_submit_answer', ({ roomId, textAnswer }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'playing') return;
        const player = room.players[socket.id];
        if (player && !player.answerSubmitted) {
            const currentQ = seenjeemQuestions[room.currentQuestionIndex];
            const isCorrect = currentQ.answers.some(a => a.toLowerCase() === textAnswer.trim().toLowerCase());
            player.answerSubmitted = true;
            if (isCorrect) {
                const points = Math.max(Math.round(1000 * (room.timer / QUESTION_TIMER)), 200);
                player.score += points;
                io.to(roomId).emit('seenjeem_correct_guess', { playerName: player.name, points });
            }
            io.to(roomId).emit('update_players', Object.values(room.players));
            if (Object.values(room.players).every(p => p.answerSubmitted)) seenjeem.endSeenJeemQuestion(io, rooms, roomId, QUESTION_TIMER);
        }
    });

    socket.on('submit_funny_answer', ({ roomId, answerText }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'playing' || room.judgeSocketId === socket.id) return;
        if (!room.submittedAnswers.find(a => a.socketId === socket.id)) {
            room.submittedAnswers.push({ socketId: socket.id, text: sanitizeInput(answerText), playerName: room.players[socket.id]?.name || 'Unknown' });
            if (room.submittedAnswers.length >= room.comedians.length) samesame.endSameSameAnswering(io, rooms, roomId);
            else io.to(room.judgeSocketId).emit('samesame_answers_count', room.submittedAnswers.length);
        }
    });

    socket.on('samesame_pick_winner', ({ roomId, winnerIndex }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'judging' || room.judgeSocketId !== socket.id) return;
        const winningEntry = room.submittedAnswers[winnerIndex];
        if (winningEntry) samesame.startSameSameRoundWinner(io, rooms, roomId, winningEntry, samesame.startSameSameTurn);
    });

    socket.on('tictactoe_move', ({ roomId, index }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'playing') return;
        const playerIds = Object.keys(room.players);
        if (playerIds.length < 2) return;
        if (room.board[index] || tictactoe.calculateWinner(room.board)) return;
        room.board[index] = (socket.id === playerIds[0]) ? 'X' : 'O';
        room.xIsNext = !room.xIsNext;
        io.to(roomId).emit('tictactoe_state', {
            board: room.board,
            xIsNext: room.xIsNext,
            playerX: room.players[playerIds[0]].name,
            playerO: room.players[playerIds[1]].name,
            winner: tictactoe.calculateWinner(room.board)
        });
    });

    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            if (rooms[roomId].players[socket.id]) {
                delete rooms[roomId].players[socket.id];
                io.to(roomId).emit('update_players', Object.values(rooms[roomId].players));
                if (Object.keys(rooms[roomId].players).length === 0) {
                    if (rooms[roomId].intervalId) clearInterval(rooms[roomId].intervalId);
                    delete rooms[roomId];
                }
                break;
            }
        }
    });
});

cleanupInactiveRooms(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
