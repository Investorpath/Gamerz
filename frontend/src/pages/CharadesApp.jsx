import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function CharadesApp() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [inRoom, setInRoom] = useState(false);
    const [players, setPlayers] = useState([]);
    const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing
    const [turnData, setTurnData] = useState(null);
    const [timer, setTimer] = useState(0);
    const [hostId, setHostId] = useState(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('update_players', (playersList) => setPlayers(playersList));
        newSocket.on('game_status', (status) => setGameStatus(status));
        newSocket.on('charades_turn', (data) => setTurnData(data));
        newSocket.on('timer', (time) => setTimer(time));
        newSocket.on('room_host', (id) => setHostId(id));
        newSocket.on('game_error', (msg) => {
            alert(msg);
            setInRoom(false);
        });

        return () => newSocket.close();
    }, []);

    const joinRoom = (e) => {
        e.preventDefault();
        if (roomId.trim() && socket && user) {
            socket.emit('join_room', { roomId, playerName: user.displayName, gameType: 'charades', userId: user.id });
            setInRoom(true);
        }
    };

    const startGame = () => {
        if (socket) {
            socket.emit('start_game', roomId);
        }
    };

    const generateRoomId = () => {
        const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomId(randomId);
    };

    const handleGotIt = () => {
        if (socket && turnData?.role === 'actor') {
            socket.emit('charades_got_it', roomId);
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
                        <span className="text-6xl mb-4 block">🎭</span>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">بدون كلام</h2>
                        <p className="text-slate-400 mt-2 text-sm">مَثّل الكلمة لأصدقائك بدون ما تتكلم!</p>
                    </div>
                    <form onSubmit={joinRoom} className="space-y-4">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="رمز الغرفة (مثال: PARTY)"
                                className="w-full bg-slate-800 border-2 border-slate-700 text-white p-4 rounded-xl text-center text-lg focus:border-yellow-500 focus:ring-0 outline-none transition-all placeholder-slate-500 font-mono tracking-widest uppercase dir-ltr"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                required
                            />
                            <button
                                type="button"
                                onClick={generateRoomId}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl whitespace-nowrap shadow-lg transition-all active:scale-95 border-2 border-slate-700 hover:border-yellow-500 flex flex-col items-center justify-center text-sm"
                            >
                                <span className="text-xl mb-1">🎲</span>
                                جديد
                            </button>
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all">
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
            <header className="w-full max-w-4xl flex justify-between items-center mb-8 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center gap-2">
                        <span>🎭</span> بدون كلام
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">غرفة: <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">{roomId}</span></p>
                </div>
                <button onClick={handleLeave} className="bg-red-900/40 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors">
                    مغادرة
                </button>
            </header>

            <main className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-start justify-center">

                {/* Main Game Area */}
                <div className="flex-1 w-full flex flex-col items-center justify-center">
                    {gameStatus === 'waiting' && (
                        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-lg relative overflow-hidden text-center">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
                            <h2 className="text-2xl font-bold mb-4">في الانتظار...</h2>
                            <p className="text-slate-400 mb-8">اجمع أصدقائك وابدأ التحدي!</p>

                            {players.length >= 2 ? (
                                socket?.id === hostId ? (
                                    <button
                                        onClick={startGame}
                                        className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white font-bold py-4 rounded-xl text-xl shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                                    >
                                        بدء اللعبة الان
                                    </button>
                                ) : (
                                    <p className="text-slate-400 font-medium">ننتظر مضيف الغرفة لبدء اللعبة...</p>
                                )
                            ) : (
                                <p className="text-slate-400 font-medium">نحتاج إلى لاعبين على الأقل للبدء...</p>
                            )}
                        </div>
                    )}

                    {gameStatus === 'playing' && turnData && (
                        <div className="w-full max-w-lg flex flex-col items-center">

                            {/* Timer */}
                            <div className="mb-6 p-4 bg-slate-900/80 rounded-full border border-slate-800 flex items-center justify-center shadow-lg w-32 h-32">
                                <span className={`text-5xl font-mono font-bold tabular-nums tracking-tighter ${timer <= 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                                    {timer}
                                </span>
                            </div>

                            {/* Card Details */}
                            <div className={`p-10 rounded-3xl border-2 shadow-2xl w-full text-center transition-all duration-500 ${turnData.role === 'actor' ? 'bg-indigo-900/40 border-indigo-500 shadow-indigo-500/20' : 'bg-slate-900 border-slate-700'}`}>

                                <p className="text-slate-400 mb-2 font-bold bg-slate-800 inline-block px-4 py-1 rounded-full text-sm">التصنيف: {turnData.category}</p>

                                {turnData.role === 'actor' ? (
                                    <>
                                        <h2 className="text-4xl font-black mt-6 mb-2 text-white drop-shadow-md">
                                            {turnData.word}
                                        </h2>
                                        <p className="text-indigo-300 mt-2 mb-8 font-medium">مَثّل هذه الكلمة للآخرين الآن!</p>

                                        <button
                                            onClick={handleGotIt}
                                            className="w-full py-4 text-xl font-bold rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-lg active:scale-95 transition-all"
                                        >
                                            ✔️ عرفوها! (كلمة تالية)
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-6xl my-6 animate-bounce">👀</div>
                                        <h2 className="text-2xl font-bold mt-2 text-slate-300">
                                            <span className="text-yellow-400">{turnData.actorName}</span> يقوم بالتمثيل الآن...
                                        </h2>
                                        <p className="text-slate-400 mt-4 leading-relaxed">
                                            حاول تخمين الكلمة قبل انتهاء الوقت المتبقي واصرخ بها!
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Scoreboard */}
                {players.length > 0 && (
                    <div className="w-full lg:w-80 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex-shrink-0">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                            🏆 النقاط
                        </h3>
                        <ul className="space-y-3">
                            {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                                <li key={i} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold w-6 text-center ${i === 0 && p.score > 0 ? 'text-yellow-400' : 'text-slate-500'}`}>{i + 1}.</span>
                                        <span className="font-bold">{p.name} {p.name === turnData?.actorName && gameStatus === 'playing' && '🎭'}</span>
                                    </div>
                                    <span className="bg-slate-700 px-3 py-1 rounded text-sm font-bold shadow-inner">
                                        {p.score || 0}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );
}

export default CharadesApp;
