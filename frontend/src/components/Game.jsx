import { useState, useEffect } from 'react';

function Game({ socket, roomId, players, gameStatus, handleLeave }) {
    const [question, setQuestion] = useState(null);
    const [timer, setTimer] = useState(0);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    useEffect(() => {
        socket.on('new_question', (q) => {
            setQuestion(q);
            setCorrectAnswer(null);
            setSelectedAnswer(null);
        });

        socket.on('timer', (time) => {
            setTimer(time);
        });

        socket.on('correct_answer', (answerIdx) => {
            setCorrectAnswer(answerIdx);
        });

        return () => {
            socket.off('new_question');
            socket.off('timer');
            socket.off('correct_answer');
        };
    }, [socket]);

    const handleAnswer = (index) => {
        if (selectedAnswer === null && correctAnswer === null) {
            setSelectedAnswer(index);
            socket.emit('submit_answer', { roomId, answerIndex: index });
        }
    };

    // Find current player score
    const myPlayerInfo = players.find(p => p.name === players.find(myP => myP.id === socket.id)?.name) ||
        players.find(p => p.answerSubmitted !== undefined); // Fallback for simple demo

    if (gameStatus === 'finished') {
        // Sort players by score descending
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 text-white font-['Cairo']">
                <div className="max-w-xl w-full bg-slate-800/90 backdrop-blur-xl rounded-[2rem] p-10 shadow-2xl border-4 border-yellow-500/50 text-center relative overflow-hidden">

                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl"></div>

                    <h1 className="text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 relative z-10 drop-shadow-lg">
                        🏆 انتهت اللعبة!
                    </h1>

                    <div className="space-y-4 relative z-10">
                        {sortedPlayers.map((p, idx) => (
                            <div
                                key={idx}
                                className={`flex justify-between items-center p-5 rounded-2xl shadow-md text-xl font-bold ${idx === 0
                                    ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-400 text-yellow-300 transform scale-105'
                                    : 'bg-slate-700/50 text-slate-200 border border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${idx === 0 ? 'bg-yellow-500 text-slate-900 shadow-[0_0_15px_rgba(234,179,8,0.5)]' :
                                        idx === 1 ? 'bg-slate-300 text-slate-800' :
                                            idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800'
                                        }`}>
                                        {idx === 0 ? '👑' : idx + 1}
                                    </span>
                                    <span>{p.name}</span>
                                </div>
                                <span className="font-mono text-2xl bg-slate-900/50 px-4 py-1 rounded-xl">{p.score} <span className="text-sm text-slate-400 font-sans leading-none">نقطة</span></span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-2xl w-full shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 text-xl"
                    >
                        🔄 العودة للرئيسية
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white font-['Cairo'] flex flex-col md:flex-row overflow-hidden relative">

            {/* Background blobs for "game" feel */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 p-4 md:p-8 flex flex-col justify-center items-center relative z-10 w-full mb-[12rem] md:mb-0">

                {/* Leave Button */}
                <div className="absolute top-4 left-4 z-50">
                    <button onClick={handleLeave} className="bg-rose-600/80 hover:bg-rose-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg backdrop-blur-sm transition-transform active:scale-95 flex items-center gap-2 border border-rose-400/30 text-sm md:text-base">
                        <span>⬅️</span> خروج
                    </button>
                </div>

                {/* Header / Meta */}
                <div className="w-full max-w-3xl flex justify-between items-center mb-8 bg-slate-800/60 backdrop-blur-md p-4 rounded-3xl border border-slate-700 mt-12 md:mt-4">
                    <div className="bg-indigo-900/80 text-indigo-200 px-6 py-2 rounded-2xl font-bold flex flex-col items-center border border-indigo-500/30">
                        <span className="text-xs uppercase tracking-wider text-indigo-400 mb-1">الغرفة</span>
                        <span className="font-mono text-xl dir-ltr">{roomId}</span>
                    </div>

                    {/* Central Timer */}
                    <div className="relative flex items-center justify-center">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${timer <= 5 ? 'border-red-500 bg-red-500/20 text-red-500 animate-pulse' : 'border-teal-400 bg-teal-900/40 text-teal-300'}`}>
                            <span className="text-4xl font-black font-mono leading-none">{timer}</span>
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                {question ? (
                    <div className="w-full max-w-3xl bg-slate-800/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-600/50 flex flex-col pt-16 relative">

                        {/* Category Badge */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-2 rounded-full shadow-lg border-2 border-slate-800">
                            <span className="text-yellow-300 font-bold text-lg tracking-wide">{question.category}</span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10 leading-relaxed text-white drop-shadow-md">
                            {question.question}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.options.map((opt, idx) => {
                                let btnStyle = "bg-slate-700 hover:bg-slate-600 border-slate-500 text-slate-100 shadow-md";

                                // If answer revealed, highlight correct/wrong
                                if (correctAnswer !== null) {
                                    if (idx === correctAnswer) {
                                        btnStyle = "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105 z-10";
                                    } else if (idx === selectedAnswer) {
                                        btnStyle = "bg-red-600 border-red-500 text-white opacity-80";
                                    } else {
                                        btnStyle = "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
                                    }
                                } else if (selectedAnswer === idx) {
                                    // highlight selected before reveal
                                    btnStyle = "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] ring-4 ring-indigo-500/50 scale-105";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={selectedAnswer !== null || correctAnswer !== null}
                                        className={`
                      ${btnStyle}
                      border-2 rounded-2xl py-6 px-4 text-xl md:text-2xl font-bold transition-all duration-300
                      ${correctAnswer === null && selectedAnswer === null ? 'active:scale-95' : 'cursor-default'}
                      flex items-center justify-center relative overflow-hidden group
                    `}
                                    >
                                        {/* Option Index Bubble */}
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/50 flex items-center justify-center text-sm text-slate-400 font-mono">
                                            {idx + 1}
                                        </span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Wait message */}
                        {selectedAnswer !== null && correctAnswer === null && (
                            <div className="mt-8 text-center text-indigo-300 animate-pulse font-bold text-lg">
                                ⏳ في انتظار باقي اللاعبين...
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-2xl text-slate-400 animate-pulse font-bold">جاري تحميل السؤال...</div>
                )}
            </div>

            {/* Leaderboard Sidebar / Bottom Sheet */}
            <div className="fixed bottom-0 left-0 w-full md:relative md:w-80 bg-slate-900/95 backdrop-blur-2xl border-t md:border-t-0 md:border-r border-slate-700 p-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none z-50">
                <h3 className="text-xl font-bold text-teal-400 mb-6 flex items-center gap-3 border-b border-slate-700 pb-3">
                    <span className="text-3xl">📊</span> لوحة الصدارة
                </h3>
                <ul className="space-y-3 overflow-y-auto custom-scrollbar flex-1 max-h-[30vh] md:max-h-full pb-4">
                    {[...players].sort((a, b) => b.score - a.score).map((p, idx) => (
                        <li key={idx} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex justify-between items-center shadow-inner relative overflow-hidden group hover:bg-slate-700/80 transition-colors">
                            {/* Highlight current player */}
                            {p.name === myPlayerInfo?.name && <div className="absolute left-0 top-0 h-full w-1 bg-teal-400"></div>}

                            <div className="flex flex-col">
                                <span className={`font-bold text-lg truncate w-32 ${p.name === myPlayerInfo?.name ? 'text-teal-300' : 'text-slate-200'}`}>
                                    {p.name}
                                </span>
                                {/* Answer status indicator */}
                                <span className="text-xs text-slate-500 mt-1">
                                    {p.answerSubmitted ? '✅ أجاب' : '⏳ يفكر...'}
                                </span>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl px-3 py-1 font-mono text-xl font-bold text-yellow-400 border border-slate-800/50">
                                {p.score}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    );
}

export default Game;
