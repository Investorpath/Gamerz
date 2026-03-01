const { db, admin } = require('../firebaseAdmin');

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

module.exports = {
    rooms,
    initRoom,
    trackRoomInFirestore,
    cleanupInactiveRooms
};
