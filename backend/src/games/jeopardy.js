const jeopardyQuestions = require('../../jeopardy_questions.json');

function handleJeopardySelection(io, rooms, roomId, categoryIndex, questionIndex) {
    const room = rooms[roomId];
    if (!room || room.status !== 'board') return;

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
}

function handleJeopardyBuzz(io, rooms, roomId, socket) {
    const room = rooms[roomId];
    if (!room || room.status !== 'question_active') return;

    if (!room.buzzedPlayerId) {
        room.buzzedPlayerId = socket.id;
        room.status = 'answering';

        const { categoryIndex, questionIndex } = room.activeQuestion;
        const fullQuestion = jeopardyQuestions[categoryIndex].questions[questionIndex];

        io.to(roomId).emit('game_status', room.status);
        io.to(roomId).emit('jeopardy_buzzed', {
            playerId: socket.id,
            playerName: room.players[socket.id].name
        });

        io.to(socket.id).emit('jeopardy_options', fullQuestion.options);
    }
}

function handleJeopardyAnswer(io, rooms, roomId, socket, answerIndex) {
    const room = rooms[roomId];
    if (!room || room.status !== 'answering' || room.buzzedPlayerId !== socket.id) return;

    const { categoryIndex, questionIndex } = room.activeQuestion;
    const qData = jeopardyQuestions[categoryIndex].questions[questionIndex];

    if (answerIndex === qData.answer) {
        room.players[socket.id].score += qData.points;
        room.boardState[categoryIndex].questions[questionIndex].answered = true;
        room.activeQuestion = null;
        room.status = 'board';
    } else {
        room.players[socket.id].score -= qData.points;
        room.buzzedPlayerId = null;
        room.status = 'question_active';
    }

    io.to(roomId).emit('update_players', Object.values(room.players));
    io.to(roomId).emit('game_status', room.status);
    if (room.status === 'board') {
        io.to(roomId).emit('jeopardy_board', room.boardState);
    } else {
        io.to(roomId).emit('jeopardy_active_question', {
            category: jeopardyQuestions[categoryIndex].category,
            points: qData.points,
            question: qData.question,
            missedBy: room.players[socket.id].name
        });
    }
}

module.exports = {
    handleJeopardySelection,
    handleJeopardyBuzz,
    handleJeopardyAnswer
};
