const admin = require('firebase-admin');

// In production, use SERVICE_ACCOUNT_PATH or the actual JSON content in an env var
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');

if (Object.keys(serviceAccount).length > 0 || process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    console.warn("Firebase Admin NOT initialized: Missing credentials in .env");
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
