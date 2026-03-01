import { useState, useEffect } from 'react';
import Game from '../components/Game';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

// Connect to backend
import { BACKEND_URL } from '../config';

function TriviaApp() {
  const { user } = useAuth();
  const socket = useSocket();
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameStatus, setGameStatus] = useState('waiting');
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState(null);

  // Refs to avoid stale closures in socket listeners
  const inRoomRef = useRef(inRoom);
  const roomIdRef = useRef(roomId);
  const playerNameRef = useRef(playerName);

  useEffect(() => {
    inRoomRef.current = inRoom;
    roomIdRef.current = roomId;
    playerNameRef.current = playerName;
  }, [inRoom, roomId, playerName]);

  useEffect(() => {
    if (user && !playerName) {
      setPlayerName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    // 1. Setup Listeners
    socket.on('connect', () => {
      if (inRoomRef.current && roomIdRef.current) {
        socket.emit('join_room', {
          roomId: roomIdRef.current,
          playerName: playerNameRef.current,
          gameType: 'trivia',
          userId: user?.id
        });
      }
    });

    socket.on('update_players', (playersList) => {
      setPlayers(playersList);
    });

    socket.on('game_status', (status) => {
      setGameStatus(status);
    });

    socket.on('room_host', (id) => {
      setHostId(id);
    });

    socket.on('game_error', (msg) => {
      alert(msg);
      setInRoom(false);
    });

    // 2. Initial Join/Auto-join
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');
    if (joinId && joinId.length === 6 && user) {
      const rid = joinId.toUpperCase();
      setRoomId(rid);
      socket.emit('join_room', {
        roomId: rid,
        playerName: user.displayName,
        gameType: 'trivia',
        userId: user.id
      });
      setInRoom(true);
    }

    return () => {
      socket.off('connect');
      socket.off('update_players');
      socket.off('game_status');
      socket.off('room_host');
      socket.off('game_error');
    };
  }, [socket, user]);

  const handleJoinOrCreate = (e) => {
    e.preventDefault();
    if (socket && roomId && playerName) {
      socket.emit('join_room', { roomId, playerName, gameType: 'trivia', userId: user?.id });
      setInRoom(true);
    }
  };

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(randomId);
  };

  const handleStartGame = () => {
    socket.emit('start_game', roomId);
  };

  const handleLeave = () => {
    if (window.confirm("هل أنت متأكد من مغادرة اللعبة؟")) {
      socket.disconnect();
      window.location.href = '/';
    }
  };

  if (inRoom) {
    if (gameStatus === 'playing' || gameStatus === 'finished') {
      return <Game socket={socket} roomId={roomId} players={players} gameStatus={gameStatus} handleLeave={handleLeave} />;
    }

    // Lobby View
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white font-['Cairo'] relative">
        <button onClick={handleLeave} className="absolute top-6 left-6 bg-rose-600/80 hover:bg-rose-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg backdrop-blur-sm transition-transform active:scale-95 z-50 flex items-center gap-2 border border-rose-400/30">
          <span>⬅️</span> خروج من الغرفة
        </button>

        <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-indigo-500/30 text-center mt-12">
          <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-l from-yellow-400 to-amber-200">غرفة الانتظار</h1>
          <p className="text-lg text-indigo-200 mb-2">رمز الغرفة: <span className="font-mono text-2xl font-bold text-teal-400 bg-teal-900/30 px-3 py-1 rounded inline-block dir-ltr tracking-widest">{roomId}</span></p>
          <p className="text-sm text-slate-400 mb-8">شارك هذا الرمز مع أصدقائك للانضمام!</p>

          <div className="bg-slate-700/50 rounded-2xl p-4 mb-8">
            <h2 className="text-xl font-bold text-teal-300 mb-4 border-b border-slate-600 pb-2">اللاعبون المتصلون: {players.length}</h2>
            <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {players.map((p, idx) => (
                <li key={idx} className="bg-slate-800 text-slate-200 py-2 px-4 rounded-xl flex items-center shadow-inner text-lg">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center -ms-2 me-3 shadow-md border-2 border-slate-800">👤</span>
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
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-900 font-bold text-xl py-4 px-6 rounded-2xl shadow-lg shadow-yellow-500/30 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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

  // Landing / Create Room View
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 text-white font-['Cairo'] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/10 rounded-full blur-[120px]"></div>
      </div>

      <button onClick={() => window.location.href = '/'} className="absolute top-6 left-6 bg-slate-800/80 hover:bg-slate-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg backdrop-blur-sm transition-transform active:scale-95 z-50 flex items-center gap-2 border border-slate-600/50">
        <span>⬅️</span> العودة للرئيسية
      </button>

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-8 md:p-10 shadow-[0_0_50px_rgba(79,70,229,0.3)] border border-indigo-500/20 z-10 mt-12">

        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 pb-2 text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-500 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-tight">
            تحدي المعرفة
          </h1>
          <p className="text-indigo-200 text-lg md:text-xl font-medium">العب مع أصدقائك في أي وقت!</p>
        </div>

        <form onSubmit={handleJoinOrCreate} className="space-y-6">
          <div className="space-y-2 relative">
            <label className="block text-teal-300 font-bold text-sm px-2">اسم اللاعب</label>
            <input
              type="text"
              placeholder="اكتب اسمك هنا..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={!!user}
              className={`w-full text-white text-lg rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-slate-500 border transition-all shadow-inner ${user ? 'bg-slate-700/50 border-slate-600 cursor-not-allowed opacity-80' : 'bg-slate-800/80 border-slate-700'}`}
              required
            />
            {user && <span className="absolute left-4 top-1/2 mt-1 text-teal-400 text-sm">✓ مسجل</span>}
          </div>

          <div className="space-y-2">
            <label className="block text-yellow-300 font-bold text-sm px-2">رمز الغرفة (للانضمام)</label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="XXXXXX"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full bg-slate-800/80 text-white text-lg rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-slate-500 border border-slate-700 transition-all text-center tracking-widest uppercase font-mono shadow-inner dir-ltr"
                maxLength={6}
              />
              <button
                type="button"
                onClick={generateRoomId}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-2xl whitespace-nowrap shadow-lg shadow-indigo-600/30 transition-all active:scale-95 border border-indigo-400 flex flex-col items-center justify-center text-sm"
              >
                <span className="text-2xl mb-1">🎲</span>
                غرفة جديدة
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-2xl py-5 px-6 rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.4)] transform transition-all active:scale-95 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              🎮 هيا نلعب!
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
          </button>
        </form>
      </div>
    </div>
  );
}

export default TriviaApp;
