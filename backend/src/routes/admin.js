const express = require('express');
const router = express.Router();
const { db, admin } = require('../firebaseAdmin');
const { isAdmin } = require('../securityMiddleware');

router.get('/stats', isAdmin, async (req, res) => {
    try {
        const usersSnap = await db.collection('users').count().get();
        const ownershipsSnap = await db.collection('ownerships').count().get();

        // Note: activeRoomsCount will be passed from the main server via app.locals or similar if needed
        // For now, focusing on DB-driven stats
        const popularity = {};
        const allOwnerships = await db.collection('ownerships').get();
        allOwnerships.forEach(doc => {
            const gid = doc.data().gameId;
            popularity[gid] = (popularity[gid] || 0) + 1;
        });

        res.json({
            totalUsers: usersSnap.data().count,
            totalPurchases: ownershipsSnap.data().count,
            popularity
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

router.get('/users', isAdmin, async (req, res) => {
    try {
        const usersSnap = await db.collection('users').get();
        const userList = await Promise.all(usersSnap.docs.map(async doc => {
            const data = doc.data();
            const ownershipsCount = await db.collection('ownerships').where('userId', '==', doc.id).count().get();
            return {
                id: doc.id,
                ...data,
                ownershipsCount: ownershipsCount.data().count
            };
        }));
        res.json(userList);
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router;
