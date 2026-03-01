import React from 'react';
import { useNavigate } from 'react-router-dom';

function TermsAndConditions() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-white font-['Cairo'] rtl flex flex-col items-center p-6 pb-20">
            <div className="max-w-3xl w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 backdrop-blur-sm shadow-2xl animate-fade-in mt-10">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-bold"
                >
                    <span>➔</span> العودة
                </button>

                <h1 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    الشروط والأحكام
                </h1>

                <div className="space-y-6 text-slate-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. قبول الشروط</h2>
                        <p>باستخدامك لمنصة ألعابنا، فإنك توافق على الالتزام بشروط الخدمة هذه بالكامل. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام المنصة.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. حسابات المستخدمين</h2>
                        <p>أنت مسؤول عن الحفاظ على سرية بيانات حسابك وعن جميع الأنشطة التي تحدث تحت حسابك. يجب أن تكون المعلومات المقدمة عند التسجيل دقيقة وحديثة.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. المشتريات والاشتراكات</h2>
                        <p>جميع المشتريات داخل التطبيق نهائية وغير قابلة للاسترداد إلا في حالات محددة يقررها النظام. توفر الحزم وصولاً مؤقتاً أو دائماً كما هو موضح في وقت الشراء.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. السلوك المقبول</h2>
                        <p>يمنع استخدام المنصة لأي غرض غير قانوني أو لنشر محتوى مسيء أو التحرش بالمستخدمين الآخرين. يحق للإدارة حظر أي حساب يخالف هذه القواعد.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. حماية البيانات</h2>
                        <p>نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية وفقاً لسياسة الخصوصية المتبعة لدينا.</p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
                    آخر تحديث: {new Date().toLocaleDateString('ar-EG')}
                </div>
            </div>
        </div>
    );
}

export default TermsAndConditions;
