const xss = require('xss');
const { auth, db } = require('./firebaseAdmin');

// Arabic Profanity Filter (basic example list)
const badWords = [
    'حمار',
    'كلب',
    'غبي',
    'زفت',
    'قرد'
    // Add more extensive list as needed for production
];

const profanityFilter = (text) => {
    if (!text) return text;
    let filteredText = text;
    badWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, '***');
    });
    return filteredText;
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    // Prevent XSS
    let clean = xss(input);
    // Filter profanity
    clean = profanityFilter(clean);
    return clean;
};

// Express Middleware
const isAuthenticated = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await auth.verifyIdToken(token);

        // Fetch additional user info from Firestore (like role)
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.exists ? userDoc.data() : { role: 'USER' };

        req.user = {
            userId: decodedToken.uid,
            username: userData.username || decodedToken.email?.split('@')[0],
            displayName: userData.displayName || decodedToken.name || 'User',
            role: userData.role || 'USER',
            email: decodedToken.email
        };
        next();
    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

const isAdmin = async (req, res, next) => {
    await isAuthenticated(req, res, () => {
        if (req.user && req.user.role === 'ADMIN') {
            next();
        } else {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }
    });
};

// Socket.IO Middleware
const socketAuthenticator = async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }
    try {
        const decodedToken = await auth.verifyIdToken(token);

        // Fetch role/username from Firestore
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.exists ? userDoc.data() : { role: 'USER' };

        socket.user = {
            userId: decodedToken.uid,
            username: userData.username || decodedToken.email?.split('@')[0],
            displayName: userData.displayName || decodedToken.name || 'User',
            role: userData.role || 'USER',
            email: decodedToken.email
        };
        next();
    } catch (error) {
        console.error("Socket Auth Error:", error);
        return next(new Error('Authentication error: Invalid token'));
    }
};

module.exports = {
    isAuthenticated,
    isAdmin,
    socketAuthenticator,
    sanitizeInput,
    profanityFilter
};
