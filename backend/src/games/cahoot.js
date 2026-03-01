const questions = require('../../questions.json');

function startCahootQuestion(io, rooms, roomId, QUESTION_TIMER) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    room.status = 'question_active';
    io.to(roomId).emit('game_status', room.status);

    // Reset answer states
    Object.values(room.players).forEach(p => { p.answerSubmitted = false; });

    const activeQuestions = room.questions || questions;
    const currentQ = activeQuestions[room.currentQuestionIndex];
    io.to(roomId).emit('cahoot_question', {
        question: currentQ.question,
        options: currentQ.options,
        category: currentQ.category
    });

    room.timer = QUESTION_TIMER;
    io.to(roomId).emit('timer', room.timer);

    room.intervalId = setInterval(() => {
        room.timer--;
        io.to(roomId).emit('timer', room.timer);

        if (room.timer <= 0) {
            endCahootQuestion(io, rooms, roomId);
        }
    }, 1000);
}

function endCahootQuestion(io, rooms, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    room.status = 'revealing_answer';
    io.to(roomId).emit('game_status', room.status);

    const activeQuestions = room.questions || questions;
    const currentQ = activeQuestions[room.currentQuestionIndex];
    io.to(roomId).emit('cahoot_reveal', currentQ.answer);

    io.to(roomId).emit('update_players', Object.values(room.players));
}

module.exports = {
    startCahootQuestion,
    endCahootQuestion
};
