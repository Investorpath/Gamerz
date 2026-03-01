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
    const [inRoom, setInRoom] = useState(false);
    const [roomId, setRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [gameStatus, setGameStatus] = useState('waiting');
    const [players, setPlayers] = useState([]);
    const [hostId, setHostId] = useState(null);

    // Game State
    const [attempts, setAttempts] = useState([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [guessed, setGuessed] = useState(false);
    const [targetReached, setTargetReached] = useState(false);
    const [revealData, setRevealData] = useState(null);
    const [otherPlayersProgress, setOtherPlayersProgress] = useState({});

    useEffect(() => {
        if (user && !playerName) setPlayerName(user.displayName);
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        socket.on('update_players', (playersList) => setPlayers(playersList));
        socket.on('game_status', (status) => setGameStatus(status));
        socket.on('room_host', (id) => setHostId(id));

        socket.on('kalimat_start', () => {
            setAttempts([]);
            setCurrentGuess('');
            setGuessed(false);
            setTargetReached(false);
            setRevealData(null);
            setOtherPlayersProgress({});
        });

        socket.on('kalimat_update', (data) => {
            setAttempts(data.attempts);
            setGuessed(data.guessed);
            setTargetReached(data.targetReached);
            if (data.guessed || data.targetReached) setCurrentGuess('');
        });

        socket.on('kalimat_progress', (data) => {
            setOtherPlayersProgress(prev => ({
                ...prev,
                [data.socketId]: { count: data.attemptsCount, guessed: data.guessed, name: data.playerName }
            }));
        });

        socket.on('kalimat_reveal', (data) => {
            setRevealData(data);
            setGameStatus('finished');
        });

        return () => {
            socket.off('update_players');
            socket.off('game_status');
            socket.off('room_host');
            socket.off('kalimat_start');
            socket.off('kalimat_update');
            socket.off('kalimat_progress');
            socket.off('kalimat_reveal');
        };
    }, [socket]);

    const handleJoinOrCreate = (e) => {
        e.preventDefault();
        if (socket && roomId && playerName) {
            socket.emit('join_room', { roomId, playerName, gameType: 'kalimat', userId: user?.id });
            setInRoom(true);
        }
    };

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

    const generateRoomId = () => {
        const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomId(randomId);
    };

    const handleStartGame = () => socket.emit('start_game', roomId);

    const handleLeave = () => {
        if (window.confirm("هل أنت متأكد من مغادرة اللعبة؟")) {
            socket.disconnect();
            window.location.href = '/';
        }
    };

    if (!inRoom) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white font-['Cairo'] relative overflow-hidden">
                <button onClick={() => window.location.href = '/'} className="absolute top-6 left-6 bg-slate-800/80 hover:bg-slate-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg backdrop-blur-sm transition-transform active:scale-95 z-50 flex items-center gap-2 border border-slate-600/50">
                    <span>⬅️</span> العودة للرئيسية
                </button>
                <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-teal-500/20 z-10">
                    <div className="text-center mb-10">
                        <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-teal-300 to-emerald-500">كلمات</h1>
                        <p className="text-teal-200 text-lg">تحدي الكلمات العربية اليومي</p>
                    </div>
                    <form onSubmit={handleJoinOrCreate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-teal-400 font-bold text-sm px-2">اسم اللاعب</label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                disabled={!!user}
                                className="w-full bg-slate-800/80 text-white text-lg rounded-2xl px-5 py-4 border border-slate-700 font-bold text-center"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-amber-400 font-bold text-sm px-2">رمز الغرفة</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                    className="w-full bg-slate-800/80 text-white text-lg rounded-2xl px-5 py-4 border border-slate-700 text-center tracking-widest font-mono"
                                    maxLength={6}
                                />
                                <button type="button" onClick={generateRoomId} className="bg-teal-600 hover:bg-teal-500 px-4 rounded-2xl text-2xl border border-teal-400 shadow-lg transition-all active:scale-90">🎲</button>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-2xl py-5 rounded-2xl shadow-xl transition-all active:scale-95">العب الآن 🎮</button>
                    </form>
                </div>
            </div>
        );
    }

    if (gameStatus === 'waiting') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white font-['Cairo'] relative">
                <button onClick={handleLeave} className="absolute top-6 left-6 bg-rose-600/80 p-3 rounded-xl border border-rose-400 transition-all active:scale-90">🏠 خروج</button>
                <div className="max-w-md w-full bg-slate-900 shadow-2xl rounded-3xl p-8 border border-teal-500/30 text-center">
                    <h1 className="text-3xl font-bold mb-4 text-teal-400">غرفة الانتظار</h1>
                    <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
                        <p className="text-slate-400 text-sm mb-1">شارك الكود مع أصدقائك:</p>
                        <p className="text-4xl font-mono font-black text-white tracking-[0.5em]">{roomId}</p>
                    </div>
                    <div className="space-y-2 mb-8">
                        {players.map(p => (
                            <div key={p.id} className="bg-slate-800/50 py-3 px-4 rounded-xl flex items-center gap-3 border border-slate-700">
                                <span className={`w-3 h-3 rounded-full ${p.id === hostId ? 'bg-amber-400 animate-pulse' : 'bg-teal-500'}`}></span>
                                <span className="font-bold">{p.name}</span>
                                {p.id === hostId && <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">المضيف</span>}
                            </div>
                        ))}
                    </div>
                    {socket?.id === hostId ? (
                        <button onClick={handleStartGame} className="w-full bg-teal-600 hover:bg-teal-500 py-4 rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">ابدأ اللعبة 🚀</button>
                    ) : (
                        <p className="text-slate-500 animate-pulse">بانتظار المضيف لبدء اللعبة...</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-['Cairo'] flex flex-col p-4 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-teal-500 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-indigo-500 blur-[150px] rounded-full"></div>
            </div>

            <header className="flex justify-between items-center mb-8 relative z-10">
                <button onClick={handleLeave} className="text-slate-400 hover:text-white transition-colors">🚪 خروج</button>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-400">كَلِمات</h1>
                <div className="text-right">
                    <p className="text-xs text-slate-500">الغرفة</p>
                    <p className="font-mono font-bold text-teal-500 tracking-wider text-lg">{roomId}</p>
                </div>
            </header>

            <main className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center relative z-10 mb-24 md:mb-0">
                {/* Left Side: Players Progress */}
                <aside className="hidden lg:flex flex-col gap-4 w-64 bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800 backdrop-blur-md">
                    <h3 className="text-xl font-bold mb-2 border-b border-slate-800 pb-2">المنافسون</h3>
                    {players.map(p => {
                        const progress = otherPlayersProgress[p.id] || { count: 0, guessed: false };
                        return (
                            <div key={p.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${progress.guessed ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-800/30 border-transparent'}`}>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm truncate w-24">{p.id === socket.id ? '(أنت) ' + p.name : p.name}</span>
                                    <span className="text-[10px] text-slate-500">محاولات: {progress.count}/8</span>
                                </div>
                                <div className="flex gap-1">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className={`w-1.5 h-3 rounded-full ${i < progress.count ? (progress.guessed && i === progress.count - 1 ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-slate-600') : 'bg-slate-800'}`}></div>
                                    ))}
                                </div>
                                {progress.guessed && <span className="text-lg">✅</span>}
                            </div>
                        );
                    })}
                </aside>

                {/* Center: Wordle Grid */}
                <div className="flex flex-col gap-2">
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
                                            className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-2xl md:text-3xl font-black rounded-xl border-2 transition-all duration-500 ${colorClass} ${attempt ? 'scale-100 rotate-0' : 'scale-95'}`}
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

                {/* Mobile Players View */}
                <div className="lg:hidden flex gap-2 overflow-x-auto w-full max-w-sm py-2">
                    {players.map(p => {
                        const prog = otherPlayersProgress[p.id] || { count: 0, guessed: false };
                        return (
                            <div key={p.id} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${prog.guessed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                {p.name}: {prog.count}/8 {prog.guessed && '✅'}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Bottom: Keyboard */}
            <footer className="fixed bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-slate-950 to-transparent z-20">
                <div className="max-w-3xl mx-auto flex flex-col gap-2">
                    {ARABIC_KEYBOARD.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex justify-center gap-1 md:gap-2">
                            {row.map(char => {
                                const isAction = char === 'إرسال' || char === 'حذف';
                                return (
                                    <button
                                        key={char}
                                        onClick={() => handleKeyPress(char)}
                                        className={`h-12 md:h-14 px-2 md:px-4 rounded-lg md:rounded-xl font-bold transition-all active:scale-95 shadow-lg border-b-4 ${isAction ? 'bg-indigo-600 border-indigo-800 hover:bg-indigo-500 flex-1 max-w-[80px]' : 'bg-slate-800 border-slate-950 hover:bg-slate-700 min-w-[32px] md:min-w-[44px]'}`}
                                    >
                                        {char}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </footer>

            {/* Results Overlay */}
            {gameStatus === 'finished' && revealData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="max-w-lg w-full bg-slate-900 border border-teal-500/30 rounded-[3rem] p-10 text-center shadow-[0_0_100px_rgba(20,184,166,0.2)]">
                        <p className="text-teal-400 font-bold uppercase tracking-widest text-sm mb-2">انتهت اللعبة</p>
                        <h2 className="text-2xl mb-2 text-slate-400">الكلمة هي</h2>
                        <div className="flex justify-center gap-3 mb-10">
                            {revealData.word.split('').reverse().map((c, i) => (
                                <div key={i} className="w-14 h-18 bg-teal-500 flex items-center justify-center text-4xl font-black rounded-2xl shadow-lg border-b-8 border-teal-700 animate-bounce" style={{ animationDelay: `${i * 100}ms` }}>{c}</div>
                            ))}
                        </div>

                        <div className="space-y-4 mb-10">
                            {revealData.results.sort((a, b) => b.score - a.score).map((res, i) => (
                                <div key={i} className={`flex items-center justify-between p-4 rounded-3xl border ${res.guessed ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{i === 0 ? '👑' : i + 1}</span>
                                        <div className="text-right">
                                            <p className="font-bold">{res.name}</p>
                                            <p className="text-xs text-slate-500">{res.guessed ? `خمن في ${res.attempts} محاولات` : 'لم ينجح'}</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-black text-teal-400">{res.score}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => window.location.href = '/'} className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold transition-all active:scale-95">القائمة الرئيسية</button>
                            {socket?.id === hostId && (
                                <button onClick={handleStartGame} className="flex-1 bg-teal-600 hover:bg-teal-500 py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95">لعبة جديدة 🎮</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KalimatApp;
