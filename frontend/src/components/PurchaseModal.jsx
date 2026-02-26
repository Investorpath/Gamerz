import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function PurchaseModal({ isOpen, onClose, game }) {
    const { user, mockCheckout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !game) return null;

    const handlePurchase = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (game.isPackage) {
                await mockCheckout({ packageId: game.id });
            } else {
                await mockCheckout({ gameId: game.id });
            }
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.message || "فشلت عملية الشراء");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm rtl font-['Cairo']">
            <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden text-white flex flex-col items-center text-center">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={loading || success}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                    ✕
                </button>

                {success ? (
                    <div className="py-8 animate-fade-in flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-4xl mb-4 border-2 border-green-500">
                            ✓
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">تم الشراء بنجاح!</h3>
                        <p className="text-slate-400">يمكنك الآن إنشاء غرف لهذه اللعبة.</p>
                    </div>
                ) : (
                    <>
                        <div className="text-6xl mb-4 drop-shadow-md">{game.icon}</div>
                        <h3 className="text-2xl font-bold mb-2">{game.title}</h3>
                        <p className="text-slate-400 mb-6 text-sm">{game.description}</p>

                        {game.isPackage && (
                            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 mb-6 w-full text-right">
                                <h4 className="text-amber-400 font-bold mb-2 text-sm">تتضمن هذه الباقة:</h4>
                                <ul className="text-slate-300 text-sm list-disc list-inside space-y-1">
                                    <li>لعبة المحتال (Spyfall)</li>
                                    <li>بدون كلام (Charades)</li>
                                    <li>كاهوت! (Cahoot)</li>
                                    <li>سؤال وجواب (Jeopardy)</li>
                                </ul>
                            </div>
                        )}

                        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 w-full mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-300">السعر:</span>
                                <div className="flex items-center gap-2">
                                    {game.originalPrice && <span className="text-lg text-slate-500 line-through dir-ltr">{game.originalPrice}</span>}
                                    <span className="text-2xl font-black text-green-400 dir-ltr">{game.price}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">وصول مدى الحياة</span>
                                <span className="text-slate-400">✅</span>
                            </div>
                        </div>

                        {error && <p className="text-red-400 mb-4 text-sm bg-red-900/20 p-2 rounded-lg border border-red-500/20 w-full">{error}</p>}

                        <button
                            onClick={handlePurchase}
                            disabled={loading}
                            className={`w-full font-bold py-4 rounded-xl text-lg shadow-lg transition-all flex justify-center items-center gap-2 ${loading
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white active:scale-95 shadow-green-500/20'
                                }`}
                        >
                            {loading ? (
                                <span className="animate-spin text-2xl">⏳</span>
                            ) : (
                                <>
                                    <span>💳</span> تأكيد الشراء
                                </>
                            )}
                        </button>

                        <p className="text-slate-500 text-xs mt-4">هذه عملية شراء تجريبية (Mock) ولن يتم خصم أي مبالغ حقيقية.</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default PurchaseModal;
