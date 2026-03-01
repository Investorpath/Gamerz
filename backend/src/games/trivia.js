const questions = require('../../questions.json');

function sendQuestion(io, rooms, roomId, QUESTION_TIMER) {
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
            nextQuestion(io, rooms, roomId, QUESTION_TIMER);
        }
    }, 1000);
}

function nextQuestion(io, rooms, roomId, QUESTION_TIMER) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    // Brief pause before next question
    const currentQ = questions[room.currentQuestionIndex];
    io.to(roomId).emit('correct_answer', currentQ.answer);

    setTimeout(() => {
        room.currentQuestionIndex++;
        sendQuestion(io, rooms, roomId, QUESTION_TIMER);
    }, 3000);
}

module.exports = {
    sendQuestion,
    nextQuestion
};
