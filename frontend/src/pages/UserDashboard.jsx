import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { BACKEND_URL } from '../config';

function UserDashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Edit form states
    const [displayName, setDisplayName] = useState('');
    const [age, setAge] = useState('');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [token, navigate]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch profile");
            const data = await res.json();
            setProfile(data);
            setDisplayName(data.displayName || '');
            setAge(data.age || '');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`${BACKEND_URL}/api/user/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ displayName, age })
            });
            if (!res.ok) throw new Error("فشل تحديث البيانات");
            setSuccess("تم تحديث البيانات بنجاح!");
            fetchProfile(); // Refresh
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="animate-spin text-4xl text-indigo-500">⏳</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white font-['Cairo'] rtl flex flex-col pb-20">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-6 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        لوحتي الشخصية
                    </h1>
                    <div className="flex gap-4">
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors py-2 px-4 rounded-xl font-bold">الرئيسية</Link>
                        <button onClick={logout} className="bg-red-900/20 text-red-400 hover:bg-red-900/40 py-2 px-4 rounded-xl border border-red-500/20 font-bold transition-all">تسجيل الخروج</button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

                {/* Profile Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 h-fit shadow-2xl">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg border-4 border-slate-800">
                            {displayName?.[0] || 'U'}
                        </div>
                        <h2 className="text-2xl font-bold">{profile?.displayName}</h2>
                        <p className="text-slate-400 text-sm">@{profile?.username}</p>
                        <span className="mt-3 bg-indigo-900/40 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20">
                            {profile?.role === 'ADMIN' ? 'مدير النظام' : 'عضو مبدع'}
                        </span>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-widest">الاسم المستعار</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-widest">العمر</label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={updating}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                        >
                            {updating ? 'جاري التحديث...' : 'حفظ التغييرات'}
                        </button>
                    </form>

                    {error && <p className="text-red-400 text-xs mt-4 text-center">{error}</p>}
                    {success && <p className="text-green-400 text-xs mt-4 text-center">{success}</p>}
                </div>

                {/* Games Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-end mb-2 px-2">
                        <h2 className="text-3xl font-black">ألعابك المفعلة 🎮</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile?.ownedGames?.length > 0 ? (
                            profile.ownedGames.map((game) => (
                                <div key={game.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-indigo-900/30 transition-colors">
                                            <span className="text-2xl">✨</span>
                                        </div>
                                        <Link
                                            to={`/${game.gameId}`}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
                                        >
                                            إلعب الآن
                                        </Link>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">{game.gameId}</h3>
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                        <span>ينتهي في:</span>
                                        <span className="text-indigo-400 dir-ltr">{new Date(game.expiresAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center">
                                <p className="text-4xl mb-4">🛒</p>
                                <h3 className="text-xl font-bold text-slate-400 mb-2">لا تملك أي ألعاب حالياً</h3>
                                <Link to="/" className="text-indigo-400 hover:underline font-bold">تصفح الألعاب المتاحة</Link>
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}

export default UserDashboard;
