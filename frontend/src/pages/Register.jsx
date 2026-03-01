import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppleSignin from 'react-apple-signin-auth';

function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register, loginWithGoogle, loginWithApple } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await register(email, password, displayName, username, age);
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

    const handleAppleSuccess = async (response) => {
        if (!response.authorization || !response.authorization.id_token) {
            setError('Apple Login Failed: Missing token');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await loginWithApple(response.authorization.id_token);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white font-['Cairo'] relative overflow-hidden">
            {/* Dynamic Premium Background Orbs - Teal/Emerald Theme */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-600/20 rounded-full blur-[120px] animate-pulse-glow pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '-3s' }}></div>
            <div className="absolute top-[20%] left-[10%] w-32 h-32 bg-indigo-500/20 rounded-full blur-[60px] animate-float pointer-events-none"></div>
            <div className="absolute bottom-[20%] right-[10%] w-40 h-40 bg-cyan-500/10 rounded-full blur-[80px] animate-float-delayed pointer-events-none"></div>

            <div className="max-w-md w-full glass-card rounded-[2.5rem] p-8 md:p-10 shadow-2xl z-10 animate-reveal" style={{ borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                <div className="text-center mb-8 stagger-1 animate-reveal">
                    <div className="w-20 h-20 bg-gradient-to-tr from-teal-500 to-indigo-500 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-lg shadow-teal-500/20 hover:scale-110 transition-transform cursor-pointer">
                        🎮
                    </div>
                    <h1 className="text-4xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-indigo-400 tracking-tight">
                        إنشاء حساب
                    </h1>
                    <p className="text-slate-400 font-medium">انضم إلينا وابدأ بالتحدي!</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-2xl mb-8 text-sm flex items-center gap-3 animate-reveal">
                        <span className="text-xl">⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-1 stagger-2 animate-reveal">
                        <label className="block text-slate-300 font-bold text-xs px-2">البريد الإلكتروني</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors">📧</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full premium-input text-white rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-left dir-ltr"
                                placeholder="email@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 stagger-2 animate-reveal">
                        <label className="block text-slate-300 font-bold text-xs px-2">اسم المستخدم (للولوج)</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors">👤</span>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full premium-input text-white rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-left dir-ltr"
                                placeholder="username"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 stagger-3 animate-reveal">
                            <label className="block text-slate-300 font-bold text-xs px-2">الاسم المعروض</label>
                            <input
                                type="text"
                                required
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full premium-input text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                placeholder="عمر"
                            />
                        </div>
                        <div className="space-y-1 stagger-3 animate-reveal">
                            <label className="block text-slate-300 font-bold text-xs px-2">العمر</label>
                            <input
                                type="number"
                                required
                                min="5"
                                max="100"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                className="w-full premium-input text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                placeholder="25"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 stagger-4 animate-reveal">
                        <label className="block text-slate-300 font-bold text-xs px-2">كلمة المرور</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors">🔒</span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full premium-input text-white rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-left dir-ltr"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-4 h-14 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 bg-[length:200%_auto] hover:bg-right text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-teal-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center text-lg stagger-5 animate-reveal"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                        ) : 'سجل الآن'}
                    </button>
                </form>

                <p className="mt-8 text-center text-slate-400 text-sm stagger-5 animate-reveal">
                    لديك حساب مسبقاً؟ {' '}
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4 transition-colors">
                        تسجيل الدخول
                    </Link>
                </p>

                <div className="mt-4 text-center text-slate-500 text-xs stagger-5 animate-reveal">
                    بالتسجيل، أنت توافق على <Link to="/terms" className="text-teal-400 hover:text-teal-300 underline font-bold transition-colors">الشروط والأحكام</Link> الخاصة بنا.
                </div>

                <div className="mt-8 stagger-5 animate-reveal">
                    <div className="relative flex items-center gap-4 text-slate-600 mb-8">
                        <div className="flex-grow h-[1px] bg-slate-800"></div>
                        <span className="text-xs font-bold uppercase tracking-widest bg-slate-900/50 px-2">أو المتابعة عبر</span>
                        <div className="flex-grow h-[1px] bg-slate-800"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={async () => {
                                setIsLoading(true);
                                setError('');
                                try {
                                    await loginWithGoogle();
                                    navigate('/');
                                } catch (err) {
                                    setError(err.message);
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] border border-white/10 hover:border-white/20 group"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="flex-grow text-center text-sm">المتابعة عبر Google</span>
                        </button>

                        <div className="w-full">
                            <AppleSignin
                                authOptions={{
                                    clientId: import.meta.env.VITE_APPLE_CLIENT_ID || 'com.gameshub.app',
                                    scope: 'email name',
                                    redirectURI: window.location.origin,
                                    state: 'state',
                                    nonce: 'nonce',
                                    usePopup: true,
                                }}
                                uiType="dark"
                                className="apple-auth-btn-custom"
                                noDefaultStyle={false}
                                buttonExtraChildren="المتابعة عبر Apple"
                                onSuccess={handleAppleSuccess}
                                onError={(error) => setError('Apple Login Failed')}
                                render={(props) => (
                                    <button
                                        onClick={props.onClick}
                                        className="w-full flex items-center justify-center gap-3 bg-black text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] border border-white/10 hover:border-white/20 group"
                                    >
                                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform fill-current" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.1-77.5-19.1-36.9 0-71 21.1-100.2 62.4-51.5 73.1-41 190.5-2.1 270.4 18.5 37 42.1 79.5 81.3 78.4 44.5-.2 54.3-27 101.9-27 47.7 0 57.5 27.5 102.2 26.6 40.2-.8 62.1-39.2 81-67.2 11.2-16.4 16.6-26.6 16.6-26.6-113.8-44.3-128.4-203.4-13.6-263.8zM245.8 81.9c20.9-25.5 33.5-60.8 30.1-96.9-32.8 1.3-66 22.4-86.8 46.9-19 22.5-35.1 57.3-30.8 91.9 36.3 2.8 66.6-16.4 87.5-41.9z" /></svg>
                                        <span className="flex-grow text-center text-sm">المتابعة عبر Apple</span>
                                    </button>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
