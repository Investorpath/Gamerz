import React from 'react';

const shapes = [
    { color: 'bg-red-500', hoverColor: 'hover:bg-red-600', icon: '🔺' },
    { color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', icon: '🔷' },
    { color: 'bg-yellow-400', hoverColor: 'hover:bg-yellow-500', icon: '🟡' },
    { color: 'bg-green-500', hoverColor: 'hover:bg-green-600', icon: '🟩' }
];

const CahootPlayerView = ({
    handleLeave, roomId, myScore, gameState, hasAnswered,
    submitAnswer, correctAnswerIndex, myAnswerIndex
}) => {
    return (
        <div className="h-screen w-screen bg-slate-100 flex flex-col absolute inset-0 font-['Cairo']">
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

                {gameState === 'revealing_answer' && hasAnswered && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white z-20">
                        {myAnswerIndex === correctAnswerIndex ? (
                            <div className="bg-teal-500 w-full h-full flex flex-col items-center justify-center">
                                <div className="text-6xl mb-6">✅</div>
                                <h2 className="text-4xl font-black mb-4">إجابة صحيحة!</h2>
                            </div>
                        ) : (
                            <div className="bg-rose-500 w-full h-full flex flex-col items-center justify-center">
                                <div className="text-6xl mb-6">❌</div>
                                <h2 className="text-4xl font-black mb-4">إجابة خاطئة!</h2>
                            </div>
                        )}
                    </div>
                )}
                {/* ... Add other states like finished ... */}
            </div>
        </div>
    );
};

export default CahootPlayerView;
