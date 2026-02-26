import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TriviaApp from './pages/TriviaApp';
import ImposterApp from './pages/ImposterApp';
import CharadesApp from './pages/CharadesApp';
import JeopardyApp from './pages/JeopardyApp';
import TicTacToeApp from './pages/TicTacToeApp';
import CahootApp from './pages/CahootApp';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id';

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/trivia" element={
                            <ProtectedRoute gameId="trivia">
                                <TriviaApp />
                            </ProtectedRoute>
                        } />
                        <Route path="/imposter" element={
                            <ProtectedRoute gameId="imposter">
                                <ImposterApp />
                            </ProtectedRoute>
                        } />
                        <Route path="/charades" element={
                            <ProtectedRoute gameId="charades">
                                <CharadesApp />
                            </ProtectedRoute>
                        } />
                        <Route path="/jeopardy" element={
                            <ProtectedRoute gameId="jeopardy">
                                <JeopardyApp />
                            </ProtectedRoute>
                        } />
                        <Route path="/tictactoe" element={
                            <ProtectedRoute gameId="tictactoe">
                                <TicTacToeApp />
                            </ProtectedRoute>
                        } />
                        <Route path="/cahoot" element={
                            <ProtectedRoute gameId="cahoot">
                                <CahootApp />
                            </ProtectedRoute>
                        } />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
