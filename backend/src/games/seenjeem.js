const seenjeemQuestions = require('../../seenjeem_questions.json');

function startSeenJeemQuestion(io, rooms, roomId, QUESTION_TIMER) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    if (room.currentQuestionIndex >= seenjeemQuestions.length) {
        room.status = 'finished';
        io.to(roomId).emit('game_status', room.status);
        io.to(roomId).emit('update_players', Object.values(room.players));
        return;
    }

    room.status = 'playing';
    io.to(roomId).emit('game_status', room.status);

    Object.values(room.players).forEach(p => p.answerSubmitted = false);

    const currentQ = seenjeemQuestions[room.currentQuestionIndex];
    const questionToClient = {
        question: currentQ.question,
        category: currentQ.category
    };

    io.to(roomId).emit('seenjeem_new_question', questionToClient);

    room.timer = QUESTION_TIMER;
    io.to(roomId).emit('timer', room.timer);

    room.intervalId = setInterval(() => {
        room.timer--;
        io.to(roomId).emit('timer', room.timer);

        if (room.timer <= 0) {
            endSeenJeemQuestion(io, rooms, roomId, QUESTION_TIMER);
        }
    }, 1000);
}

function endSeenJeemQuestion(io, rooms, roomId, QUESTION_TIMER) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    room.status = 'revealing_answer';
    io.to(roomId).emit('game_status', room.status);

    const currentQ = seenjeemQuestions[room.currentQuestionIndex];
    io.to(roomId).emit('seenjeem_reveal', currentQ.answers[0]);

    setTimeout(() => {
        room.currentQuestionIndex++;
        startSeenJeemQuestion(io, rooms, roomId, QUESTION_TIMER);
    }, 4000);
}

module.exports = {
    startSeenJeemQuestion,
    endSeenJeemQuestion
};
