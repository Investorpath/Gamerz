import React, { useState, useEffect } from 'react';

function BundleSelectionModal({ isOpen, onClose, bundle, allGames, onConfirm }) {
    const [selectedGames, setSelectedGames] = useState([]);

    // Reset selection when modal opens/closes or bundle changes
    useEffect(() => {
        setSelectedGames([]);
    }, [isOpen, bundle]);

    if (!isOpen || !bundle) return null;

    // Filter to only show premium games (ones with a price)
    const availableGames = allGames.filter(g => g.price !== "مجاناً" && !g.isPackage);
    const requiredCount = bundle.targetCount;

    const toggleGameSelection = (gameId) => {
        setSelectedGames(prev => {
            if (prev.includes(gameId)) {
                return prev.filter(id => id !== gameId);
            } else {
                if (prev.length < requiredCount) {
                    return [...prev, gameId];
                }
                return prev;
            }
        });
    };

    const handleConfirm = () => {
        if (selectedGames.length === requiredCount) {
            onConfirm(selectedGames);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm rtl font-['Cairo']">
            <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl relative overflow-hidden flex flex-col text-right h-[80vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors text-xl bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center"
                >
                    ✕
                </button>

                <div className="mb-6 border-b border-slate-700 pb-4 pr-10">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <span>{bundle.icon}</span> {bundle.title}
                    </h2>
                    <p className="text-slate-400">
                        الرجاء اختيار {requiredCount} ألعاب لإضافتها إلى باقتك.
                        <span className="mr-2 text-indigo-400 font-bold">
                            (تم اختيار {selectedGames.length} من {requiredCount})
                        </span>
                    </p>
                </div>

                {/* Games Selection Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableGames.map(game => {
                            const isSelected = selectedGames.includes(game.id);
                            return (
                                <div
                                    key={game.id}
                                    onClick={() => toggleGameSelection(game.id)}
                                    className={`relative cursor-pointer rounded-2xl p-4 border-2 transition-all ${isSelected
                                            ? 'border-indigo-500 bg-indigo-900/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                            : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                                        }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-3 left-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                                            ✓
                                        </div>
                                    )}
                                    <div className="text-4xl mb-3 text-center">{game.icon}</div>
                                    <h3 className="font-bold text-white text-lg text-center mb-1">{game.title}</h3>
                                    <p className="text-slate-400 text-xs text-center line-clamp-2">{game.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-slate-700 mt-auto">
                    <button
                        onClick={handleConfirm}
                        disabled={selectedGames.length !== requiredCount}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-2 ${selectedGames.length === requiredCount
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        متابعة لإتمام الشراء
                    </button>
                </div>

            </div>
        </div>
    );
}

export default BundleSelectionModal;
