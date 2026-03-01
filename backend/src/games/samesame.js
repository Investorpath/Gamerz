const doubleScenarios = require('../../double_scenarios.json');

function startSameSameTurn(io, rooms, roomId, sanitizeInput) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    const playerIds = Object.keys(room.players);
    if (playerIds.length < 3) {
        console.warn('Same Same started with less than 3 players in room', roomId);
    }

    const judgeId = playerIds[Math.floor(Math.random() * playerIds.length)];
    room.judgeSocketId = judgeId;
    room.comedians = playerIds.filter(id => id !== judgeId);
    room.submittedAnswers = [];

    const randIdx = Math.floor(Math.random() * doubleScenarios.length);
    room.currentScenarioPairs = doubleScenarios[randIdx];

    room.status = 'playing';
    io.to(roomId).emit('game_status', room.status);

    playerIds.forEach(id => {
        const isJudge = id === judgeId;
        io.to(id).emit('samesame_turn', {
            isJudge,
            judgeName: room.players[judgeId]?.name || 'Unknown',
            scenarios: room.currentScenarioPairs
        });
    });

    room.timer = 60;
    io.to(roomId).emit('timer', room.timer);

    room.intervalId = setInterval(() => {
        room.timer--;
        io.to(roomId).emit('timer', room.timer);

        if (room.timer <= 0) {
            endSameSameAnswering(io, rooms, roomId);
        }
    }, 1000);
}

function endSameSameAnswering(io, rooms, roomId) {
    const room = rooms[roomId];
    if (!room) return;
    if (room.intervalId) clearInterval(room.intervalId);

    room.status = 'judging';
    io.to(roomId).emit('game_status', room.status);

    const anonymousAnswers = room.submittedAnswers.map((a, index) => ({
        index,
        text: a.text
    }));

    const playerIds = Object.keys(room.players);
    playerIds.forEach(id => {
        if (id === room.judgeSocketId) {
            io.to(id).emit('samesame_judging', anonymousAnswers);
        } else {
            io.to(id).emit('samesame_judging', []);
        }
    });
}

function startSameSameRoundWinner(io, rooms, roomId, winningEntry, startNextTurn) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.players[winningEntry.socketId]) {
        room.players[winningEntry.socketId].score += 15;
    }

    room.status = 'round_winner';
    io.to(roomId).emit('game_status', room.status);

    io.to(roomId).emit('samesame_winner', {
        playerName: winningEntry.playerName,
        text: winningEntry.text,
        scenarioA: room.currentScenarioPairs.scenarioA,
        scenarioB: room.currentScenarioPairs.scenarioB
    });
    io.to(roomId).emit('update_players', Object.values(room.players));

    setTimeout(() => {
        room.currentRound++;
        if (room.currentRound > room.maxRounds) {
            room.status = 'finished';
            io.to(roomId).emit('game_status', room.status);
        } else {
            startNextTurn(io, rooms, roomId);
        }
    }, 5000);
}

module.exports = {
    startSameSameTurn,
    endSameSameAnswering,
    startSameSameRoundWinner
};
