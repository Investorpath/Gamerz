const charadesWords = require('../../charades_words.json');

function startCharadesTurn(io, rooms, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    const playerIds = Object.keys(room.players);
    if (playerIds.length < 2) return;

    // Pick a random actor
    const actorId = playerIds[Math.floor(Math.random() * playerIds.length)];
    room.actorSocketId = actorId;

    // Pick random category and word
    const randCatIdx = Math.floor(Math.random() * charadesWords.categories.length);
    const categoryObj = charadesWords.categories[randCatIdx];
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

    // Timer per round (60 seconds)
    room.timer = 60;
    io.to(roomId).emit('timer', room.timer);

    room.intervalId = setInterval(() => {
        room.timer--;
        io.to(roomId).emit('timer', room.timer);
        if (room.timer <= 0) {
            startCharadesTurn(io, rooms, roomId);
        }
    }, 1000);
}

module.exports = {
    startCharadesTurn
};
