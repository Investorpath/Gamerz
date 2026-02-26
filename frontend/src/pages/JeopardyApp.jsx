import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function JeopardyApp() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [inRoom, setInRoom] = useState(false);
    const [players, setPlayers] = useState([]);

    // Game States: waiting, board, question_active, answering
    const [gameStatus, setGameStatus] = useState('waiting');

    const [boardState, setBoardState] = useState([]);
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [buzzerInfo, setBuzzerInfo] = useState(null); // { playerId, playerName }
    const [options, setOptions] = useState(null);
    const [hostId, setHostId] = useState(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('update_players', (playersList) => setPlayers(playersList));
        newSocket.on('game_status', (status) => setGameStatus(status));
        newSocket.on('room_host', (id) => setHostId(id));
        newSocket.on('game_error', (msg) => {
            alert(msg);
            setInRoom(false);
        });

        newSocket.on('jeopardy_board', (board) => {
            setBoardState(board);
            setActiveQuestion(null);
            setBuzzerInfo(null);
            setOptions(null);
        });

        newSocket.on('jeopardy_active_question', (qData) => {
            setActiveQuestion(qData);
            setBuzzerInfo(null);
            setOptions(null);
        });

        newSocket.on('jeopardy_buzzed', (info) => {
            setBuzzerInfo(info);
        });

        newSocket.on('jeopardy_options', (opts) => {
            setOptions(opts);
        });

        return () => newSocket.close();
    }, []);

    const joinRoom = (e) => {
        e.preventDefault();
        if (roomId.trim() && socket && user) {
            socket.emit('join_room', { roomId, playerName: user.displayName, gameType: 'jeopardy', userId: user.id });
            setInRoom(true);
        }
    };

    const startGame = () => { if (socket) socket.emit('start_game', roomId); };

    const generateRoomId = () => {
        const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomId(randomId);
    };

    const selectQuestion = (catIdx, qIdx) => {
        if (socket && gameStatus === 'board') {
            socket.emit('jeopardy_select_question', { roomId, categoryIndex: catIdx, questionIndex: qIdx });
        }
    };

    const buzzIn = () => {
        if (socket && gameStatus === 'question_active') {
            socket.emit('jeopardy_buzz', roomId);
        }
    };

    const submitAnswer = (index) => {
        console.log("Submit Answer Clicked! Index:", index);
        console.log("Game Status:", gameStatus);
        console.log("Socket ID:", socket?.id);
        console.log("Buzzer Info:", buzzerInfo);

        try {
            if (socket && gameStatus === 'answering' && buzzerInfo?.playerId === socket.id) {
                console.log("Emitting jeopardy_answer...");
                socket.emit('jeopardy_answer', { roomId, answerIndex: index });
            } else {
                console.warn("Conditions not met to emit answer");
            }
        } catch (e) {
            console.error("Error in submitAnswer", e);
        }
    };

    const handleLeave = () => {
        if (window.confirm("هل أنت متأكد من مغادرة اللعبة؟")) {
            if (socket) socket.disconnect();
            window.location.href = '/';
        }
    };

    if (!inRoom) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-['Cairo'] relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6bTAgMHY0MGgxVjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-30"></div>
                <div className="bg-slate-900 border border-slate-700/50 p-8 rounded-3xl shadow-2xl z-10 w-full max-w-md backdrop-blur-sm">
                    <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white mb-6 block transition-colors">
                        &larr; العودة للرئيسية
                    </button>
                    <div className="text-center mb-8">
                        <span className="text-6xl mb-4 block">📺</span>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">سؤال وجواب</h2>
                        <p className="text-slate-400 mt-2 text-sm">اختر الفئة والقيمة، واضغط الزر أسرع من أصدقائك!</p>
                    </div>
                    <form onSubmit={joinRoom} className="space-y-4">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="رمز الغرفة (مثال: JEP123)"
                                className="w-full bg-slate-800 border-2 border-slate-700 text-white p-4 rounded-xl text-center text-lg focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder-slate-500 font-mono tracking-widest uppercase dir-ltr"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                required
                            />
                            <button
                                type="button"
                                onClick={generateRoomId}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl whitespace-nowrap shadow-lg transition-all active:scale-95 border-2 border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center text-sm"
                            >
                                <span className="text-xl mb-1">🎲</span>
                                جديد
                            </button>
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-[0.98] transition-all">
                            دخول الغرفة
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-['Cairo'] flex flex-col items-center">
            {/* Header */}
            <header className="w-full max-w-6xl flex justify-between items-center mb-8 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center gap-2">
                        <span>📺</span> سؤال وجواب
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">غرفة: <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">{roomId}</span></p>
                </div>
                <div className="flex items-center gap-6">
                    {/* Inline Scoreboard for header */}
                    <div className="hidden md:flex gap-4">
                        {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <span className="text-xs text-slate-400">{p.name}</span>
                                <span className={`font-mono font-bold text-lg ${p.score < 0 ? 'text-red-400' : 'text-green-400'}`}>{p.score || 0}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleLeave} className="bg-red-900/40 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors">
                        مغادرة
                    </button>
                </div>
            </header>

            <main className="w-full max-w-6xl flex-1 flex flex-col items-center justify-center relative">

                {gameStatus === 'waiting' && (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-lg text-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                        <h2 className="text-2xl font-bold mb-4">في الانتظار...</h2>
                        <ul className="mb-8 text-right space-y-2">
                            {players.map((p, i) => (
                                <li key={i} className="bg-slate-800 p-3 rounded-lg border border-slate-700 font-medium">
                                    👤 {p.name}
                                </li>
                            ))}
                        </ul>
                        {socket?.id === hostId ? (
                            <button
                                onClick={startGame}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl text-xl shadow-lg active:scale-95 transition-all"
                            >
                                بدء اللعبة الان
                            </button>
                        ) : (
                            <p className="text-slate-400 font-medium">ننتظر مضيف الغرفة لبدء اللعبة...</p>
                        )}
                    </div>
                )}

                {gameStatus === 'board' && boardState.length > 0 && (
                    <div className="w-full overflow-x-auto pb-4">
                        <div className="grid gap-2 md:gap-4" style={{ gridTemplateColumns: `repeat(${boardState.length}, minmax(150px, 1fr))` }}>
                            {/* Categories Row */}
                            {boardState.map((col, i) => (
                                <div key={`cat-${i}`} className="bg-blue-900/80 text-blue-100 font-bold text-center py-4 px-2 rounded-t-xl border-b-4 border-blue-950 uppercase tracking-wide text-sm md:text-base h-20 flex items-center justify-center">
                                    {col.category}
                                </div>
                            ))}

                            {/* Questions Rows */}
                            {boardState[0].questions.map((_, rowIdx) => (
                                <React.Fragment key={`row-${rowIdx}`}>
                                    {boardState.map((col, colIdx) => {
                                        const q = col.questions[rowIdx];
                                        return (
                                            <button
                                                key={`cell-${colIdx}-${rowIdx}`}
                                                onClick={() => selectQuestion(colIdx, rowIdx)}
                                                disabled={q.answered}
                                                className={`
                                                    h-24 md:h-32 text-3xl md:text-5xl font-mono font-black flex items-center justify-center rounded-lg transition-all
                                                    ${q.answered
                                                        ? 'bg-slate-900 text-slate-800 border-2 border-slate-800/50 cursor-not-allowed opacity-50'
                                                        : 'bg-indigo-600 focus:bg-indigo-500 hover:bg-indigo-500 hover:scale-[1.02] text-yellow-400 border-2 border-indigo-500 shadow-lg cursor-pointer'
                                                    }
                                                `}
                                                style={!q.answered ? { textShadow: '2px 2px 4px rgba(0,0,0,0.5)' } : {}}
                                            >
                                                {!q.answered ? q.points : ''}
                                            </button>
                                        )
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                {(gameStatus === 'question_active' || gameStatus === 'answering') && activeQuestion && (
                    <div className="w-full max-w-4xl bg-blue-950 border-4 border-blue-900 rounded-3xl p-8 md:p-16 shadow-2xl relative text-center">
                        {/* Overlay if someone else is answering */}
                        {gameStatus === 'answering' && buzzerInfo?.playerId !== socket.id && (
                            <div className="absolute inset-x-0 -top-6 flex justify-center z-20">
                                <div className="bg-yellow-500 text-black font-black px-8 py-2 rounded-full shadow-lg border-4 border-slate-950 animate-bounce">
                                    {buzzerInfo.playerName} يجاوب الآن!
                                </div>
                            </div>
                        )}

                        <div className="mb-4 text-blue-300 font-bold text-lg md:text-xl uppercase tracking-widest">
                            {activeQuestion.category} - {activeQuestion.points}
                        </div>

                        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-12 drop-shadow-md">
                            {activeQuestion.question}
                        </h2>

                        {activeQuestion.missedBy && (
                            <p className="text-red-400 mb-4 font-bold">أخطأ {activeQuestion.missedBy}! يمكنك الإجابة الآن.</p>
                        )}

                        {gameStatus === 'question_active' && (
                            <button
                                onClick={buzzIn}
                                className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-black text-4xl shadow-[0_20px_0_rgba(153,27,27,1),0_20px_20px_rgba(0,0,0,0.5)] active:translate-y-4 active:shadow-[0_4px_0_rgba(153,27,27,1),0_4px_4px_rgba(0,0,0,0.5)] transition-all flex flex-col items-center justify-center mx-auto border-8 border-red-900"
                            >
                                اضغط!
                            </button>
                        )}

                        {gameStatus === 'answering' && buzzerInfo?.playerId === socket.id && options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                {options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => submitAnswer(i)}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-6 px-4 rounded-xl text-xl md:text-2xl shadow-lg border-2 border-indigo-400 transition-all text-center"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {gameStatus === 'answering' && buzzerInfo?.playerId !== socket.id && (
                            <div className="mt-8 text-slate-400 font-medium text-lg">
                                ننتظر إجابة {buzzerInfo.playerName}...
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
}

export default JeopardyApp;
