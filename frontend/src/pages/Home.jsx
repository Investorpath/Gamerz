import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GameCard from '../components/GameCard';
import PurchaseModal from '../components/PurchaseModal';
import { useAuth } from '../context/AuthContext';
import BundleSelectionModal from '../components/BundleSelectionModal';

function Home() {
    const { user, logout, isAdmin } = useAuth();
    const [selectedGameToPurchase, setSelectedGameToPurchase] = useState(null);
    const [selectedBundleForSelection, setSelectedBundleForSelection] = useState(null);
    const games = [
        {
            id: "trivia",
            title: "تحدي المعرفة",
            description: "اختبر معلوماتك في مجالات مختلفة وتحدى أصدقائك في الوقت الفعلي في مجالات الجغرافيا والطعام وثقافة سبيستون.",
            tags: ["متعدد اللاعبين", "أسئلة"],
            to: "/trivia",
            active: true,
            icon: "🧠",
            price: "مجاناً",
            previewImages: [
                "https://placehold.co/600x400/1e1b4b/a78bfa?text=Trivia+Gameplay",
                "https://placehold.co/600x400/1e1b4b/a78bfa?text=Trivia+Leaderboard"
            ]
        },
        {
            id: "imposter",
            title: "المحتال (Spyfall)",
            description: "لعبة كشف الخداع! الجميع يعرف المكان السري باستثناء شخص واحد... هل تستطيع كشفه قبل أن يكشف المكان؟",
            tags: ["جماعية", "ألغاز", "تواصل"],
            to: "/imposter",
            active: true,
            icon: "🕵️‍♂️",
            price: "$2.99",
            previewImages: [
                "https://placehold.co/600x400/0f172a/3b82f6?text=Imposter+Lobby",
                "https://placehold.co/600x400/0f172a/3b82f6?text=Imposter+Role+Reveal"
            ]
        },
        {
            id: "charades",
            title: "بدون كلام (Charades)",
            description: "لعبة تمثيل الكلمات الكلاسيكية! مثل الكلمة لفريقك بدون ما تنطق ولا حرف قبل ما يخلص الوقت.",
            tags: ["عائلية", "تمثيل", "ضحك"],
            to: "/charades",
            active: true,
            icon: "🎭",
            price: "$1.99",
            previewImages: [
                "https://placehold.co/600x400/450a0a/fcd34d?text=Charades+Word",
                "https://placehold.co/600x400/450a0a/fcd34d?text=Charades+Scoreboard"
            ]
        },
        {
            id: "jeopardy",
            title: "سؤال وجواب (Jeopardy)",
            description: "تحدي المعلومات الأكبر! اختر الفئة والقيمة، وكن أول من يضغط الزر لتجيب على السؤال وتربح النقاط.",
            tags: ["معلومات", "سرعة البديهة", "تنافسي"],
            to: "/jeopardy",
            active: true,
            icon: "📺",
            price: "$4.99",
            previewImages: [
                "https://placehold.co/600x400/172554/fef08a?text=Jeopardy+Board",
                "https://placehold.co/600x400/172554/fef08a?text=Jeopardy+Question"
            ]
        },
        {
            id: "same_same",
            title: "أهم حاجة النية",
            description: "لعبة إبداعية ومضحكة! اكتب جملة واحدة تناسب موقفين مختلفين تماماً، واقنع الحكم بأن إجابتك هي العبقرية الحقيقية.",
            tags: ["إبداع", "ضحك", "جماعية"],
            to: "/samesame",
            active: true,
            icon: "🎭",
            price: "$3.99",
            previewImages: [
                "https://placehold.co/600x400/9d174d/fbcfe8?text=Same+Same+Scenarios",
                "https://placehold.co/600x400/9d174d/fbcfe8?text=Same+Same+Winning+Answer"
            ]
        },
        {
            id: "tictactoe",
            title: "إكس أو (Tic Tac Toe)",
            description: "صراع العقول الكلاسيكي! اختر X أو O وتحدى صديقك في لعبة الذكاء السريعة.",
            tags: ["كلاسيكية", "ثنائية", "تفكير"],
            to: "/tictactoe",
            active: true,
            icon: "❌⭕",
            price: "مجاناً",
            previewImages: [
                "https://placehold.co/600x400/1e293b/38bdf8?text=Tic+Tac+Toe"
            ]
        },
        {
            id: "cahoot",
            title: "كاهوت! (Cahoot)",
            description: "لعبة تفاعلية حماسية تعتمد على سرعة البديهة! كن الأسرع في الإجابة واصعد إلى قمة المنصة.",
            tags: ["تفاعلية", "سرعة", "جماعية"],
            to: "/cahoot",
            active: true,
            icon: "🚀",
            price: "$3.99",
            previewImages: [
                "https://placehold.co/600x400/312e81/fbbf24?text=Cahoot+Question",
                "https://placehold.co/600x400/312e81/fbbf24?text=Cahoot+Podium"
            ]
        },
        {
            id: "seenjeem",
            title: "سين جيم",
            description: "صراع السرعة! اقرأ السؤال واكتب الإجابة بأسرع ما يمكن لتكسب أعلى النقاط.",
            tags: ["كتابة", "سرعة", "تنافسي"],
            to: "/seenjeem",
            active: true,
            icon: "✍️",
            price: "$1.99",
            previewImages: [
                "https://placehold.co/600x400/4c1d95/f472b6?text=Seen+Jeem+Typing",
                "https://placehold.co/600x400/4c1d95/f472b6?text=Seen+Jeem+Results"
            ]
        }
    ];

    const packages = [
        {
            id: "party_bundle",
            title: "باقة الحفلات (Party Bundle)",
            description: "شاملة لأربعة ألعاب مميزة: المحتال، بدون كلام، كاهوت، وسؤال وجواب. الخيار الأفضل لتجمعات الأصدقاء والعائلة!",
            tags: ["باقة توفيرية", "٤ ألعاب"],
            isPackage: true,
            active: true,
            icon: "🎉",
            price: "$9.99",
            originalPrice: "$13.96",
            previewImages: [
                "https://placehold.co/800x400/451a03/fcd34d?text=Party+Bundle+Games",
                "https://placehold.co/800x400/451a03/fcd34d?text=Save+Big"
            ]
        },
        {
            id: "bundle_3",
            title: "باقة المشكلة (3 ألعاب)",
            description: "اختر أي 3 ألعاب مميزة من اختيارك ووفر أكثر!",
            tags: ["باقة مرنة", "٣ ألعاب"],
            isPackage: true,
            isDynamic: true,
            active: true,
            targetCount: 3,
            icon: "🛍️",
            price: "$6.99",
            originalPrice: "$10.97"
        },
        {
            id: "bundle_5",
            title: "باقة التوفير الكبير (5 ألعاب)",
            description: "اختر 5 ألعاب مميزة من اختيارك ووفر أكثر!",
            tags: ["باقة مرنة", "٥ ألعاب"],
            isPackage: true,
            isDynamic: true,
            active: true,
            targetCount: 5,
            icon: "💎",
            price: "$9.99",
            originalPrice: "$14.95"
        },
        {
            id: "bundle_all",
            title: "باقة السهرة الشاملة (كل الألعاب)",
            description: "افتح جميع الألعاب المميزة بضغطة زر واحدة واحصل على تجربة اللعب الكاملة!",
            tags: ["الفئة الذهبية", "كل الألعاب"],
            isPackage: true,
            active: true,
            isDynamic: false,
            icon: "👑",
            price: "$12.99",
            originalPrice: "$16.95"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white font-['Cairo'] flex flex-col relative overflow-hidden">

            {/* Dynamic Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDelay: '4s' }}></div>

                {/* Subtle Grid Pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6bTAgMHY0MGgxVjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-30"></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative z-10 pt-6 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
                {/* Navbar */}
                <nav className="flex justify-between items-center mb-16 w-full">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500 flex items-center gap-2">
                        🎮 منصة الألعاب
                    </div>
                    <div>
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-slate-300 font-bold hidden md:inline">مرحباً، {user.displayName}</span>
                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        className="bg-gradient-to-r from-red-600/80 to-orange-600/80 hover:from-red-500 hover:to-orange-500 text-white font-bold py-2 px-4 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all border border-red-400/30 flex items-center gap-2"
                                    >
                                        <span>🛡️</span> لوحة الإدارة
                                    </Link>
                                )}
                                <button
                                    onClick={logout}
                                    className="bg-slate-800 hover:bg-red-900/40 text-red-400 border border-slate-700 hover:border-red-500/50 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                                >
                                    تسجيل الخروج
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <Link to="/login" className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all">
                                    تسجيل الدخول
                                </Link>
                                <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md transition-shadow">
                                    حساب جديد
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Header Section */}
                <header className="text-center mb-16 md:mb-24">
                    <div className="inline-block mb-4 relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full blur opacity-20"></div>
                        <span className="relative text-5xl md:text-7xl">🎮</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-lg">
                        منصة الألعاب العربية
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium">
                        اختر لعبتك المُفضلة، أنشئ غرفة، وتحدى أصدقائك في الوقت الفعلي!
                    </p>
                </header>

                {/* Special Offers Section */}
                <div className="w-full max-w-7xl px-4 md:px-8 mt-12 mb-8 z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="text-4xl">🌟</span> باقات وعروض خاصة
                        </h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/50 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {packages.map((pkg) => (
                            <div key={pkg.id} className="relative group perspective-1000">
                                {/* Highlight effect for packages */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-3xl blur opacity-30 group-hover:opacity-60 group-hover:duration-200 transition duration-1000 animate-pulse"></div>
                                <GameCard
                                    {...pkg}
                                    onPurchase={() => {
                                        if (pkg.isDynamic) {
                                            setSelectedBundleForSelection(pkg);
                                        } else {
                                            setSelectedGameToPurchase(pkg);
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Games Grid Container */}
                <div className="w-full max-w-7xl px-4 md:px-8 pb-20 mt-8 mb-auto z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-3xl font-bold text-slate-300 flex items-center gap-3">
                            <span className="text-4xl">🕹️</span> جميع الألعاب
                        </h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {games.map((game) => (
                            <GameCard
                                key={game.id}
                                {...game}
                                onPurchase={() => setSelectedGameToPurchase(game)}
                            />
                        ))}
                    </div>
                </div>

            </div>

            {/* Bundle Selection Modal */}
            <BundleSelectionModal
                isOpen={!!selectedBundleForSelection}
                onClose={() => setSelectedBundleForSelection(null)}
                bundle={selectedBundleForSelection}
                allGames={games}
                onConfirm={(selectedGameIds) => {
                    const bundleToPurchase = {
                        ...selectedBundleForSelection,
                        selectedGames: selectedGameIds
                    };
                    setSelectedBundleForSelection(null);
                    setSelectedGameToPurchase(bundleToPurchase);
                }}
            />

            {/* Purchase Modal */}
            <PurchaseModal
                isOpen={!!selectedGameToPurchase}
                onClose={() => setSelectedGameToPurchase(null)}
                game={selectedGameToPurchase}
                allGames={games}
            />

            {/* Footer */}
            <footer className="w-full py-6 mt-12 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-md z-10 text-center text-slate-500 font-medium">
                <p className="font-bold flex items-center justify-center gap-2">
                    تم التطوير بحب <span>❤️</span> لمنصة الألعاب العربية
                </p>
                <p className="text-sm mt-2">© {new Date().getFullYear()} جميع الحقوق محفوظة.</p>
            </footer>
        </div>
    );
}

export default Home;
