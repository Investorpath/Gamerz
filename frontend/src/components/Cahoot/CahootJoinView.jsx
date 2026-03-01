import React from 'react';

const CahootJoinView = ({ roomId, setRoomId, handleCreateRoom, handleJoinRoom }) => {
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
};

export default CahootJoinView;
