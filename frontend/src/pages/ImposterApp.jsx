import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ImposterApp() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [inRoom, setInRoom] = useState(false);
    const [players, setPlayers] = useState([]);
    const [gameStatus, setGameStatus] = useState('waiting'); // waiting, role_reveal, voting
    const [roleData, setRoleData] = useState(null);
    const [timer, setTimer] = useState(0);
    const [hostId, setHostId] = useState(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('update_players', (playersList) => setPlayers(playersList));
        newSocket.on('game_status', (status) => setGameStatus(status));
        newSocket.on('imposter_role', (data) => setRoleData(data));
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
            socket.emit('join_room', { roomId, playerName: user.displayName, gameType: 'imposter', userId: user.id });
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

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
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
                        <span className="text-6xl mb-4 block">🕵️‍♂️</span>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-500">لعبة المُحتال</h2>
                        <p className="text-slate-400 mt-2 text-sm">أدخل رمز الغرفة للبدء في كشف الحقيقة!</p>
                    </div>
                    <form onSubmit={joinRoom} className="space-y-4">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="رمز الغرفة (مثال: GAME123)"
                                className="w-full bg-slate-800 border-2 border-slate-700 text-white p-4 rounded-xl text-center text-lg focus:border-red-500 focus:ring-0 outline-none transition-all placeholder-slate-500 font-mono tracking-widest uppercase dir-ltr"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                required
                            />
                            <button
                                type="button"
                                onClick={generateRoomId}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl whitespace-nowrap shadow-lg transition-all active:scale-95 border-2 border-slate-700 hover:border-red-500 flex flex-col items-center justify-center text-sm"
                            >
                                <span className="text-xl mb-1">🎲</span>
                                جديد
                            </button>
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all">
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
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-500 flex items-center gap-2">
                        <span>🕵️‍♂️</span> المحتال
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">غرفة: <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">{roomId}</span></p>
                </div>
                <button onClick={handleLeave} className="bg-red-900/40 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors">
                    مغادرة
                </button>
            </header>

            <main className="w-full max-w-4xl flex-1 flex flex-col">
                {gameStatus === 'waiting' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
                            <h2 className="text-2xl font-bold mb-6">قائمة اللاعبين ({players.length})</h2>
                            <ul className="space-y-3 mb-8 text-right max-h-60 overflow-y-auto custom-scrollbar">
                                {players.map((p, i) => (
                                    <li key={i} className="bg-slate-800 p-4 rounded-xl flex items-center gap-3 border border-slate-700/50">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold shadow-inner">
                                            {p.name.charAt(0)}
                                        </div>
                                        <span className="font-medium text-lg">{p.name}</span>
                                    </li>
                                ))}
                            </ul>

                            {players.length >= 3 ? (
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
                                <p className="text-slate-400 font-medium">نحتاج إلى 3 لاعبين على الأقل للبدء... ({3 - players.length} متبقي)</p>
                            )}
                        </div>
                    </div>
                )}

                {gameStatus === 'role_reveal' && roleData && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="mb-8 p-6 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col items-center justify-center shadow-lg min-w-[300px]">
                            <p className="text-slate-400 mb-2 font-medium text-lg">الوقت المتبقي للأسئلة</p>
                            <span className="text-5xl font-mono font-bold text-red-400 tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]">
                                {formatTime(timer)}
                            </span>
                        </div>

                        <div className={`p-10 rounded-3xl border-2 shadow-2xl w-full max-w-md transition-all duration-1000 ${roleData.isImposter ? 'bg-red-950/40 border-red-500 shadow-red-500/20' : 'bg-slate-900 border-indigo-500 shadow-indigo-500/20'}`}>

                            <div className="text-7xl mb-6">
                                {roleData.isImposter ? '👺' : '📍'}
                            </div>

                            <h2 className="text-3xl font-black mb-2">
                                {roleData.isImposter ? (
                                    <span className="text-red-500 drop-shadow-md">أنت المحتال!</span>
                                ) : (
                                    <span className="text-indigo-400">دورك: {roleData.role}</span>
                                )}
                            </h2>

                            <div className="mt-8 pt-8 border-t border-slate-700/50">
                                <p className="text-slate-400 text-sm mb-2 uppercase tracking-wider">المكان السري</p>
                                <p className={`text-4xl font-bold ${roleData.isImposter ? 'text-red-600/50 line-through blur-[2px]' : 'text-white'}`}>
                                    {roleData.location}
                                </p>
                            </div>

                            <p className="mt-8 text-slate-300 font-medium leading-relaxed">
                                {roleData.isImposter
                                    ? "حاول معرفة المكان من خلال أسئلة الآخرين ولا تكشف هويتك!"
                                    : "اسأل اللاعبين الآخرين أسئلة غامضة عن المكان لمعرفة من هو المحتال!"}
                            </p>
                        </div>
                    </div>
                )}

                {gameStatus === 'voting' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-lg">
                            <h2 className="text-3xl font-bold mb-4 text-red-400">وقت التصويت!</h2>
                            <p className="text-slate-300 mb-8">من تعتقد أنه المحتال؟</p>
                            <div className="space-y-3 text-right">
                                {players.map((p, i) => (
                                    <button key={i} className="w-full bg-slate-800 hover:bg-red-900/50 p-4 rounded-xl flex items-center justify-between border border-slate-700 hover:border-red-500 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-700 group-hover:bg-red-500 rounded-full flex items-center justify-center font-bold shadow-inner transition-colors">
                                                {p.name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-lg text-slate-300 group-hover:text-white transition-colors">{p.name}</span>
                                        </div>
                                        <span className="opacity-0 group-hover:opacity-100 text-red-400 font-bold transition-opacity">صوّت ضد</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ImposterApp;
