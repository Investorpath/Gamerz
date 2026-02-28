const admin = require('firebase-admin');

// In production, use SERVICE_ACCOUNT_PATH or the actual JSON content in an env var
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : (process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH) : null);

if (serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin successfully initialized.");
    } catch (error) {
        console.error("Firebase Admin initialization FAILED:", error.message);
    }
} else {
    console.warn("Firebase Admin NOT initialized: Missing credentials (FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH) in .env");
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
