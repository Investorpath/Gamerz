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
    correct: 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    misplaced: 'bg-amber-500 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    wrong: 'bg-slate-700 border-slate-600 text-slate-300',
    empty: 'bg-slate-800/40 border-slate-700/50',
    active: 'bg-slate-800 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] ring-2 ring-indigo-500/20'
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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center font-['Cairo']" dir="rtl">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-teal-500"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
                    </div>
                    <p className="text-teal-400 font-bold animate-pulse text-lg">جاري تجهيز الكلمات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-['Cairo'] flex flex-col p-4 md:p-8 relative overflow-hidden" dir="rtl">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500 blur-[120px] rounded-full"></div>
            </div>

            <header className="flex justify-between items-center mb-6 relative z-10 max-w-2xl mx-auto w-full">
                <button onClick={handleLeave} className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-all active:scale-90 border border-slate-700/50 backdrop-blur-sm">🏠 خروج</button>
                <div className="flex flex-col items-center">
                    <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-400 drop-shadow-sm">كَلِمات</h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">لعبة التحدي العربي</p>
                </div>
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center text-xl shadow-inner">🏆</div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-start pt-4 relative z-10 overflow-y-auto pb-48 md:pb-0">
                {/* Wordle Grid */}
                <div className="flex flex-col gap-2 scale-95 md:scale-100 mb-8">
                    {[...Array(8)].map((_, rowIndex) => {
                        const attempt = attempts[rowIndex];
                        const isCurrentRow = rowIndex === attempts.length;
                        // Use padEnd since we are in dir="rtl", so first letters appear on the right
                        const chars = attempt ? attempt.guess.split('') : (isCurrentRow ? currentGuess.split('').concat(Array(5 - currentGuess.length).fill(' ')) : Array(5).fill(' '));

                        return (
                            <div key={rowIndex} className="flex gap-2">
                                {chars.map((char, charIndex) => {
                                    let colorClass = COLORS.empty;
                                    if (attempt) {
                                        // Hints are 0-indexed from first letter (right in RTL)
                                        colorClass = COLORS[attempt.hints[charIndex]] || COLORS.wrong;
                                    } else if (isCurrentRow && charIndex < currentGuess.length) {
                                        colorClass = COLORS.active;
                                    }

                                    return (
                                        <div
                                            key={charIndex}
                                            className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-2xl md:text-3xl font-black rounded-xl border-2 transition-all duration-300 ${colorClass} ${attempt ? 'scale-100 rotate-0 animate-in flip-in-y' : char !== ' ' ? 'scale-105 border-indigo-400 ring-4 ring-indigo-500/10' : 'scale-100'}`}
                                            style={{ transitionDelay: `${charIndex * 100}ms` }}
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

            {/* Premium Bottom Keyboard */}
            <footer className="fixed bottom-0 left-0 w-full p-4 md:p-8 bg-gradient-to-t from-slate-950 via-slate-950/98 to-transparent z-20">
                <div className="max-w-3xl mx-auto flex flex-col gap-2 bg-slate-900/40 backdrop-blur-xl p-3 md:p-5 rounded-[2.5rem] border border-white/5 shadow-2xl">
                    {ARABIC_KEYBOARD.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex justify-center gap-1 md:gap-2">
                            {row.map(char => {
                                const isAction = char === 'إرسال' || char === 'حذف';
                                return (
                                    <button
                                        key={char}
                                        onClick={() => handleKeyPress(char)}
                                        className={`h-11 md:h-14 px-1 md:px-4 rounded-xl font-bold transition-all active:scale-95 shadow-md flex items-center justify-center ${isAction ? 'bg-indigo-600 hover:bg-indigo-500 text-white flex-1 max-w-[120px] text-xs md:text-base border-b-4 border-indigo-800' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 min-w-[30px] md:min-w-[48px] border-b-4 border-slate-950'}`}
                                    >
                                        {char === 'حذف' ? '⌫' : char}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </footer>

            {/* Solo Results Overlay */}
            {gameStatus === 'finished' && revealData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500" dir="rtl">
                    <div className="max-w-md w-full bg-slate-900 border border-teal-500/30 rounded-[3rem] p-8 text-center shadow-[0_0_100px_rgba(20,184,166,0.15)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-indigo-500"></div>

                        <p className="text-teal-400 font-bold uppercase tracking-widest text-xs mb-2">{guessed ? 'تهانينا! 🎉' : 'حظ أوفر المرة القادمة'}</p>
                        <h2 className="text-4xl font-black mb-6 text-white">
                            {guessed ? 'إجابة صحيحة!' : 'انتهت المحاولات'}
                        </h2>

                        <p className="text-slate-400 mb-4 text-sm font-medium">الكلمة السرية هي</p>
                        <div className="flex justify-center gap-2 mb-8">
                            {revealData.word.split('').map((c, i) => (
                                <div key={i} className="w-12 h-16 bg-teal-500 flex items-center justify-center text-3xl font-black rounded-xl shadow-lg border-b-4 border-teal-700 animate-bounce" style={{ animationDelay: `${i * 100}ms` }}>{c}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                                <p className="text-slate-500 text-xs mb-1">المحاولات</p>
                                <p className="text-xl font-black text-teal-400">{attempts.length} / 8</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                                <p className="text-slate-500 text-xs mb-1">النتيجة</p>
                                <p className="text-xl font-black text-amber-400">{guessed ? 100 - (attempts.length * 10) : 0}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleLeave} className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold transition-all active:scale-95 border-b-4 border-slate-950">الرئيسية</button>
                            <button onClick={handleNewGame} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 border-b-4 border-indigo-800">لعبة جديدة 🔄</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KalimatApp;
