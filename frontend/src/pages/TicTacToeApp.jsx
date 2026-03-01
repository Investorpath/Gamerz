import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

import { BACKEND_URL } from '../config';

function TicTacToeApp() {
    const { user } = useAuth();
    const socket = useSocket();
    const [roomId, setRoomId] = useState('');
    const [inRoom, setInRoom] = useState(false);
    const [status, setStatus] = useState('waiting');
    const [players, setPlayers] = useState([]);
    const [board, setBoard] = useState(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [playerX, setPlayerX] = useState('');
    const [playerO, setPlayerO] = useState('');
    const [winner, setWinner] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!socket) return;

        socket.on('update_players', (playersList) => {
            setPlayers(playersList);
        });

        socket.on('game_status', (newStatus) => {
            setStatus(newStatus);
        });

        socket.on('tictactoe_state', (state) => {
            setBoard(state.board);
            setXIsNext(state.xIsNext);
            setPlayerX(state.playerX);
            setPlayerO(state.playerO);
            setWinner(state.winner);
        });

        socket.on('game_error', (msg) => {
            setErrorMsg(msg);
            setInRoom(false);
        });

        return () => {
            socket.off('update_players');
            socket.off('game_status');
            socket.off('tictactoe_state');
            socket.off('game_error');
        };
    }, [socket]);

    const joinRoom = (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (roomId.trim() && user) {
            socket.emit('join_room', {
                roomId,
                playerName: user.displayName,
                gameType: 'tictactoe',
                userId: user.id
            });
            setInRoom(true);
        } else if (!user) {
            setErrorMsg('يجب تسجيل الدخول للعب!');
        }
    };

    const startGame = () => {
        socket.emit('start_game', roomId);
    };

    const handleCellClick = (index) => {
        socket.emit('tictactoe_move', { roomId, index });
    };

    const isMyTurn = () => {
        if (!user) return false;
        if (xIsNext && user.displayName === playerX) return true;
        if (!xIsNext && user.displayName === playerO) return true;
        return false;
    };

    const renderCell = (index) => {
        const val = board[index];
        const color = val === 'X' ? 'text-teal-400' : 'text-rose-400';
        return (
            <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={status !== 'playing' || winner !== null || val !== null || !isMyTurn()}
                className={`w-24 h-24 sm:w-32 sm:h-32 bg-slate-800 border-2 border-slate-700/50 rounded-2xl flex items-center justify-center text-4xl sm:text-6xl font-bold transition-all
                    hover:bg-slate-700 hover:border-slate-500
                    disabled:opacity-80 disabled:hover:bg-slate-800 disabled:cursor-not-allowed
                    ${color} shadow-lg`}
            >
                {val}
            </button>
        );
    };

    const handleLeave = () => {
        if (window.confirm("هل أنت متأكد من مغادرة اللعبة؟")) {
            if (socket) socket.disconnect();
            window.location.href = '/';
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center pt-24 text-white font-['Cairo']">
                <h1 className="text-4xl text-rose-500 font-bold mb-4">يجب تسجيل الدخول</h1>
                <p>يرجى تسجيل الدخول من الصفحة الرئيسية للاستمرار.</p>
            </div>
        );
    }

    if (!inRoom) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4 font-['Cairo'] relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[10%] left-[20%] w-72 h-72 bg-teal-500/10 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-rose-500/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="z-10 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                    <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-rose-500">
                        إكس أو (Tic Tac Toe)
                    </h1>
                    <p className="text-slate-400 mb-8">أدخل كود الغرفة للعب مع أصدقائك</p>

                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg text-sm">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={joinRoom} className="space-y-4">
                        <input
                            type="text"
                            placeholder="كود الغرفة..."
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-center text-xl font-bold tracking-wider"
                        />
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
                        >
                            انضمام للغرفة
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center py-12 px-4 text-white font-['Cairo'] relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="z-10 w-full max-w-3xl flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-8 bg-slate-900/50 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm gap-2">
                    <button onClick={handleLeave} className="bg-rose-900/40 text-rose-400 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-colors flex-shrink-0">
                        مغادرة
                    </button>
                    <div className="flex gap-2 sm:gap-4 overflow-x-auto custom-scrollbar flex-1 justify-center hide-scrollbar">
                        <span className="bg-slate-800 px-2 py-2 sm:px-4 rounded-xl text-teal-400 font-bold border border-slate-700 text-xs sm:text-base whitespace-nowrap"><span className="text-slate-400 mr-1 sm:mr-2">X: </span>{playerX || 'يُنتظر...'}</span>
                        <span className="bg-slate-800 px-2 py-2 sm:px-4 rounded-xl text-rose-400 font-bold border border-slate-700 text-xs sm:text-base whitespace-nowrap"><span className="text-slate-400 mr-1 sm:mr-2">O: </span>{playerO || 'يُنتظر...'}</span>
                    </div>
                    <div className="text-slate-300 font-bold bg-indigo-900/30 border border-indigo-500/30 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-base flex-shrink-0 whitespace-nowrap">
                        غرفة: <span className="text-indigo-300 tracking-wider ml-1">{roomId}</span>
                    </div>
                </div>

                {status === 'waiting' && (
                    <div className="text-center bg-slate-900/60 p-8 rounded-3xl border border-slate-800 backdrop-blur-sm mx-auto w-full">
                        <h2 className="text-2xl font-bold mb-4 text-slate-200">في انتظار اللاعبين...</h2>
                        <div className="flex justify-center flex-wrap gap-3 mb-8">
                            {players.map((p, i) => (
                                <span key={i} className="bg-slate-800 px-4 py-2 rounded-xl text-slate-300 font-medium border border-slate-700">
                                    {p.name}
                                </span>
                            ))}
                        </div>
                        {players.length >= 2 && (
                            <button
                                onClick={startGame}
                                className="bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-teal-500/20 transition-all transform hover:scale-105 animate-pulse"
                            >
                                ابدأ اللعبة
                            </button>
                        )}
                        {players.length < 2 && (
                            <p className="text-slate-500">نحتاج إلى لاعبين اثنين لبدء اللعبة.</p>
                        )}
                    </div>
                )}

                {status === 'playing' && (
                    <div className="flex flex-col items-center">
                        {winner ? (
                            <div className="mb-8 p-6 bg-slate-900/80 border border-yellow-500/30 rounded-2xl w-full text-center shadow-xl shadow-yellow-500/10">
                                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-2">
                                    {winner === 'draw' ? 'تعادل!' : `اللاعب ${winner} هو الفائز!`}
                                </h2>
                                <p className="text-slate-400">يمكنكم إنشاء غرفة جديدة للعب مرة أخرى.</p>
                            </div>
                        ) : (
                            <div className="mb-8 p-4 bg-slate-900/80 border border-slate-700 rounded-2xl w-full text-center shadow-lg">
                                <h2 className="text-2xl font-bold text-slate-200">
                                    دور اللاعب: <span className={xIsNext ? 'text-teal-400' : 'text-rose-400'}>{xIsNext ? 'X' : 'O'}</span>
                                    {isMyTurn() && <span className="ml-2 bg-indigo-600 text-white text-sm px-2 py-1 rounded-lg">دورك!</span>}
                                </h2>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 sm:p-6 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-sm">
                            {renderCell(0)} {renderCell(1)} {renderCell(2)}
                            {renderCell(3)} {renderCell(4)} {renderCell(5)}
                            {renderCell(6)} {renderCell(7)} {renderCell(8)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TicTacToeApp;
