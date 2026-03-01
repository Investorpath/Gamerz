const words = [
    'كتاب', 'قلمي', 'سماء', 'أسود', 'أبيض', 'أخضر', 'سعيد', 'جميل', 'كبير', 'صغير',
    'طويل', 'قصير', 'قوية', 'ضعيف', 'سريع', 'بطيء', 'نظيف', 'وسيم', 'عظيم', 'قديم',
    'جديد', 'بحرى', 'نخله', 'جبال', 'نهرى', 'صحرا', 'غابة', 'زهور', 'شجره', 'فواكه',
    'تفاح', 'خوخه', 'موزة', 'كرزي', 'عنبي', 'بطيخ', 'ليمو', 'خيار', 'جزرى', 'بصلة',
    'ثومي', 'خبزي', 'لحمة', 'دجاج', 'سمكة', 'حليب', 'قهوة', 'شايي', 'ماءى', 'عصير'
];

function startKalimat(io, rooms, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    // Pick a random word from the list
    const randomIndex = Math.floor(Math.random() * words.length);
    room.targetWord = words[randomIndex];
    room.status = 'playing';

    // Reset player attempts and states
    Object.keys(room.players).forEach(socketId => {
        room.players[socketId].attempts = [];
        room.players[socketId].guessed = false;
        room.players[socketId].score = 0;
    });

    io.to(roomId).emit('game_status', room.status);
    io.to(roomId).emit('kalimat_start', {
        wordLength: room.targetWord.length,
        maxTries: 8
    });

    console.log(`Kalimat started in room ${roomId}. Target word: ${room.targetWord}`);
}

function checkGuess(guess, target) {
    const result = [];
    const targetArr = target.split('');
    const guessArr = guess.split('');
    const targetUsed = Array(target.length).fill(false);
    const guessUsed = Array(guess.length).fill(false);

    // First pass: Find correct positions (green)
    for (let i = 0; i < guess.length; i++) {
        if (guessArr[i] === targetArr[i]) {
            result[i] = 'correct';
            targetUsed[i] = true;
            guessUsed[i] = true;
        }
    }

    // Second pass: Find misplaced letters (yellow)
    for (let i = 0; i < guess.length; i++) {
        if (guessUsed[i]) continue;
        for (let j = 0; j < target.length; j++) {
            if (!targetUsed[j] && guessArr[i] === targetArr[j]) {
                result[i] = 'misplaced';
                targetUsed[j] = true;
                break;
            }
        }
        if (!result[i]) {
            result[i] = 'wrong';
        }
    }

    return result;
}

module.exports = {
    startKalimat,
    checkGuess,
    words
};
