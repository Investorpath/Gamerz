const imposterLocations = require('../../imposter_locations.json');

function startImposter(io, rooms, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.status = 'role_reveal';
    io.to(roomId).emit('game_status', room.status);

    const playerIds = Object.keys(room.players);
    if (playerIds.length < 3) {
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

    // Shuffle roles
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

    // Start Question Timer (3 minutes)
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

module.exports = {
    startImposter
};
