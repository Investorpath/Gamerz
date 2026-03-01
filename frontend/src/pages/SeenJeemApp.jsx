import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

// Connect to backend
import { BACKEND_URL } from '../config';

function SeenJeemApp() {
    const { user } = useAuth();
    const socket = useSocket();
    const [inRoom, setInRoom] = useState(false);
    const [roomId, setRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, revealing_answer, finished
    const [players, setPlayers] = useState([]);
    const [hostId, setHostId] = useState(null);
    const [timer, setTimer] = useState(0);

    // Seen Jeem Specific State
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [myAnswer, setMyAnswer] = useState('');
    const [hasAnswered, setHasAnswered] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [notifications, setNotifications] = useState([]);

    const inputRef = useRef(null);

    // Setup Socket
    useEffect(() => {
        if (user && !playerName) {
            setPlayerName(user.displayName);
        }

        if (!socket) return;

        socket.on('update_players', (playersList) => setPlayers(playersList));
        socket.on('game_status', (status) => setGameStatus(status));
        socket.on('room_host', (id) => setHostId(id));
        socket.on('timer', (t) => setTimer(t));
        socket.on('game_error', (msg) => {
            alert(msg);
            setInRoom(false); // Reset state if join or game fails
        });

        // Question Events
        socket.on('seenjeem_new_question', (qData) => {
            setCurrentQuestion(qData);
            setMyAnswer('');
            setHasAnswered(false);
            setCorrectAnswer('');
            setNotifications([]);
            // Auto-focus input when new question appears
            setTimeout(() => inputRef.current?.focus(), 100);
        });

        socket.on('seenjeem_reveal', (answer) => {
            setCorrectAnswer(answer);
        });

        socket.on('seenjeem_correct_guess', ({ playerName, points }) => {
            setNotifications(prev => [...prev, `${playerName} أجاب إجابة صحيحة ! (+${points})`]);
        });

        return () => {
            socket.off('update_players');
            socket.off('game_status');
            socket.off('room_host');
            socket.off('timer');
            socket.off('game_error');
            socket.off('seenjeem_new_question');
            socket.off('seenjeem_reveal');
            socket.off('seenjeem_correct_guess');
        };
    }, [user, socket]); // Re-run if user or socket changes

    const handleJoinOrCreate = (e) => {
        e.preventDefault();
        if (roomId && playerName && socket) {
            socket.emit('join_room', { roomId, playerName, gameType: 'seenjeem', userId: user?.id });
            setInRoom(true);
        }
    };

    const handleStartGame = () => {
        socket.emit('start_game', roomId);
    };

    const handleLeave = () => {
        if (window.confirm("هل أنت متأكد من مغادرة اللعبة؟")) {
            if (socket) socket.disconnect();
            window.location.href = '/';
        }
    };

    const submitAnswer = (e) => {
        e.preventDefault();
        if (!myAnswer.trim() || hasAnswered) return;

        socket.emit('seenjeem_submit_answer', { roomId, textAnswer: myAnswer });
        setHasAnswered(true);
    };

    if (!inRoom) {
        // Landing / Create Room View
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 text-white font-['Cairo'] relative overflow-hidden rtl">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/20 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[120px]"></div>
                </div>

                <button onClick={() => window.location.href = '/'} className="absolute top-6 left-6 bg-slate-800/80 hover:bg-slate-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg backdrop-blur-sm transition-transform active:scale-95 z-50 flex items-center gap-2 border border-slate-600/50">
                    <span>⬅️</span> العودة للرئيسية
                </button>

                <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-8 md:p-10 shadow-[0_0_50px_rgba(236,72,153,0.3)] border border-pink-500/20 z-10 mt-12">

                    <div className="text-center mb-10">
                        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 pb-2 text-transparent bg-clip-text bg-gradient-to-b from-pink-300 to-rose-500 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-tight">
                            سين جيم
                        </h1>
                        <p className="text-indigo-200 text-lg md:text-xl font-medium">الأسرع في الكتابة هو الفائز!</p>
                    </div>

                    <form onSubmit={handleJoinOrCreate} className="space-y-6">
                        <div className="space-y-2 relative">
                            <label className="block text-pink-300 font-bold text-sm px-2">اسم اللاعب</label>
                            <input
                                type="text"
                                placeholder="اكتب اسمك هنا..."
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                disabled={!!user}
                                className={`w-full text-white text-lg rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-slate-500 border transition-all shadow-inner ${user ? 'bg-slate-700/50 border-slate-600 cursor-not-allowed opacity-80' : 'bg-slate-800/80 border-slate-700'}`}
                                required
                            />
                            {user && <span className="absolute left-4 top-1/2 mt-1 text-pink-400 text-sm">✓ مسجل</span>}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between px-2">
                                <label className="text-pink-300 font-bold text-sm">رمز الغرفة</label>
                                <button type="button" onClick={() => setRoomId(Math.random().toString(36).substring(2, 8).toUpperCase())} className="text-xs text-indigo-300 hover:text-white transition-colors bg-indigo-900/50 px-2 rounded">إنشاء رمز عشوائي</button>
                            </div>
                            <input
                                type="text"
                                placeholder="مثلاً: A1B2C3"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                className="w-full bg-slate-800/80 text-white text-lg rounded-2xl px-5 py-4 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-slate-500 transition-all uppercase tracking-widest dir-ltr font-mono"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] text-white font-bold text-xl py-4 px-6 rounded-2xl shadow-lg transform transition-all active:scale-95 border border-pink-400/30"
                        >
                            دخول الغرفة 🚪
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (gameStatus === 'waiting') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white font-['Cairo'] relative rtl">
                <button onClick={handleLeave} className="absolute top-6 right-6 bg-rose-600/80 hover:bg-rose-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg backdrop-blur-sm transition-transform active:scale-95 z-50 flex items-center gap-2 border border-rose-400/30">
                    <span>مغادرة</span> 🚪
                </button>

                <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-pink-500/30 text-center mt-12">
                    <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-l from-pink-400 to-rose-200">غرفة الانتظار (سين جيم)</h1>
                    <p className="text-lg text-indigo-200 mb-2">رمز الغرفة: <span className="font-mono text-2xl font-bold text-pink-400 bg-pink-900/30 px-3 py-1 rounded inline-block dir-ltr tracking-widest">{roomId}</span></p>
                    <p className="text-sm text-slate-400 mb-8">شارك هذا الرمز مع أصدقائك للانضمام!</p>

                    <div className="bg-slate-700/50 rounded-2xl p-4 mb-8">
                        <h2 className="text-xl font-bold text-pink-300 mb-4 border-b border-slate-600 pb-2">اللاعبون المتصلون: {players.length}</h2>
                        <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {players.map((p, idx) => (
                                <li key={idx} className="bg-slate-800 text-slate-200 py-2 px-4 rounded-xl flex items-center shadow-inner text-lg">
                                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center -ms-2 me-3 shadow-md border-2 border-slate-800">👤</span>
                                    {p.name}
                                </li>
                            ))}
                            {players.length === 0 && <li className="text-slate-500 text-sm">لا يوجد لاعبين حتى الآن...</li>}
                        </ul>
                    </div>

                    {socket?.id === hostId ? (
                        <button
                            onClick={handleStartGame}
                            disabled={players.length < 1}
                            className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xl py-4 px-6 rounded-2xl shadow-lg shadow-pink-500/30 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            🚀 ابدأ اللعبة الآن
                        </button>
                    ) : (
                        <p className="text-slate-400 font-medium bg-slate-800/50 py-4 rounded-2xl border border-slate-700">ننتظر مضيف الغرفة لبدء اللعبة...</p>
                    )}
                </div>
            </div>
        );
    }

    if (gameStatus === 'playing' || gameStatus === 'revealing_answer') {
        const myPlayer = players.find(p => p.name === playerName);

        return (
            <div className="min-h-screen flex flex-col bg-slate-950 text-white font-['Cairo'] pb-12 rtl">
                {/* Header Navbar */}
                <div className="w-full bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
                    <div className="flex items-center gap-4">
                        <button onClick={handleLeave} className="bg-rose-600 text-white hover:bg-rose-500 px-4 py-2 rounded-xl text-sm font-bold transition-colors">مغادرة</button>
                        <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-sm hidden md:block">
                            <span className="text-slate-400">رمز الغرفة: </span>
                            <span className="font-mono text-pink-400 tracking-widest">{roomId}</span>
                        </div>
                    </div>
                    {myPlayer && (
                        <div className="bg-indigo-900/50 border border-indigo-500/30 px-4 py-2 rounded-xl shadow-inner text-center">
                            <span className="block text-indigo-300 text-xs font-bold uppercase tracking-wider mb-0.5">نقاطك</span>
                            <span className="block text-xl font-black text-white leading-none">{myPlayer.score}</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">

                    {/* Main Game Area */}
                    <div className="flex-1 flex flex-col items-center">
                        <div className="w-full max-w-3xl">

                            {/* Timer */}
                            <div className="mb-6 w-full flex justify-center">
                                <div className={`relative flex items-center justify-center w-24 h-24 rounded-full border-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${timer <= 5 ? 'border-rose-500 text-rose-400 animate-pulse bg-rose-950/30' : 'border-indigo-500 text-indigo-300 bg-slate-900/80 shadow-indigo-500/20'} transition-colors duration-500`}>
                                    <span className="text-4xl font-black font-mono tracking-tighter drop-shadow-md">{timer}</span>
                                </div>
                            </div>

                            {/* Question Card */}
                            {currentQuestion && (
                                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-10 text-center shadow-xl relative overflow-hidden mb-8 w-full">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-500"></div>
                                    <span className="inline-block bg-slate-800 text-pink-400 px-4 py-1 rounded-full text-sm font-bold mb-6 border border-slate-700 shadow-sm">
                                        {currentQuestion.category}
                                    </span>
                                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-sm mb-4">
                                        {currentQuestion.question}
                                    </h2>
                                </div>
                            )}

                            {/* Notifications / Live Feed */}
                            <div className="w-full mb-6 space-y-2 max-h-32 overflow-y-auto">
                                {notifications.map((msg, i) => (
                                    <div key={i} className="bg-green-900/30 border border-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm font-bold text-center animate-fade-in mx-auto max-w-md">
                                        {msg}
                                    </div>
                                ))}
                            </div>

                            {/* Answer Input Area */}
                            {gameStatus === 'playing' ? (
                                <form onSubmit={submitAnswer} className="w-full max-w-2xl mx-auto flex flex-col gap-4">
                                    <input
                                        type="text"
                                        placeholder="اكتب إجابتك هنا بأسرع ما يمكن..."
                                        value={myAnswer}
                                        onChange={(e) => setMyAnswer(e.target.value)}
                                        disabled={hasAnswered}
                                        className={`w-full bg-slate-800 text-white text-2xl text-center rounded-2xl px-6 py-5 border-2 ${hasAnswered ? 'border-slate-600 opacity-50 cursor-not-allowed' : 'border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/30'} shadow-lg transition-all`}
                                        ref={inputRef}
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={hasAnswered || !myAnswer.trim()}
                                        className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-black text-2xl py-4 rounded-2xl shadow-xl transition-all active:scale-95 border-b-4 border-rose-800 disabled:border-none uppercase tracking-wide"
                                    >
                                        {hasAnswered ? 'تم إرسال الإجابة ✅' : 'إرسال الإجابة! 🚀'}
                                    </button>
                                </form>
                            ) : (
                                <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                                    <div className="bg-emerald-900/40 border-2 border-emerald-500/50 rounded-2xl p-8 w-full text-center shadow-xl mb-4 transform scale-105 transition-transform">
                                        <h3 className="text-emerald-400 font-bold mb-2">الإجابة الصحيحة هي</h3>
                                        <p className="text-4xl md:text-5xl font-black text-white">{correctAnswer}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Leaderboard */}
                    <div className="w-full md:w-64 lg:w-80 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col self-start shrink-0">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h3 className="text-lg font-bold text-pink-400 flex items-center gap-2">🏆 الترتيب المباشر</h3>
                            <span className="bg-slate-800 text-xs px-2 py-1 rounded text-slate-400 font-mono">{players.length}</span>
                        </div>
                        <ul className="space-y-2 overflow-y-auto custom-scrollbar flex-1 max-h-[60vh]">
                            {[...players].sort((a, b) => b.score - a.score).map((p, idx) => (
                                <li key={idx} className={`flex justify-between items-center p-3 rounded-xl transition-colors ${p.name === playerName ? 'bg-indigo-900/40 border border-indigo-500/30' : 'bg-slate-800/50 hover:bg-slate-800'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${idx === 0 ? 'bg-yellow-500 text-yellow-900' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-700 text-slate-300'}`}>
                                            {idx + 1}
                                        </div>
                                        <span className={`font-bold truncate max-w-[100px] md:max-w-xs ${p.name === playerName ? 'text-white' : 'text-slate-300'}`}>{p.name}</span>
                                        {/* Status Indicator */}
                                        {p.answerSubmitted && gameStatus === 'playing' ? (
                                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                                        ) : null}
                                    </div>
                                    <span className="font-black text-pink-400 font-mono text-lg">{p.score}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        );
    }

    if (gameStatus === 'finished') {
        const sorted = [...players].sort((a, b) => b.score - a.score);
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-white font-['Cairo'] rtl relative z-10">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-500 drop-shadow-lg">نهاية اللعبة!</h1>
                    <p className="text-xl md:text-2xl text-indigo-200">إليك الترتيب النهائي للغرفة العبقرية</p>
                </div>

                <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 md:p-10 shadow-2xl border border-indigo-500/30">
                    <ul className="space-y-4">
                        {sorted.map((p, idx) => (
                            <li key={idx} className={`flex justify-between items-center p-4 rounded-2xl ${idx === 0 ? 'bg-gradient-to-r from-yellow-600/40 to-amber-500/40 border border-yellow-500/50 scale-105 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'bg-slate-800/80 border border-slate-700'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">{idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👏'}</div>
                                    <div>
                                        <span className={`block font-bold text-xl ${p.name === playerName ? 'text-white' : 'text-slate-200'}`}>{p.name} {p.name === playerName && '(أنت)'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-3xl font-black text-pink-400 font-mono">{p.score}</span>
                                    <span className="text-xs text-slate-400 uppercase tracking-widest">نقطة</span>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={handleLeave}
                        className="w-full mt-10 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl py-4 rounded-xl shadow-lg transition-transform active:scale-95 border border-slate-600"
                    >
                        العودة للصفحة الرئيسية
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

export default SeenJeemApp;
