const express = require('express');
const router = express.Router();
const { db, admin } = require('../firebaseAdmin');
const { isAuthenticated } = require('../securityMiddleware');
const { sendPurchaseConfirmationEmail } = require('../emailService');

router.post('/mock', isAuthenticated, async (req, res) => {
    try {
        const { gameId, packageId, selectedGames } = req.body;
        const userId = req.user.userId;

        if (!gameId && !packageId) {
            return res.status(400).json({ error: 'gameId or packageId is required' });
        }

        const now = new Date();
        let gamesToUnlock = [];

        if (packageId === 'party_bundle') {
            gamesToUnlock = ['imposter', 'charades', 'cahoot', 'jeopardy'];
        } else if (packageId === 'bundle_all') {
            gamesToUnlock = ['imposter', 'charades', 'jeopardy', 'cahoot', 'seenjeem'];
        } else if (packageId === 'bundle_3' || packageId === 'bundle_5') {
            if (!selectedGames || !Array.isArray(selectedGames) || selectedGames.length === 0) {
                return res.status(400).json({ error: 'selectedGames array is required for this package' });
            }
            const expectedCount = packageId === 'bundle_3' ? 3 : 5;
            if (selectedGames.length !== expectedCount) {
                return res.status(400).json({ error: `You must select exactly ${expectedCount} games for this package` });
            }
            gamesToUnlock = selectedGames;
        } else if (gameId) {
            gamesToUnlock = [gameId];
        }

        const batch = db.batch();
        await Promise.all(gamesToUnlock.map(async (gId) => {
            const ownershipId = `${userId}_${gId}`;
            const ownershipRef = db.collection('ownerships').doc(ownershipId);
            const doc = await ownershipRef.get();

            let newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

            if (doc.exists) {
                const currentExpiresAt = doc.data().expiresAt.toDate ? doc.data().expiresAt.toDate() : new Date(doc.data().expiresAt);
                if (currentExpiresAt > now) {
                    newExpiresAt = new Date(currentExpiresAt.getTime() + 7 * 24 * 60 * 60 * 1000);
                }
            }

            batch.set(ownershipRef, {
                userId,
                gameId: gId,
                expiresAt: admin.firestore.Timestamp.fromDate(newExpiresAt),
                purchasedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }));

        await batch.commit();

        if (req.user.email) {
            sendPurchaseConfirmationEmail(req.user.email, req.user.displayName, gamesToUnlock);
        }

        res.json({ message: 'Purchase successful (Mock)', gamesUnlocked: gamesToUnlock });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: 'Checkout failed' });
    }
});

module.exports = router;
