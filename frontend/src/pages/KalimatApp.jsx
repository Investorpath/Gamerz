import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

const ARABIC_KEYBOARD = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط', 'ذ'],
    ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'],
    ['إرسال', 'حذف']
];

const COLORS = {
    correct: 'bg-emerald-500 border-emerald-400',
    misplaced: 'bg-amber-500 border-amber-400',
    wrong: 'bg-slate-700 border-slate-600',
    empty: 'bg-slate-800/50 border-slate-700',
    active: 'bg-slate-800 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
};

function KalimatApp() {
    const { user } = useAuth();
    const socket = useSocket();
    const [roomId, setRoomId] = useState('');
    const [gameStatus, setGameStatus] = useState('waiting');

    // Game State
    const [attempts, setAttempts] = useState([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [guessed, setGuessed] = useState(false);
    const [targetReached, setTargetReached] = useState(false);
    const [revealData, setRevealData] = useState(null);

    // Auto-join on mount
    useEffect(() => {
        if (socket && user) {
            const soloRoomId = `solo_${user.id || user.uid}_${Date.now()}`;
            setRoomId(soloRoomId);
            socket.emit('join_room', {
                roomId: soloRoomId,
                playerName: user.displayName || 'لاعب',
                gameType: 'kalimat',
                userId: user.id || user.uid
            });
            // Give a small delay to ensure room is joined before starting
            setTimeout(() => {
                socket.emit('start_game', soloRoomId);
            }, 500);
        }
    }, [socket, user]);

    useEffect(() => {
        if (!socket) return;

        socket.on('game_status', (status) => setGameStatus(status));

        socket.on('kalimat_start', () => {
            setAttempts([]);
            setCurrentGuess('');
            setGuessed(false);
            setTargetReached(false);
            setRevealData(null);
        });

        socket.on('kalimat_update', (data) => {
            setAttempts(data.attempts);
            setGuessed(data.guessed);
            setTargetReached(data.targetReached);
            if (data.guessed || data.targetReached) setCurrentGuess('');
        });

        socket.on('kalimat_reveal', (data) => {
            setRevealData(data);
            setGameStatus('finished');
        });

        return () => {
            socket.off('game_status');
            socket.off('kalimat_start');
            socket.off('kalimat_update');
            socket.off('kalimat_reveal');
        };
    }, [socket]);

    const handleKeyPress = (char) => {
        if (targetReached || gameStatus !== 'playing') return;

        if (char === 'حذف') {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (char === 'إرسال') {
            if (currentGuess.length === 5) {
                socket.emit('kalimat_guess', { roomId, guess: currentGuess });
            }
        } else {
            if (currentGuess.length < 5) {
                setCurrentGuess(prev => prev + char);
            }
        }
    };

    const handleNewGame = () => {
        socket.emit('start_game', roomId);
    };

    const handleLeave = () => {
        window.location.href = '/';
    };

    if (gameStatus === 'waiting') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
                    <p className="text-teal-400 font-bold animate-pulse">جاري تجهيز الكلمات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-['Cairo'] flex flex-col p-4 md:p-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-teal-500 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-indigo-500 blur-[150px] rounded-full"></div>
            </div>

            <header className="flex justify-between items-center mb-8 relative z-10 max-w-2xl mx-auto w-full">
                <button onClick={handleLeave} className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 p-3 rounded-2xl transition-all active:scale-90 border border-slate-700/50">🏠 خروج</button>
                <div className="flex flex-col items-center">
                    <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-400">كَلِمات</h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">تحدي فردي</p>
                </div>
                <div className="w-12 h-12 bg-teal-500/10 rounded-2xl border border-teal-500/20 flex items-center justify-center text-xl">📝</div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 mb-32 md:mb-0">
                {/* Wordle Grid */}
                <div className="flex flex-col gap-2 scale-90 md:scale-100">
                    {[...Array(8)].map((_, rowIndex) => {
                        const attempt = attempts[rowIndex];
                        const isCurrentRow = rowIndex === attempts.length;
                        const chars = attempt ? attempt.guess.split('') : (isCurrentRow ? currentGuess.padEnd(5, ' ').split('') : Array(5).fill(' '));

                        return (
                            <div key={rowIndex} className="flex gap-2 flex-row-reverse">
                                {chars.map((char, charIndex) => {
                                    let colorClass = COLORS.empty;
                                    if (attempt) {
                                        colorClass = COLORS[attempt.hints[4 - charIndex]] || COLORS.wrong;
                                    } else if (isCurrentRow && char !== ' ') {
                                        colorClass = COLORS.active;
                                    }

                                    return (
                                        <div
                                            key={charIndex}
                                            className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-2xl md:text-3xl font-black rounded-xl border-2 transition-all duration-500 ${colorClass} ${attempt ? 'scale-100 rotate-0 shadow-lg' : 'scale-95'}`}
                                            style={{ transitionDelay: `${charIndex * 150}ms` }}
                                        >
                                            {char === ' ' ? '' : char}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Bottom Keyboard */}
            <footer className="fixed bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-20">
                <div className="max-w-3xl mx-auto flex flex-col gap-2">
                    {ARABIC_KEYBOARD.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex justify-center gap-1 md:gap-2">
                            {row.map(char => {
                                const isAction = char === 'إرسال' || char === 'حذف';
                                return (
                                    <button
                                        key={char}
                                        onClick={() => handleKeyPress(char)}
                                        className={`h-12 md:h-14 px-2 md:px-4 rounded-lg md:rounded-xl font-bold transition-all active:scale-95 shadow-lg border-b-4 ${isAction ? 'bg-indigo-600 border-indigo-800 hover:bg-indigo-500 flex-1 max-w-[100px] text-sm md:text-base' : 'bg-slate-800 border-slate-950 hover:bg-slate-700 min-w-[32px] md:min-w-[48px]'}`}
                                    >
                                        {char}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </footer>

            {/* Solo Results Overlay */}
            {gameStatus === 'finished' && revealData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="max-w-md w-full bg-slate-900 border border-teal-500/30 rounded-[3rem] p-10 text-center shadow-[0_0_100px_rgba(20,184,166,0.2)]">
                        <p className="text-teal-400 font-bold uppercase tracking-widest text-sm mb-2">{guessed ? 'تهانينا! 🎉' : 'حظ أوفر المرة القادمة'}</p>
                        <h2 className="text-5xl font-black mb-8 text-white">
                            {guessed ? 'نجحت!' : 'انتهى!'}
                        </h2>

                        <p className="text-slate-400 mb-2">الكلمة السرية هي</p>
                        <div className="flex justify-center gap-3 mb-10">
                            {revealData.word.split('').reverse().map((c, i) => (
                                <div key={i} className="w-14 h-18 bg-teal-500 flex items-center justify-center text-4xl font-black rounded-2xl shadow-lg border-b-8 border-teal-700 animate-bounce" style={{ animationDelay: `${i * 100}ms` }}>{c}</div>
                            ))}
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-6 mb-10 border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400">المحاولات</span>
                                <span className="font-bold text-teal-400">{attempts.length} / 8</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">النتيجة</span>
                                <span className="font-bold text-amber-400">{guessed ? 100 - (attempts.length * 10) : 0} نقطة</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={handleLeave} className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold transition-all active:scale-95">الرئيسية</button>
                            <button onClick={handleNewGame} className="flex-1 bg-teal-600 hover:bg-teal-500 py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 border-b-4 border-teal-800">لعبة جديدة 🔄</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KalimatApp;
