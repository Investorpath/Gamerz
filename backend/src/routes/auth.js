const express = require('express');
const router = express.Router();
const { db, auth } = require('../firebaseAdmin');
const { isAuthenticated } = require('../securityMiddleware');
const { sendWelcomeEmail } = require('../emailService');

router.post('/register-sync', isAuthenticated, async (req, res) => {
    try {
        const { displayName, email, userId } = req.user;
        console.log(`Syncing registration for ${email} (UID: ${userId})`);
        if (email) {
            await sendWelcomeEmail(email, displayName || 'User');
        }
        res.json({ message: 'Registration synced successfully' });
    } catch (error) {
        console.error('Registration sync error:', error);
        res.status(500).json({ error: 'Failed to sync registration' });
    }
});

// Note: Google and Apple login logic currently resides in server.js 
// because it relies on some local constants and libraries. 
// For this cleanup, we are primarily moving the well-defined routes.
// Dead Prisma code will be removed from server.js instead of being moved.

module.exports = router;
