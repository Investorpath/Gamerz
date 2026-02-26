import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Constants for the 4 button shapes/colors
const shapes = [
    { color: 'bg-red-500', hoverColor: 'hover:bg-red-600', icon: '🔺' },
    { color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', icon: '🔷' },
    { color: 'bg-yellow-400', hoverColor: 'hover:bg-yellow-500', icon: '🟡' },
    { color: 'bg-green-500', hoverColor: 'hover:bg-green-600', icon: '🟩' }
];

function CahootApp() {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [inRoom, setInRoom] = useState(false);
    const [gameState, setGameState] = useState('waiting');

    // Room Data
    const [players, setPlayers] = useState([]);
    const [hostId, setHostId] = useState(null);

    // Game Data
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [timer, setTimer] = useState(0);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [myAnswerIndex, setMyAnswerIndex] = useState(null);

    // Host metrics
    const [answersReceivedCount, setAnswersReceivedCount] = useState({ count: 0, total: 0 });

    // Custom Questions
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customQuestions, setCustomQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({
        question: '',
        options: ['', '', '', ''],
        answer: 0,
        category: 'مخصصة'
    });

    useEffect(() => {
        if (!token) return;

        const newSocket = io(SOCKET_URL, {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('Connected to socket server', newSocket.id);
        });

        newSocket.on('game_error', (msg) => {
            alert(msg);
        });

        newSocket.on('room_host', (hid) => {
            setHostId(hid);
        });

        newSocket.on('update_players', (playersList) => {
            setPlayers(playersList.sort((a, b) => b.score - a.score));
        });

        newSocket.on('game_status', (status) => {
            setGameState(status);
            if (status === 'question_active') {
                setHasAnswered(false);
                setCorrectAnswerIndex(null);
                setMyAnswerIndex(null);
                setAnswersReceivedCount({ count: 0, total: 0 });
            }
        });

        newSocket.on('timer', (t) => {
            setTimer(t);
        });

        newSocket.on('cahoot_question', (data) => {
            setCurrentQuestion(data);
        });

        newSocket.on('cahoot_answer_received', (data) => {
            setAnswersReceivedCount(data);
        });

        newSocket.on('cahoot_reveal', (answerIdx) => {
            setCorrectAnswerIndex(answerIdx);
        });

        newSocket.on('cahoot_podium', (finalPlayers) => {
            setPlayers(finalPlayers.sort((a, b) => b.score - a.score));
        });

        setSocket(newSocket);
        return () => newSocket.close();
    }, [token]);

    const handleCreateRoom = () => {
        const id = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomId(id);
        socket.emit('join_room', { roomId: id, playerName: user?.displayName, gameType: 'cahoot', userId: user?.id });
        setInRoom(true);
    };

    const handleJoinRoom = () => {
        if (!roomId.trim()) return;
        socket.emit('join_room', { roomId, playerName: user?.displayName, gameType: 'cahoot', userId: user?.id });
        setInRoom(true);
    };

    const startGame = () => {
        socket.emit('cahoot_start', roomId);
    };

    const submitAnswer = (idx) => {
        if (hasAnswered || gameState !== 'question_active') return;
        setHasAnswered(true);
        setMyAnswerIndex(idx);
        socket.emit('cahoot_submit_answer', { roomId, answerIndex: idx });
    };

    const nextQuestion = () => {
        socket.emit('cahoot_next_question', roomId);
    };

    const showLeaderboard = () => {
        socket.emit('cahoot_show_leaderboard', roomId);
    };

    const handleAddCustomQuestion = () => {
        if (!newQuestion.question.trim() || newQuestion.options.some(opt => !opt.trim())) {
            alert("يرجى ملء جميع الحقول والخيارات");
            return;
        }
        if (customQuestions.length >= 25) {
            alert("لا يمكنك إضافة أكثر من 25 سؤال");
            return;
        }
        setCustomQuestions([...customQuestions, { ...newQuestion }]);
        setNewQuestion({ question: '', options: ['', '', '', ''], answer: 0, category: 'مخصصة' });
    };

    const submitCustomQuestions = () => {
        if (customQuestions.length === 0) {
            alert("يرجى إضافة سؤال واحد على الأقل");
            return;
        }
        socket.emit('cahoot_set_questions', { roomId, customQuestions });
        setShowCustomModal(false);
    };

    const handleLeave = () => {
        if (window.confirm("هل أنت متأكد من مغادرة اللعبة؟")) {
            if (socket) socket.disconnect();
            window.location.href = '/';
        }
    };

    const isHost = socket && socket.id === hostId;

    if (!inRoom) {
        return (
            <div className="min-h-screen bg-slate-900 text-white font-['Cairo'] flex items-center justify-center p-4 relative">
                <button onClick={() => window.location.href = '/'} className="absolute top-6 left-6 bg-slate-800/80 hover:bg-slate-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg backdrop-blur-sm transition-transform active:scale-95 z-50 flex items-center gap-2 border border-slate-600/50">
                    <span>⬅️</span> العودة للرئيسية
                </button>
                <div className="bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border top border-purple-500/30">
                    <h1 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
                        كاهوت!
                    </h1>
                    <div className="space-y-4">
                        <button onClick={handleCreateRoom} className="w-full py-4 text-xl font-bold rounded-xl bg-purple-600 hover:bg-purple-700 transition">
                            إنشاء غرفة (مضيف)
                        </button>
                        <div className="flex items-center gap-2">
                            <hr className="flex-1 border-slate-700" />
                            <span className="text-slate-500 font-bold">أو</span>
                            <hr className="flex-1 border-slate-700" />
                        </div>
                        <input
                            type="text"
                            placeholder="رمز الغرفة (PIN)"
                            className="w-full p-4 text-center text-2xl font-bold bg-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            maxLength={6}
                        />
                        <button onClick={handleJoinRoom} className="w-full py-4 text-xl font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 transition">
                            دخول
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Rendering Host View ---
    if (isHost) {
        return (
            <div className="min-h-screen bg-slate-100 font-['Cairo'] flex flex-col relative overflow-hidden">
                {/* Header Navbar */}
                <div className="bg-white p-4 shadow-sm flex items-center z-10 w-full shrink-0 gap-4">
                    <button onClick={handleLeave} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2">
                        <span>⬅️</span> خروج
                    </button>
                    <div className="text-3xl font-black text-purple-600 tracking-tight flex-1">Cahoot!</div>
                    <div className="text-xl font-bold bg-slate-200 px-6 py-2 rounded-lg">رمز الغرفة: <span className="text-2xl font-black tracking-widest text-slate-800 uppercase">{roomId}</span></div>
                    <div className="text-lg font-bold text-slate-500 flex items-center gap-2 ml-4">
                        👥 {Object.keys(players).length - 1} لاعبين
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-8 w-full z-10 relative overflow-y-auto min-h-0">
                    {gameState === 'waiting' && currentQuestion === null && (
                        <div className="text-center animate-fade-in">
                            <h2 className="text-6xl font-extrabold text-slate-800 mb-8 drop-shadow-sm">في انتظار اللاعبين للانضمام...</h2>
                            <div className="flex gap-4 justify-center">
                                <button onClick={startGame} className="bg-purple-600 hover:bg-purple-700 text-white text-3xl font-bold py-6 px-16 rounded-2xl shadow-xl transition-transform hover:scale-105">
                                    ابدأ اللعبة!
                                </button>
                                <button onClick={() => setShowCustomModal(true)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xl font-bold py-6 px-8 rounded-2xl shadow-md transition-transform hover:scale-105 border-2 border-slate-300">
                                    إضافة أسئلة مخصصة ({customQuestions.length}/25)
                                </button>
                            </div>
                            <div className="mt-12 flex flex-wrap justify-center gap-4 max-w-4xl">
                                {players.filter(p => p.name !== user?.displayName).map((p, i) => (
                                    <div key={i} className="bg-white px-6 py-3 rounded-xl shadow-md text-xl font-bold text-slate-700">{p.name || 'لاعب'}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {gameState === 'question_active' && currentQuestion && (
                        <div className="w-full max-w-6xl mx-auto flex flex-col items-center animate-slide-up h-full justify-between pb-8">
                            <div className="text-center mb-8 w-full">
                                <span className="inline-block bg-purple-100 text-purple-700 px-4 py-1 rounded-full font-bold mb-4">{currentQuestion.category}</span>
                                <h2 className="text-4xl md:text-6xl font-bold text-slate-800 leading-tight p-8 bg-white shadow-lg rounded-3xl w-full">{currentQuestion.question}</h2>
                            </div>

                            <div className="flex items-center justify-between w-full px-8 mb-8">
                                <div className="text-7xl font-black text-purple-600 bg-purple-100 w-32 h-32 rounded-full flex items-center justify-center shadow-inner">
                                    {timer}
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-slate-800 mb-2">{answersReceivedCount.count}</div>
                                    <div className="text-lg font-bold text-slate-500 uppercase tracking-widest">إجابات</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                {currentQuestion.options.map((opt, i) => (
                                    <div key={i} className={`${shapes[i].color} text-white p-6 md:p-10 rounded-2xl shadow-lg flex items-center gap-6 transform transition`}>
                                        <div className="text-5xl md:text-7xl drop-shadow-md">{shapes[i].icon}</div>
                                        <div className="text-2xl md:text-4xl font-bold drop-shadow-sm flex-1">{opt}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {gameState === 'revealing_answer' && currentQuestion && (
                        <div className="w-full max-w-6xl mx-auto flex flex-col items-center h-full justify-start pt-12">
                            <h2 className="text-5xl font-extrabold text-slate-800 mb-12 bg-white/50 px-8 py-4 rounded-3xl">{currentQuestion.question}</h2>

                            <div className="grid grid-cols-2 gap-4 w-full mb-12 opacity-90">
                                {currentQuestion.options.map((opt, i) => {
                                    const isCorrect = correctAnswerIndex === i;
                                    return (
                                        <div key={i} className={`${shapes[i].color} ${!isCorrect ? 'opacity-30 grayscale' : 'ring-8 ring-white scale-105 z-10'} text-white p-8 rounded-2xl shadow-xl flex items-center gap-6 transition-all duration-500`}>
                                            <div className="text-6xl drop-shadow-md">{shapes[i].icon}</div>
                                            <div className="text-3xl font-bold drop-shadow-sm flex-1">{opt}</div>
                                            {isCorrect && <div className="text-5xl">✔️</div>}
                                        </div>
                                    )
                                })}
                            </div>

                            <button onClick={showLeaderboard} className="bg-slate-800 hover:bg-slate-900 text-white text-2xl font-bold py-4 px-12 rounded-xl shadow-lg self-end mt-auto">
                                عرض النتائج 🏆
                            </button>
                        </div>
                    )}

                    {gameState === 'leaderboard' && (
                        <div className="w-full max-w-4xl mx-auto flex flex-col items-center h-full justify-start pt-12 animate-fade-in">
                            <h2 className="text-5xl font-extrabold text-slate-800 mb-12 drop-shadow-sm">الترتيب الحالي 📊</h2>
                            <div className="w-full bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-4 mb-8">
                                {players.slice(0, 5).map((p, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-4">
                                            <span className="text-3xl font-black text-slate-400 w-8">{i + 1}</span>
                                            <span className="text-2xl font-bold text-slate-700">{p.name || 'مضيف'}</span>
                                        </div>
                                        <div className="text-2xl font-black text-purple-600">{p.score}</div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={nextQuestion} className="bg-purple-600 hover:bg-purple-700 text-white text-2xl font-bold py-4 px-12 rounded-xl shadow-lg self-end mt-auto">
                                السؤال التالي ➡️
                            </button>
                        </div>
                    )}

                    {gameState === 'finished' && (
                        <div className="text-center flex flex-col items-center justify-center h-full w-full">
                            <h2 className="text-6xl font-black text-slate-800 mb-16 drop-shadow-sm">المنصة النهائية! 🏆</h2>
                            <div className="flex items-end justify-center gap-6 h-80 max-w-4xl w-full">
                                {/* Rank 2 */}
                                {players[2] && (
                                    <div className="w-1/3 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                                        <div className="text-2xl font-bold text-slate-700 mb-2 truncate w-full flex-1 text-center">{players[2].name}</div>
                                        <div className="bg-slate-300 w-full h-40 rounded-t-lg shadow-inner flex flex-col items-center justify-start pt-4 relative overflow-hidden">
                                            <span className="text-5xl font-black text-slate-500 drop-shadow-md z-10">2</span>
                                            <span className="text-lg font-bold text-slate-600 mt-2 z-10">{players[2].score}</span>
                                            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent"></div>
                                        </div>
                                    </div>
                                )}
                                {/* Rank 1 */}
                                {players[1] && (
                                    <div className="w-1/3 flex flex-col items-center transform -translate-y-8 animate-slide-up" style={{ animationDelay: '1s' }}>
                                        <div className="text-6xl mb-4 animate-bounce">👑</div>
                                        <div className="text-3xl font-black text-yellow-500 mb-2 drop-shadow-sm truncate w-full text-center">{players[1].name}</div>
                                        <div className="bg-yellow-400 w-full h-56 rounded-t-lg shadow-lg flex flex-col items-center justify-start pt-4 relative overflow-hidden">
                                            <span className="text-7xl font-black text-yellow-100 drop-shadow-md z-10">1</span>
                                            <span className="text-xl font-bold text-yellow-900 mt-2 z-10">{players[1].score}</span>
                                            {/* Shine effect */}
                                            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform skew-x-12 animate-shine"></div>
                                        </div>
                                    </div>
                                )}
                                {/* Rank 3 */}
                                {players[3] && (
                                    <div className="w-1/3 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                        <div className="text-xl font-bold text-slate-700 mb-2 truncate w-full text-center">{players[3].name}</div>
                                        <div className="bg-amber-600 w-full h-32 rounded-t-lg shadow-inner flex flex-col items-center justify-start pt-4 relative overflow-hidden">
                                            <span className="text-4xl font-black text-amber-900 drop-shadow-md z-10">3</span>
                                            <span className="text-md font-bold text-amber-100 mt-2 z-10">{players[3].score}</span>
                                            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6bTAgMHY0MGgxVjB6IiBmaWxsPSJyZ2JhKDAsMCwwLDAuMDIpIi8+Cjwvc3ZnPg==')] opacity-50 z-0 pointer-events-none mix-blend-multiply"></div>

                {/* Custom Questions Modal */}
                {showCustomModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex py-10 px-4 justify-center overflow-y-auto">
                        <div className="bg-white max-w-3xl w-full rounded-3xl shadow-2xl p-8 m-auto flex flex-col gap-6 relative">
                            <button onClick={() => setShowCustomModal(false)} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 text-3xl font-black">&times;</button>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">إضافة أسئلة مخصصة</h2>

                            <div className="flex-1 overflow-y-auto bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <label className="block text-slate-700 font-bold mb-2">نص السؤال</label>
                                <input type="text" value={newQuestion.question} onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })} className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none mb-6 text-xl font-bold" placeholder="ما هي عاصمة..." />

                                <label className="block text-slate-700 font-bold mb-2">الخيارات (يجب تحديد 4)</label>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {newQuestion.options.map((opt, i) => (
                                        <div key={i} className="flex flex-col relative">
                                            <input type="text" value={opt} onChange={e => {
                                                const newOpts = [...newQuestion.options];
                                                newOpts[i] = e.target.value;
                                                setNewQuestion({ ...newQuestion, options: newOpts });
                                            }} className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none font-bold pl-12" placeholder={`خيار ${i + 1}`} />
                                            <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center pr-2">
                                                <input type="radio" name="correctAnswer" checked={newQuestion.answer === i} onChange={() => setNewQuestion({ ...newQuestion, answer: i })} className="w-6 h-6 text-purple-600 focus:ring-purple-500 cursor-pointer" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={handleAddCustomQuestion} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-4 rounded-xl transition">
                                    + إضافة للسلسلة
                                </button>
                            </div>

                            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200 flex justify-between items-center">
                                <div className="font-bold text-purple-800">
                                    الأسئلة المضافة: {customQuestions.length}/25
                                </div>
                                <button onClick={submitCustomQuestions} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-transform hover:scale-105">
                                    حفظ الأسئلة
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- Rendering Player View (Controller) ---
    const myPlayer = players.find(p => p.name === user?.displayName);
    const myScore = myPlayer ? myPlayer.score : 0;

    return (
        <div className="h-screen w-screen bg-slate-100 flex flex-col absolute inset-0 font-['Cairo']">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center shadow-sm z-10 gap-2">
                <button onClick={handleLeave} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1 rounded font-bold text-sm transition-colors flex items-center gap-1">
                    <span>⬅️</span> خروج
                </button>
                <div className="font-bold text-slate-500 flex-1 ml-2">PIN: {roomId}</div>
                <div className="bg-black text-white px-4 py-1 rounded-sm font-bold tracking-widest">{myScore}</div>
            </div>

            <div className="flex-1 flex flex-col relative w-full h-full">
                {(gameState === 'waiting' || gameState === 'playing') && (
                    <div className="absolute inset-0 bg-purple-600 flex flex-col items-center justify-center p-8 text-center text-white z-20">
                        <div className="text-2xl font-bold mb-4">You're in!</div>
                        <h2 className="text-4xl font-black mb-8 drop-shadow-sm">شاشتك الآن جهاز تحكم</h2>
                        <div className="animate-pulse">انظر للشاشة الرئيسية ←</div>
                    </div>
                )}

                {gameState === 'question_active' && (
                    <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-1 p-2 md:p-4 bg-slate-200">
                        {hasAnswered ? (
                            <div className="col-span-2 row-span-2 bg-purple-600 flex flex-col items-center justify-center text-white p-8 text-center rounded-xl shadow-inner">
                                <div className="text-4xl font-bold mb-4 animate-bounce">⌛</div>
                                <h3 className="text-3xl font-bold">في انتظار باقي اللاعبين...</h3>
                            </div>
                        ) : (
                            shapes.map((shape, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => submitAnswer(idx)}
                                    className={`${shape.color} ${shape.hoverColor} flex items-center justify-center rounded-xl shadow-lg active:scale-95 transition-all w-full h-full`}
                                >
                                    <span className="text-7xl md:text-9xl drop-shadow-lg filter brightness-110">{shape.icon}</span>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {gameState === 'revealing_answer' && !hasAnswered && (
                    <div className="absolute inset-0 bg-red-500 flex flex-col items-center justify-center p-8 text-white text-center z-20">
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-4xl font-black">لم تجب في الوقت المحدد!</h2>
                    </div>
                )}
                {hasAnswered && gameState === 'revealing_answer' && correctAnswerIndex !== null && myAnswerIndex === correctAnswerIndex && (
                    <div className="absolute inset-0 bg-teal-500 flex flex-col items-center justify-center p-8 text-center text-white z-20">
                        <div className="text-6xl mb-6">✅</div>
                        <h2 className="text-4xl font-black mb-4">إجابة صحيحة!</h2>
                        <div className="bg-black/20 px-6 py-2 rounded-full font-bold">+ نقاط</div>
                    </div>
                )}
                {hasAnswered && gameState === 'revealing_answer' && correctAnswerIndex !== null && myAnswerIndex !== correctAnswerIndex && (
                    <div className="absolute inset-0 bg-rose-500 flex flex-col items-center justify-center p-8 text-center text-white z-20">
                        <div className="text-6xl mb-6">❌</div>
                        <h2 className="text-4xl font-black mb-4">إجابة خاطئة!</h2>
                        <div className="bg-black/20 px-6 py-2 rounded-full font-bold">حظ أوفر</div>
                    </div>
                )}
                {gameState === 'leaderboard' && (
                    <div className="absolute inset-0 bg-yellow-500 flex flex-col items-center justify-center p-8 text-center text-white z-20">
                        <div className="text-6xl mb-6">🏆</div>
                        <h2 className="text-4xl font-black mb-4">انظر إلى الشاشة!</h2>
                        <div className="text-2xl font-bold bg-black/20 px-6 py-2 rounded-full">نتيجتك: {myScore}</div>
                    </div>
                )}
                {gameState === 'finished' && (
                    <div className="absolute inset-0 bg-indigo-600 flex flex-col items-center justify-center p-8 text-white text-center z-20">
                        <h2 className="text-5xl font-black mb-8 drop-shadow-sm">انتهت اللعبة!</h2>
                        <div className="text-2xl font-bold bg-white text-indigo-900 px-8 py-4 rounded-xl shadow-xl">
                            نقاطك النهائية: <span className="font-black text-3xl">{myScore}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CahootApp;
