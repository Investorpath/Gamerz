const jwt = require('jsonwebtoken');
const xss = require('xss');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

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
const isAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId, username, displayName, role }
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

const isAdmin = (req, res, next) => {
    isAuthenticated(req, res, () => {
        if (req.user && req.user.role === 'ADMIN') {
            next();
        } else {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }
    });
};

// Socket.IO Middleware
const socketAuthenticator = (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (error) {
        return next(new Error('Authentication error: Invalid token'));
    }
};

module.exports = {
    isAuthenticated,
    isAdmin,
    socketAuthenticator,
    sanitizeInput,
    profanityFilter,
    JWT_SECRET
};
