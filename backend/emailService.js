const nodemailer = require('nodemailer');

// Configure the transporter
// In production, these should be set in .env
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const EMAIL_FROM = process.env.EMAIL_FROM || '"Games Hub" <noreply@gameshub.com>';

/**
 * Sends a welcome email to a newly registered user.
 * @param {string} to - User's email address
 * @param {string} displayName - User's display name
 */
async function sendWelcomeEmail(to, displayName) {
    if (!to) return; // Skip if no email provided (e.g. some social logins if not captured)

    const mailOptions = {
        from: EMAIL_FROM,
        to,
        subject: 'مرحباً بك في منصة الألعاب العربية! 🎮',
        html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>مرحباً ${displayName}! 👋</h2>
                <p>يسعدنا جداً انضمامك إلينا في منصة الألعاب العربية.</p>
                <p>استعد لتجربة ألعاب جماعية ممتعة مع أصدقائك في الوقت الفعلي.</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 10px; margin: 20px 0;">
                    <strong>ماذا يمكنك أن تفعل الآن؟</strong>
                    <ul>
                        <li>العب الألعاب المجانية مثل "تحدي المعرفة" و "إكس أو".</li>
                        <li>استكشف الألعاب المميزة مثل "المحتال" و "كاهوت".</li>
                        <li>أنشئ غرفاً خاصة وادعُ أصدقاءك للعب.</li>
                    </ul>
                </div>
                <p>نتمنى لك وقتاً ممتعاً!</p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 0.8em; color: #777;">هذا البريد تم إرساله تلقائياً، يرجى عدم الرد عليه.</p>
            </div>
        `
    };

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('--- Mock Email (Welcome) ---');
            console.log('To:', to);
            console.log('Subject:', mailOptions.subject);
            console.log('---------------------------');
            return;
        }
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${to}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
}

/**
 * Sends a purchase confirmation email.
 * @param {string} to - User's email address
 * @param {string} displayName - User's display name
 * @param {string[]} unlockedGames - List of game IDs unlocked
 */
async function sendPurchaseConfirmationEmail(to, displayName, unlockedGames) {
    if (!to) return;

    const gameNames = unlockedGames.map(id => {
        const names = {
            'imposter': 'المحتال (Spyfall)',
            'charades': 'بدون كلام (Charades)',
            'jeopardy': 'سؤال وجواب (Jeopardy)',
            'cahoot': 'كاهوت! (Cahoot)',
            'seenjeem': 'سين جيم (Seen Jeem)',
            'same_same': 'أهم حاجة النية'
        };
        return names[id] || id;
    }).join('، ');

    const mailOptions = {
        from: EMAIL_FROM,
        to,
        subject: 'تأكيد عملية الشراء - تم فتح ألعاب جديدة! 💳',
        html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>شكراً لك ${displayName}! 🎉</h2>
                <p>تمت عملية الشراء بنجاح، وقد تم فتح الوصول إلى الألعاب التالية:</p>
                <p style="font-size: 1.2em; font-weight: bold; color: #4338ca;">${gameNames}</p>
                <p>يمكنك الآن إنشاء غرف لهذه الألعاب ودعوة أصدقائك للعب فوراً.</p>
                <p>نتمنى لك تجربة حماسية!</p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 0.8em; color: #777;">هذا البريد تم إرساله تلقائياً للعمليات التجريبية.</p>
            </div>
        `
    };

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('--- Mock Email (Purchase) ---');
            console.log('To:', to);
            console.log('Items:', gameNames);
            console.log('----------------------------');
            return;
        }
        await transporter.sendMail(mailOptions);
        console.log(`Purchase confirmation email sent to ${to}`);
    } catch (error) {
        console.error('Error sending purchase email:', error);
    }
}

module.exports = {
    sendWelcomeEmail,
    sendPurchaseConfirmationEmail
};
