import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

function Register() {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await register(username, password, displayName);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setError('');
        try {
            await loginWithGoogle(credentialResponse.credential);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white font-['Cairo'] relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-teal-500/30 z-10 w-full">
                <div className="text-center mb-10">
                    <Link to="/" className="text-4xl mb-6 inline-block hover:scale-110 transition-transform">🎮</Link>
                    <h1 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-500">
                        إنشاء حساب
                    </h1>
                    <p className="text-slate-400">انضم إلينا وابدأ بالتحدي!</p>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-slate-300 font-bold text-sm px-2">اسم المستخدم للولوج (إنجليزي)</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-slate-700 dir-ltr text-right"
                            placeholder="johndoe123"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-slate-300 font-bold text-sm px-2">الاسم المعروض في اللعبة</label>
                        <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-slate-700"
                            placeholder="عمر بطل العالم"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-slate-300 font-bold text-sm px-2">كلمة المرور</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-slate-700 dir-ltr text-right"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-900 font-bold py-4 px-6 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-70 flex justify-center items-center"
                    >
                        {isLoading ? 'جاري الإنشاء...' : 'سجل الآن'}
                    </button>
                </form>

                <p className="mt-8 text-center text-slate-400 text-sm">
                    لديك حساب مسبقاً؟ {' '}
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold underline">
                        تسجيل الدخول
                    </Link>
                </p>

                <div className="mt-8">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-900 text-slate-500">أو المتابعة عبر</span>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Registration Failed')}
                            useOneTap
                            theme="filled_black"
                            shape="pill"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
