import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithCredential,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('trivia_token') || null);
    const [loading, setLoading] = useState(true);
    const isAdmin = user?.role === 'ADMIN';

    // Sync with Firebase Auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Get ID token for backend verification
                const idToken = await firebaseUser.getIdToken();
                setToken(idToken);
                localStorage.setItem('trivia_token', idToken);

                // Check Firestore for additional user data (role, username)
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    setUser({ id: firebaseUser.uid, ...userDoc.data() });
                } else {
                    // Fallback to basic info if doc doesn't exist yet
                    setUser({
                        id: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        role: 'USER'
                    });
                }
            } else {
                setUser(null);
                setToken(null);
                localStorage.removeItem('trivia_token');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    };

    const register = async (email, password, displayName) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create profile in Firestore
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        const userData = {
            username,
            displayName,
            email,
            role: 'USER',
            createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', user.uid), userData);

        // Also notify backend to send welcome email
        try {
            const idToken = await user.getIdToken();
            await fetch(`${BACKEND_URL}/api/auth/register-sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ displayName })
            });
        } catch (e) {
            console.error("Welcome email sync failed", e);
        }

        return user;
    };

    const loginWithGoogle = async (credential) => {
        // credential here is the Google ID Token from @react-oauth/google
        const fbCredential = GoogleAuthProvider.credential(credential);
        const userCredential = await signInWithCredential(auth, fbCredential);
        const user = userCredential.user;

        // Ensure user document exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const username = user.email.split('@')[0] + Math.floor(1000 + Math.random() * 9000);
            await setDoc(userRef, {
                username,
                displayName: user.displayName || 'Google User',
                email: user.email,
                role: 'USER',
                createdAt: new Date().toISOString()
            });
        }

        return user;
    };

    const loginWithApple = async (credential) => {
        // For Apple, we'd typically use Firebase's Apple auth provider
        // but since we already have a credential from the existing UI:
        // This would need specific Firebase Apple Credential mapping
        throw new Error("Apple Login migration in progress. Please use Email or Google for now.");
    };

    const logout = () => {
        return signOut(auth);
    };

    const mockCheckout = async ({ gameId, packageId, selectedGames }) => {
        if (!token) throw new Error("Not authenticated");

        const payload = { gameId, packageId, selectedGames };

        const res = await fetch(`${BACKEND_URL}/api/checkout/mock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Checkout failed');

        // Refresh state locally
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) setUser({ id: user.id, ...userDoc.data() });

        return data;
    };

    return (
        <AuthContext.Provider value={{ user, token, isAdmin, loading, login, loginWithGoogle, loginWithApple, register, logout, mockCheckout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
