const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');
const { isAuthenticated, sanitizeInput } = require('../securityMiddleware');

router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.userId).get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        const ownershipsSnap = await db.collection('ownerships').where('userId', '==', req.user.userId).get();
        const ownedGames = ownershipsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            expiresAt: doc.data().expiresAt.toDate ? doc.data().expiresAt.toDate() : doc.data().expiresAt
        }));

        res.json({
            ...userDoc.data(),
            ownedGames
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

router.post('/profile', isAuthenticated, async (req, res) => {
    try {
        const { displayName, age } = req.body;
        const updates = {};
        if (displayName) updates.displayName = sanitizeInput(displayName);
        if (age) updates.age = parseInt(age);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        await db.collection('users').doc(req.user.userId).update(updates);
        res.json({ message: 'Profile updated successfully', updates });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
