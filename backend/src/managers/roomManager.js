const { db, admin } = require('../../firebaseAdmin');

const rooms = {};

function initRoom(roomId, gameType = 'trivia', jeopardyQuestions = []) {
    if (!rooms[roomId]) {
        const room = {
            gameType: gameType,
            players: {}, // socketId -> player data
            status: 'waiting',
            timer: 0,
            intervalId: null,
            hostId: null
        };

        // Initialize game-specific state
        switch (gameType) {
            case 'trivia':
                room.currentQuestionIndex = -1;
                break;
            case 'imposter':
                room.location = null;
                room.imposterSocketId = null;
                room.imposterName = null;
                break;
            case 'charades':
                room.actorSocketId = null;
                room.currentWord = null;
                room.scores = {};
                room.rounds = 0;
                room.maxRounds = 3;
                break;
            case 'jeopardy':
                room.boardState = jeopardyQuestions.map(cat => ({
                    category: cat.category,
                    questions: cat.questions.map(q => ({
                        points: q.points,
                        answered: false
                    }))
                }));
                room.activeQuestion = null;
                room.buzzedPlayerId = null;
                break;
            case 'cahoot':
                room.currentQuestionIndex = -1;
                room.optionsMap = [];
                room.questions = null;
                break;
            case 'tictactoe':
                room.board = Array(9).fill(null);
                room.xIsNext = true;
                break;
            case 'seenjeem':
                room.currentQuestionIndex = -1;
                break;
            case 'same_same':
                room.currentRound = 0;
                room.maxRounds = 3;
                room.judgeSocketId = null;
                room.comedians = [];
                room.currentScenarioPairs = null;
                room.submittedAnswers = [];
                break;
            case 'kalimat':
                room.targetWord = null;
                room.maxTries = 8;
                break;
        }

        rooms[roomId] = room;
    }
    return rooms[roomId];
}

async function trackRoomInFirestore(roomId, gameType, userId) {
    try {
        await db.collection('rooms').doc(roomId).set({
            id: roomId,
            gameType: gameType || 'trivia',
            hostId: userId,
            lastActive: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (e) {
        console.error('Error tracking room in Firestore:', e);
    }
}

function cleanupInactiveRooms(io) {
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    setInterval(async () => {
        try {
            const snapshot = await db.collection('rooms').where('lastActive', '<', threshold).get();
            if (snapshot.empty) return;

            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`Cleaned up ${snapshot.size} inactive rooms from Firestore.`);
        } catch (e) {
            console.error('Failed to cleanup old rooms:', e);
        }
    }, 60 * 60 * 1000); // Check every hour
}

async function joinRoom(io, socket, { roomId, playerName, gameType, userId, jeopardyQuestions = [] }) {
    socket.join(roomId);

    const room = initRoom(roomId, gameType || 'trivia', jeopardyQuestions);

    // Track in Firestore (Async, don't block join)
    trackRoomInFirestore(roomId, gameType, socket.user?.userId || userId);

    // If first player, they are the host
    if (Object.keys(room.players).length === 0) {
        room.hostId = socket.id;
        room.hostSocketId = socket.id;
    }

    // Add player to room state
    room.players[socket.id] = {
        id: socket.id,
        name: playerName,
        score: 0,
        answerSubmitted: false
    };

    // Broadcast updates
    io.to(roomId).emit('update_players', Object.values(room.players));
    io.to(roomId).emit('game_status', room.status);
    io.to(roomId).emit('room_host', room.hostId);

    return room;
}

function leaveRoom(io, socket) {
    for (const roomId in rooms) {
        const room = rooms[roomId];
        if (room.players[socket.id]) {
            console.log(`Player ${socket.id} leaving room ${roomId}`);
            delete room.players[socket.id];

            // If room is empty, cleanup
            if (Object.keys(room.players).length === 0) {
                if (room.intervalId) clearInterval(room.intervalId);
                delete rooms[roomId];
                return;
            }

            // If host left, reassign to next available player
            if (room.hostId === socket.id) {
                const nextHostId = Object.keys(room.players)[0];
                room.hostId = nextHostId;
                room.hostSocketId = nextHostId;
                io.to(roomId).emit('room_host', room.hostId);
            }

            // Sync players
            io.to(roomId).emit('update_players', Object.values(room.players));
            break;
        }
    }
}

module.exports = {
    rooms,
    initRoom,
    joinRoom,
    leaveRoom,
    trackRoomInFirestore,
    cleanupInactiveRooms
};
