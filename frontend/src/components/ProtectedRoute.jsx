import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, gameId }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect completely out if not logged in
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const FREE_GAMES = ['trivia', 'tictactoe'];

    if (gameId && !FREE_GAMES.includes(gameId) && !user.ownedGames?.includes(gameId)) {
        // Redirect to Hub if logged in but don't own the game
        return <Navigate to="/" replace />;
    }

    // Authenticated and Owns the game
    return children;
}

export default ProtectedRoute;
