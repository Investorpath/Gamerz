import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('trivia_token') || null);
    const [loading, setLoading] = useState(true);
    const isAdmin = user?.role === 'ADMIN';

    // Re-fetch user on load if token exists
    useEffect(() => {
        const fetchUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                } else {
                    // Token invalid or expired
                    logout();
                }
            } catch (err) {
                console.error("Auth verify error:", err);
                logout();
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [token]);

    const login = async (username, password) => {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('trivia_token', data.token);
        return data;
    };

    const register = async (username, password, displayName) => {
        const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, displayName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('trivia_token', data.token);
        return data;
    };

    const loginWithGoogle = async (credential) => {
        const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Google Login failed');

        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('trivia_token', data.token);
        return data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('trivia_token');
    };

    const mockCheckout = async ({ gameId, packageId }) => {
        if (!token) throw new Error("Not authenticated");

        const payload = {};
        if (gameId) payload.gameId = gameId;
        if (packageId) payload.packageId = packageId;

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

        // Refresh user context to get updated ownerships
        const userRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
            setUser(await userRes.json());
        }
        return data;
    };

    return (
        <AuthContext.Provider value={{ user, token, isAdmin, loading, login, loginWithGoogle, register, logout, mockCheckout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
