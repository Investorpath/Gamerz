import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

import { BACKEND_URL } from '../config';

function SameSameApp() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const socket = useSocket();
    const [roomId, setRoomId] = useState('');
    const [players, setPlayers] = useState([]);
    const [status, setStatus] = useState('lobby'); // lobby, playing, judging, round_winner, finished
    const [gameStatus, setGameStatus] = useState('waiting'); // server status
    const [isHost, setIsHost] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(0);

    // Game Specific State
    const [isJudge, setIsJudge] = useState(false);
    const [judgeName, setJudgeName] = useState('');
    const [scenarios, setScenarios] = useState(null);
    const [answerText, setAnswerText] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [anonymousAnswers, setAnonymousAnswers] = useState([]);
    const [submittedCount, setSubmittedCount] = useState(0);
    const [roundWinner, setRoundWinner] = useState(null); // {playerName, text, scenarioA, scenarioB}

    const roomIdInputRef = useRef(null);

    // Refs to avoid stale closures in socket listeners
    const roomIdRef = useRef(roomId);

    useEffect(() => {
        roomIdRef.current = roomId;
    }, [roomId]);

    useEffect(() => {
        if (!socket) return;

        socket.on('connect', () => {
            if (roomIdRef.current) {
                socket.emit('join_room', {
                    roomId: roomIdRef.current,
                    playerName: user?.displayName || 'لاعب',
                    gameType: 'same_same',
                    userId: user?.id || user?.userId
                });
            }
        });

        socket.on('game_error', (msg) => {
            setError(msg);
            setRoomId(''); // Reset room ID so user can try again
        });

        socket.on('update_players', (playerList) => {
            setPlayers(playerList);
        });

        socket.on('game_status', (serverStatus) => {
            setGameStatus(serverStatus);
            if (serverStatus === 'waiting') setStatus('lobby');
            else if (serverStatus === 'playing') setStatus('playing');
            else if (serverStatus === 'judging') setStatus('judging');
            else if (serverStatus === 'round_winner') setStatus('round_winner');
            else if (serverStatus === 'finished') setStatus('finished');
        });

        socket.on('room_host', (hostSocketId) => {
            if (hostSocketId === socket.id) {
                setIsHost(true);
            }
        });

        socket.on('timer', (time) => {
            setTimer(time);
        });

        socket.on('samesame_turn', (data) => {
            setIsJudge(data.isJudge);
            setJudgeName(data.judgeName);
            setScenarios(data.scenarios);
            setAnswerText('');
            setSubmitted(false);
            setAnonymousAnswers([]);
            setSubmittedCount(0);
            setStatus('playing');
            setRoundWinner(null);
        });

        socket.on('samesame_answers_count', (count) => {
            setSubmittedCount(count);
        });

        socket.on('samesame_judging', (answers) => {
            setAnonymousAnswers(answers);
            setStatus('judging');
        });

        socket.on('samesame_winner', (winnerData) => {
            setRoundWinner(winnerData);
            setStatus('round_winner');
        });

        return () => {
            socket.off('connect');
            socket.off('game_error');
            socket.off('update_players');
            socket.off('game_status');
            socket.off('room_host');
            socket.off('timer');
            socket.off('samesame_turn');
            socket.off('samesame_answers_count');
            socket.off('samesame_judging');
            socket.off('samesame_winner');
        };
    }, [socket, user]);

    const joinRoom = (e) => {
        e.preventDefault();
        const room = roomIdInputRef.current.value.trim().toUpperCase();
        if (room && socket) {
            socket.emit('join_room', {
                roomId: room,
                playerName: user.displayName,
                gameType: 'same_same',
                userId: user.id || user.userId
            });
            setRoomId(room);
            setStatus('lobby');
            setError('');
        }
    };

    const startGame = () => {
        if (socket && roomId && isHost) {
            socket.emit('start_game', roomId);
        }
    };

    const submitAnswer = (e) => {
        e.preventDefault();
        if (!answerText.trim() || submitted) return;

        socket.emit('submit_funny_answer', {
            roomId,
            answerText: answerText.trim()
        });
        setSubmitted(true);
    };

    const pickWinner = (index) => {
        if (socket && isJudge) {
            socket.emit('samesame_pick_winner', { roomId, winnerIndex: index });
        }
    };

    const leaveRoom = () => {
        if (socket) {
            socket.disconnect();
            navigate('/');
        }
    };

    // --- RENDER HELPERS ---

    const renderLobby = () => (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto w-full px-4 animate-fade-in text-center mt-12 relative z-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] -z-10"></div>

            <div className="text-7xl mb-6">🎭</div>
            <h1 className="text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-600">
                أهم حاجة النية
            </h1>
            <p className="text-slate-400 mb-10 text-lg">جملة واحدة... موقفين مختلفين تماماً!</p>

            {!roomId ? (
                <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-8 rounded-3xl w-full shadow-2xl">
                    <h2 className="text-2xl font-bold mb-6 text-white">انضمام لغرفة اللعب</h2>
                    <form onSubmit={joinRoom} className="space-y-4">
                        <input
                            type="text"
                            ref={roomIdInputRef}
                            placeholder="أدخل رمز الغرفة..."
                            className="w-full text-center text-2xl p-4 bg-slate-900 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-pink-500 text-white font-bold transition-colors placeholder-slate-600"
                            required
                        />
                        <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all transform hover:scale-[1.02]">
                            انضمام للعب
                        </button>
                    </form>
                    {error && <p className="text-red-400 mt-4 text-sm font-bold bg-red-900/20 p-3 rounded-lg border border-red-500/30">{error}</p>}
                </div>
            ) : (
                <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-8 rounded-3xl w-full shadow-2xl">
                    <div className="bg-slate-900 p-4 rounded-xl mb-6 border border-slate-700">
                        <h2 className="text-sm text-slate-400 mb-1 font-bold">رمز الغرفة</h2>
                        <p className="text-4xl font-black text-pink-400 tracking-widest leading-none drop-shadow-sm">{roomId}</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-4 text-white flex items-center justify-center gap-2">
                            <span>👥</span> اللاعبون ({players.length})
                        </h3>
                        <div className="flex flex-wrap justify-center gap-3">
                            {players.map((p, i) => (
                                <span key={i} className="bg-slate-700/50 border border-slate-600 text-slate-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                                    {p.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {isHost ? (
                        <button
                            onClick={startGame}
                            disabled={players.length < 3}
                            className={`w-full py-4 px-8 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${players.length >= 3
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transform hover:scale-[1.02]'
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {players.length >= 3 ? '🚀 بدء اللعب' : 'تحتاج 3 لاعبين على الأقل للبدء'}
                        </button>
                    ) : (
                        <div className="bg-slate-700/30 border border-slate-600 text-amber-400 p-4 rounded-xl font-bold font-lg flex items-center justify-center gap-3">
                            <span className="animate-spin text-xl">⏳</span> في انتظار المضيف لبدء اللعبة...
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderPlaying = () => {
        if (!scenarios) return null;

        return (
            <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-4xl mx-auto p-4 animate-fade-in z-10 relative">
                <div className="flex justify-between items-center bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-slate-700 mb-6 shadow-md">
                    <div className="text-xl font-bold flex items-center gap-2">
                        <span className="text-pink-400">⚖️ الحكم:</span> {judgeName}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-emerald-400 bg-emerald-900/30 px-3 py-1 rounded-lg border border-emerald-500/30">
                            ⏱️ {timer}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-indigo-900/40 border-2 border-indigo-500/50 rounded-3xl p-6 text-center shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                        <div className="absolute -top-4 -right-4 text-6xl opacity-20">1️⃣</div>
                        <h3 className="text-sm font-bold text-indigo-300 mb-2">الموقف الأول</h3>
                        <p className="text-2xl font-bold text-white leading-relaxed">{scenarios.scenarioA}</p>
                    </div>
                    <div className="bg-rose-900/40 border-2 border-rose-500/50 rounded-3xl p-6 text-center shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                        <div className="absolute -top-4 -right-4 text-6xl opacity-20">2️⃣</div>
                        <h3 className="text-sm font-bold text-rose-300 mb-2">الموقف الثاني</h3>
                        <p className="text-2xl font-bold text-white leading-relaxed">{scenarios.scenarioB}</p>
                    </div>
                </div>

                {isJudge ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/50 border border-slate-700 rounded-3xl p-8 text-center">
                        <div className="text-6xl mb-6 animate-bounce">⚖️</div>
                        <h2 className="text-3xl font-bold text-pink-400 mb-4">أنت الحكم في هذه الجولة!</h2>
                        <p className="text-xl text-slate-300 mb-8">انتظر حتى يقوم اللاعبون بكتابة إجاباتهم المضحكة التي تصلح للموقفين معاً.</p>
                        <div className="bg-slate-900 px-6 py-4 rounded-2xl border border-slate-700 flex items-center gap-4">
                            <div className="text-lg font-bold text-slate-400">الإجابات المتسلمة:</div>
                            <div className="text-3xl font-black text-white">{submittedCount} / {players.length - 1}</div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col bg-slate-800/80 backdrop-blur border border-slate-700 rounded-3xl p-6 shadow-xl">
                        <h2 className="text-2xl font-bold text-white mb-6 flex justify-between items-center">
                            <span>✍️ اكتب جملة تتناسب مع الموقفين بذكاء</span>
                        </h2>
                        {!submitted ? (
                            <form onSubmit={submitAnswer} className="flex flex-col h-full gap-4">
                                <textarea
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                    placeholder="أهم حاجة النية... ماذا ستقول؟"
                                    className="flex-1 bg-slate-900 text-white text-2xl p-6 rounded-2xl border-2 border-slate-600 focus:border-pink-500 focus:outline-none resize-none placeholder-slate-600"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="py-4 rounded-xl text-xl font-bold text-white bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 shadow-lg transition-all transform hover:-translate-y-1"
                                >
                                    إرسال الإجابة
                                </button>
                            </form>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-5xl mb-6 border-2 border-green-500 animate-pulse">✓</div>
                                <h3 className="text-3xl font-bold text-white mb-2">تم الإرسال بنجاح!</h3>
                                <p className="text-slate-400 text-lg">بانتظار انتهاء الوقت لبدء تقييم الحكم...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderJudging = () => {
        return (
            <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-5xl mx-auto p-4 animate-fade-in z-10 relative overflow-hidden">
                <div className="text-center mb-8 shrink-0">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-500 mb-2">
                        مرحلة التحكيم
                    </h2>
                    <p className="text-slate-400 text-lg">
                        الموقف 1: <span className="text-indigo-300">"{scenarios?.scenarioA}"</span>
                    </p>
                    <p className="text-slate-400 text-lg">
                        الموقف 2: <span className="text-rose-300">"{scenarios?.scenarioB}"</span>
                    </p>
                </div>

                {isJudge ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6 w-full max-w-3xl mx-auto">
                        <p className="text-amber-400 text-center font-bold mb-6 text-xl animate-pulse">اختر الإجابة الأذكى / الأضحك!</p>
                        <div className="flex flex-col gap-4">
                            {anonymousAnswers.map((ans) => (
                                <button
                                    key={ans.index}
                                    onClick={() => pickWinner(ans.index)}
                                    className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-pink-500 rounded-2xl p-6 text-2xl font-bold text-white shadow-md transition-all text-right group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600/0 via-pink-600/10 to-fuchsia-600/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <span className="relative z-10">"{ans.text}"</span>
                                </button>
                            ))}
                            {anonymousAnswers.length === 0 && (
                                <p className="text-center text-slate-500 text-xl py-10">لم يتم تقديم أي إجابات!</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/50 border border-slate-700 rounded-3xl p-8 text-center max-w-2xl mx-auto w-full">
                        <div className="text-6xl mb-6">🍿</div>
                        <h2 className="text-3xl font-bold text-white mb-4">الحكم {judgeName} يقرأ الإجابات الآن...</h2>
                        <p className="text-xl text-slate-400">من سيكون صاحب أغبى/أذكى تعليق؟</p>
                    </div>
                )}
            </div>
        );
    };

    const renderRoundWinner = () => {
        if (!roundWinner) return null;
        return (
            <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4 animate-fade-in text-center mt-10 relative z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-slate-950/0 to-slate-950/0 blur-[100px] -z-10 animate-pulse"></div>

                <h2 className="text-5xl font-black text-yellow-400 mb-10 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                    🏆 إجابة فائزة!
                </h2>

                <div className="bg-slate-800/80 backdrop-blur border-2 border-yellow-500/50 rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative">
                    <div className="absolute -top-6 -right-6 text-6xl rotate-12">🌟</div>
                    <div className="absolute -bottom-6 -left-6 text-6xl -rotate-12">✨</div>

                    <div className="mb-8 space-y-4">
                        <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/30">
                            <h4 className="text-indigo-400 text-sm font-bold mb-1">الموقف الأول</h4>
                            <p className="text-lg text-slate-200">{roundWinner.scenarioA}</p>
                        </div>
                        <div className="bg-rose-900/30 p-4 rounded-xl border border-rose-500/30">
                            <h4 className="text-rose-400 text-sm font-bold mb-1">الموقف الثاني</h4>
                            <p className="text-lg text-slate-200">{roundWinner.scenarioB}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-slate-400 font-bold mb-2">الإجابة:</h3>
                        <p className="text-4xl font-extrabold text-white leading-relaxed">
                            "{roundWinner.text}"
                        </p>
                    </div>

                    <div className="inline-block bg-slate-900 border border-slate-700 rounded-full px-6 py-3 mt-4">
                        <span className="text-slate-300">بقلم الكوميدي: </span>
                        <span className="font-bold text-pink-400 text-xl">{roundWinner.playerName}</span>
                        <span className="text-green-400 font-bold mr-3">+15 نقطة</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderFinished = () => {
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        const winner = sortedPlayers[0];

        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full max-w-4xl mx-auto px-4 z-10 animate-fade-in text-center mt-10">
                <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 flex justify-center items-start">
                    {/* Confetti simulation */}
                    <div className="w-10 h-10 bg-yellow-400 rounded-sm absolute top-10 left-[20%] animate-[fall_3s_linear_infinite] rotate-45"></div>
                    <div className="w-10 h-10 bg-pink-500 rounded-full absolute top-5 left-[40%] animate-[fall_2.5s_linear_infinite] delay-75"></div>
                    <div className="w-10 h-10 bg-blue-500 rounded-sm absolute top-20 left-[60%] animate-[fall_4s_linear_infinite] rotate-12"></div>
                    <div className="w-10 h-10 bg-green-500 rounded-sm absolute top-0 left-[80%] animate-[fall_3.5s_linear_infinite] rotate-90"></div>
                </div>

                <h1 className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 drop-shadow-lg">
                    انتهت اللعبة!
                </h1>
                <p className="text-2xl text-slate-300 mb-12">أهم حاجة النية...</p>

                <div className="bg-slate-800/90 backdrop-blur border border-yellow-500/30 rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative mb-8">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-8xl drop-shadow-xl z-20">👑</div>
                    <div className="mt-8">
                        <h2 className="text-4xl font-bold text-white mb-2">{winner?.name}</h2>
                        <p className="text-xl text-yellow-500 font-black mb-8">{winner?.score} نقطة</p>

                        <div className="border-t border-slate-700/50 pt-6">
                            <h3 className="text-lg font-bold text-slate-400 text-right mb-4">الترتيب النهائي:</h3>
                            <div className="space-y-3">
                                {sortedPlayers.slice(1).map((p, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-500 font-bold w-6 text-center">{i + 2}.</span>
                                            <span className="text-white font-bold">{p.name}</span>
                                        </div>
                                        <span className="text-slate-300 font-bold text-left">{p.score} نقطة</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={leaveRoom}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-8 py-4 rounded-xl text-white font-bold text-lg shadow-md transition-all"
                >
                    العودة للرئيسية
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 rtl flex flex-col items-center justify-start font-['Cairo'] relative overflow-hidden">
            {/* Nav */}
            <div className="w-full p-4 flex justify-between items-center z-20 relative">
                <div
                    onClick={leaveRoom}
                    className="cursor-pointer bg-slate-800/50 hover:bg-slate-700/50 p-3 rounded-xl backdrop-blur transition-colors border border-slate-700/50"
                >
                    <span className="text-2xl">🏠</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur px-6 py-2 rounded-full border border-slate-700/80 shadow-lg">
                    <span className="text-2xl">🎭</span>
                    <span className="text-white font-bold text-lg hidden sm:inline">أهم حاجة النية</span>
                </div>
            </div>

            {/* Scoreboard Side Panel (Active during playing/judging) */}
            {['playing', 'judging', 'round_winner'].includes(status) && (
                <div className="fixed left-4 top-24 bottom-4 w-64 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-2xl hidden lg:flex flex-col overflow-hidden shadow-2xl z-20 custom-scrollbar">
                    <div className="bg-slate-800/80 p-4 border-b border-slate-700/80">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <span>🏆</span> النقاط
                        </h3>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto w-full max-w-full overflow-x-hidden">
                        {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                            <div key={i} className={`flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border ${p.name === judgeName ? 'border-pink-500/50' : 'border-slate-700'} w-full`}>
                                <div className="flex items-center gap-2 min-w-0 flex-shrink truncate">
                                    <span className="text-slate-400 font-bold w-4 text-center shrink-0">{i + 1}</span>
                                    <span className="text-white font-bold text-sm truncate">{p.name} {p.name === judgeName && '⚖️'}</span>
                                </div>
                                <span className="text-yellow-400 font-bold shrink-0 ml-2">{p.score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {status === 'lobby' && renderLobby()}
            {status === 'playing' && renderPlaying()}
            {status === 'judging' && renderJudging()}
            {status === 'round_winner' && renderRoundWinner()}
            {status === 'finished' && renderFinished()}

            <style jsx global>{`
                @keyframes fall {
                    0% { transform: translateY(-100px) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

export default SameSameApp;
