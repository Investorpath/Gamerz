import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { BACKEND_URL } from '../config';

function AdminDashboard() {
    const { user, token, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview'); // overview, users, rooms

    // Data States
    const [stats, setStats] = useState({ totalUsers: 0, totalPurchases: 0, activeRoomsCount: 0 });
    const [usersList, setUsersList] = useState([]);
    const [roomsList, setRoomsList] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            navigate('/');
        }
    }, [user, isAdmin, loading, navigate]);

    useEffect(() => {
        if (isAdmin && token) {
            fetchData();
            // Optional: Set interval to refresh live rooms every 10 seconds
            const interval = setInterval(fetchData, 10000);
            return () => clearInterval(interval);
        }
    }, [isAdmin, token, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            if (activeTab === 'overview') {
                const res = await fetch(`${BACKEND_URL}/api/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch stats");
                setStats(await res.json());
            }
            else if (activeTab === 'users') {
                const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch users");
                setUsersList(await res.json());
            }
            else if (activeTab === 'rooms') {
                const res = await fetch(`${BACKEND_URL}/api/admin/rooms`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch rooms");
                setRoomsList(await res.json());
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if (!window.confirm(`هل أنت متأكد من تغيير صلاحيات هذا المستخدم إلى ${newRole}؟`)) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/role`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });
            if (!res.ok) throw new Error("فشل في تحديث الصلاحيات");
            showSuccess("تم التحديث بنجاح!");
            fetchData(); // Refresh list
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("تحذير: هل أنت متأكد من حذف هذا المستخدم نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.")) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "فشل الحذف");
            showSuccess("تم حذف المستخدم");
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleForceCloseRoom = async (roomId) => {
        if (!window.confirm("هل أنت متأكد من إغلاق هذه الغرفة وطرد جميع اللاعبين؟")) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/rooms/${roomId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("فشل إغلاق الغرفة");
            showSuccess("تم إغلاق الغرفة بنجاح");
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    if (!isAdmin) return null; // Or a loading spinner while redirecting

    return (
        <div className="min-h-screen bg-slate-950 text-white font-['Cairo'] rtl flex flex-col relative overflow-hidden">

            {/* Header */}
            <header className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 flex items-center gap-2">
                        <span>🛡️</span> لوحة تحكم الإدارة
                    </h1>
                    <span className="bg-red-900/40 text-red-400 text-xs px-2 py-1 rounded font-bold border border-red-500/30">ADMIN MODE</span>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="bg-slate-800 hover:bg-slate-700 px-5 py-2 rounded-xl text-sm font-bold transition-colors border border-slate-700"
                >
                    العودة للموقع
                </button>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-6 gap-8 z-10">

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex flex-col gap-3 shrink-0">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`text-right px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'overview' ? 'bg-gradient-to-l from-indigo-600 to-purple-600 shadow-lg text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        📊 نظرة عامة
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`text-right px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-gradient-to-l from-indigo-600 to-purple-600 shadow-lg text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        👥 إدارة المستخدمين
                    </button>
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`text-right px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'rooms' ? 'bg-gradient-to-l from-indigo-600 to-purple-600 shadow-lg text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        🎮 الغرف النشطة (Live)
                    </button>
                </div>

                {/* Content Panel */}
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-sm min-h-[60vh] relative">

                    {/* Alerts */}
                    {error && <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6">{error}</div>}
                    {successMsg && <div className="bg-green-900/30 border border-green-500/50 text-green-200 px-4 py-3 rounded-xl mb-6">{successMsg}</div>}

                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-3xl z-20">
                            <div className="animate-spin text-4xl text-indigo-500">⏳</div>
                        </div>
                    ) : null}

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold mb-8 text-slate-200">إحصائيات المنصة</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
                                    <span className="text-5xl mb-4">👥</span>
                                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">إجمالي المستخدمين</span>
                                    <span className="text-4xl font-black text-white">{stats.totalUsers}</span>
                                </div>
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
                                    <span className="text-5xl mb-4">💳</span>
                                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">إجمالي المبيعات</span>
                                    <span className="text-4xl font-black text-green-400">{stats.totalPurchases}</span>
                                </div>
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                                    <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                                    <span className="text-5xl mb-4 relative z-10">🔴</span>
                                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2 relative z-10">غرف نشطة الآن</span>
                                    <span className="text-4xl font-black text-red-400 relative z-10">{stats.activeRoomsCount}</span>
                                </div>
                            </div>

                            {stats.popularity && (
                                <div className="mt-8 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold mb-4 text-slate-400">🔥 الألعاب الأكثر شعبية (إجمالي المبيعات)</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {Object.entries(stats.popularity).map(([game, count]) => (
                                            <div key={game} className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-3">
                                                <span className="font-bold text-indigo-400 uppercase tracking-widest text-sm">{game}</span>
                                                <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-black text-white">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="animate-fade-in flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-200">قاعدة بيانات المستخدمين</h2>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="بحث عن مستخدم..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors w-64"
                                    />
                                    <button onClick={fetchData} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg" title="تحديث">🔄</button>
                                </div>
                            </div>

                            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto flex-1">
                                <table className="w-full text-sm text-right">
                                    <thead className="text-xs text-slate-400 uppercase bg-slate-900 border-b border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">الاسم (يوزر)</th>
                                            <th className="px-6 py-4">البريد</th>
                                            <th className="px-6 py-4">المشتريات</th>
                                            <th className="px-6 py-4">تاريخ التسجيل</th>
                                            <th className="px-6 py-4">الصلاحية</th>
                                            <th className="px-6 py-4 text-center">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersList.filter(u =>
                                            u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map((u) => (
                                            <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 font-bold">
                                                    {u.displayName}
                                                    <span className="block text-xs font-normal text-slate-500 mt-1 dir-ltr text-right">@{u.username}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">{u.email || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-indigo-900/50 text-indigo-300 py-1 px-3 rounded-full text-xs font-bold border border-indigo-500/30">
                                                        {u._count.ownerships}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dir-ltr text-right">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {u.role === 'ADMIN' ? (
                                                        <span className="text-red-400 font-bold bg-red-900/30 px-2 py-1 rounded text-xs border border-red-500/20">مدير</span>
                                                    ) : (
                                                        <span className="text-slate-400 font-bold bg-slate-800 px-2 py-1 rounded text-xs">عضو</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {u.role === 'USER' && (
                                                            <button onClick={() => handleRoleChange(u.id, 'ADMIN')} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold transition-colors">ترقية لمدير</button>
                                                        )}
                                                        {u.role === 'ADMIN' && u.id !== user.id && (
                                                            <button onClick={() => handleRoleChange(u.id, 'USER')} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg font-bold transition-colors">تخفيض لعضو</button>
                                                        )}
                                                        {u.id !== user.id && (
                                                            <button onClick={() => handleDeleteUser(u.id)} className="text-xs bg-red-900/60 hover:bg-red-600 text-red-200 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-colors border border-red-500/30">حظر/حذف</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {usersList.length === 0 && <div className="p-8 text-center text-slate-500">لا يوجد مستخدمين</div>}
                            </div>
                        </div>
                    )}

                    {/* ROOMS TAB */}
                    {activeTab === 'rooms' && (
                        <div className="animate-fade-in h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-200 mb-1">المراقبة الحية (Live)</h2>
                                    <p className="text-sm text-slate-400">هذه القائمة تتحدث وتجلب الغرف النشطة حالياً في ذاكرة السيرفر.</p>
                                </div>
                                <button onClick={fetchData} className="bg-slate-800 hover:bg-slate-700 shadow-lg border border-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                    <span>🔄</span> تحديث
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {roomsList.map((r) => (
                                    <div key={r.id} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>

                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">رقم الغرفة</span>
                                                <span className="font-mono text-2xl text-pink-400 tracking-widest bg-pink-900/20 px-2 py-1 rounded inline-block dir-ltr">{r.id}</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${r.status === 'playing' ? 'bg-green-900/50 text-green-400 border-green-500/30' : 'bg-yellow-900/50 text-yellow-500 border-yellow-500/30'}`}>
                                                {r.status === 'playing' ? 'جارية 🔥' : 'انتظار ⏳'}
                                            </span>
                                        </div>

                                        <div className="flex gap-4 text-sm text-slate-300 mb-6 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                            <div className="flex-1">
                                                <span className="block text-slate-500 mb-1 text-xs">اللعبة</span>
                                                <span className="font-bold">{r.gameType}</span>
                                            </div>
                                            <div className="flex-1">
                                                <span className="block text-slate-500 mb-1 text-xs">اللاعبين</span>
                                                <span className="font-bold">{r.playerCount}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleForceCloseRoom(r.id)}
                                            className="w-full bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold py-3 rounded-xl transition-all shadow-lg text-sm flex justify-center items-center gap-2"
                                        >
                                            <span>🛑</span> إغلاق الغرفة وطرد اللاعبين
                                        </button>
                                    </div>
                                ))}

                                {roomsList.length === 0 && (
                                    <div className="col-span-full py-16 text-center bg-slate-950/50 rounded-2xl border border-slate-800 border-dashed">
                                        <p className="text-4xl mb-4">👻</p>
                                        <p className="text-slate-400 font-bold">لا توجد غرف نشطة حالياً.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}

export default AdminDashboard;
