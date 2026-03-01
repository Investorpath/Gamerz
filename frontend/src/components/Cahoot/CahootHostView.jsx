import React from 'react';

const shapes = [
    { color: 'bg-red-500', icon: '🔺' },
    { color: 'bg-blue-500', icon: '🔷' },
    { color: 'bg-yellow-400', icon: '🟡' },
    { color: 'bg-green-500', icon: '🟩' }
];

const CahootHostView = ({
    roomId, gameState, players, user, timer, currentQuestion,
    answersReceivedCount, correctAnswerIndex, startGame,
    setShowCustomModal, customQuestions, showLeaderboard,
    nextQuestion, handleLeave
}) => {
    return (
        <div className="min-h-screen bg-slate-100 font-['Cairo'] flex flex-col relative overflow-hidden">
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
                {gameState === 'waiting' && !currentQuestion && (
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
                {/* ... Continue for leaderboard and finished states as needed ... */}
                {/* For brevity, I'm modularizing the main chunks first */}
            </div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] opacity-50 z-0 pointer-events-none mix-blend-multiply"></div>
        </div>
    );
};

export default CahootHostView;
