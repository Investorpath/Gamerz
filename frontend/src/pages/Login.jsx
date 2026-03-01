import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppleSignin from 'react-apple-signin-auth';

function Login() {
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginWithGoogle, loginWithApple } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(emailOrUsername, password);
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
            {/* Dynamic Premium Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-glow pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '-4s' }}></div>
            <div className="absolute top-[20%] right-[10%] w-32 h-32 bg-teal-500/20 rounded-full blur-[60px] animate-float pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-[10%] w-40 h-40 bg-pink-500/10 rounded-full blur-[80px] animate-float-delayed pointer-events-none"></div>

            <div className="max-w-md w-full glass-card rounded-[2.5rem] p-8 md:p-10 shadow-2xl z-10 animate-reveal">
                <div className="text-center mb-8 stagger-1 animate-reveal">
                    <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-lg shadow-indigo-500/20 hover:scale-110 transition-transform cursor-pointer">
                        🎮
                    </div>
                    <h1 className="text-4xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-indigo-300 to-purple-400 tracking-tight">
                        تسجيل الدخول
                    </h1>
                    <p className="text-slate-400 font-medium">مرحباً بعودتك إلى عالم التحدي</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-2xl mb-8 text-sm flex items-center gap-3 animate-reveal">
                        <span className="text-xl">⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2 stagger-2 animate-reveal">
                        <label className="block text-slate-300 font-bold text-sm px-2">البريد الإلكتروني أو اسم المستخدم</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">👤</span>
                            <input
                                type="text"
                                required
                                value={emailOrUsername}
                                onChange={(e) => setEmailOrUsername(e.target.value)}
                                className="w-full premium-input text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none dir-ltr text-right"
                                placeholder="email or username"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 stagger-3 animate-reveal">
                        <label className="block text-slate-300 font-bold text-sm px-2">كلمة المرور</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">🔒</span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full premium-input text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none dir-ltr text-right"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-4 h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center text-lg stagger-4 animate-reveal"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'دخول'}
                    </button>
                </form>

                <p className="mt-10 text-center text-slate-400 text-sm stagger-5 animate-reveal">
                    ليس لديك حساب؟ {' '}
                    <Link to="/register" className="text-teal-400 hover:text-teal-300 font-bold underline underline-offset-4 transition-colors">
                        أنشئ حساباً جديداً
                    </Link>
                </p>

                <div className="mt-4 text-center text-slate-500 text-xs stagger-5 animate-reveal">
                    باستخدامك للمنصة، أنت توافق على <Link to="/terms" className="text-indigo-400 hover:text-indigo-300 underline font-bold transition-colors">الشروط والأحكام</Link> الخاصة بنا.
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

export default Login;
