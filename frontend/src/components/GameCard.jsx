import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function GameCard({ id, title, description, tags, to, active, icon, price, onPurchase }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    // The game is owned if it's free, OR if it's in the user's ownedGames list
    const isOwned = price === "مجاناً" || user?.ownedGames?.includes(id);

    return (
        <div className={`relative rounded-3xl p-6 transition-all duration-300 transform ${active
            ? 'bg-slate-800/80 border-2 border-indigo-500/50 hover:border-teal-400 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(45,212,191,0.2)] cursor-pointer'
            : 'bg-slate-900/50 border-2 border-slate-700/50 opacity-60 grayscale cursor-not-allowed'
            }`}
        >
            {/* Glow Effect */}
            {active && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-teal-500/10 rounded-3xl opacity-0 hover:opacity-100 transition-opacity"></div>
            )}

            <div className="flex flex-col h-full relative z-10">
                {/* Header Icon & Title */}
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${active ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-slate-800 text-slate-500'
                        }`}>
                        {icon}
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-wide">{title}</h2>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag, idx) => (
                        <span key={idx} className={`text-xs font-bold px-3 py-1 rounded-full ${active ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 border border-slate-600 text-slate-500'
                            }`}>
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Description */}
                <p className={`text-sm mb-8 flex-1 leading-relaxed ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                    {description}
                </p>

                {/* Action Button */}
                {active ? (
                    isOwned ? (
                        <Link to={to} className="w-full">
                            <button className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-900 font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2">
                                <span>العب الآن</span>
                                <span>🎮</span>
                            </button>
                        </Link>
                    ) : (
                        <button
                            onClick={onPurchase}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2"
                        >
                            <span>شراء اللعبة - {price}</span>
                            <span>🛒</span>
                        </button>
                    )
                ) : (
                    <button disabled className="w-full bg-slate-800 text-slate-500 font-bold py-3 px-4 rounded-xl border border-slate-700">
                        قريباً
                    </button>
                )}
            </div>

            {/* "Coming Soon" Overlay Badge */}
            {!active && (
                <div className="absolute top-4 right-4 bg-slate-800 border border-slate-600 text-yellow-500/80 font-bold text-xs px-3 py-1 rounded-full shadow-md transform rotate-12">
                    قريباً
                </div>
            )}
        </div>
    );
}

export default GameCard;
