import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TriviaApp from './pages/TriviaApp';
import ImposterApp from './pages/ImposterApp';
import CharadesApp from './pages/CharadesApp';
import JeopardyApp from './pages/JeopardyApp';
import TicTacToeApp from './pages/TicTacToeApp';
import CahootApp from './pages/CahootApp';
import SeenJeemApp from './pages/SeenJeemApp';
import SameSameApp from './pages/SameSameApp';
import KalimatApp from './pages/KalimatApp';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import TermsAndConditions from './pages/TermsAndConditions';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
function App() {
    return (
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
                    <Route path="/seenjeem" element={
                        <ProtectedRoute gameId="seenjeem">
                            <SeenJeemApp />
                        </ProtectedRoute>
                    } />
                    <Route path="/samesame" element={
                        <ProtectedRoute gameId="same_same">
                            <SameSameApp />
                        </ProtectedRoute>
                    } />
                    <Route path="/kalimat" element={
                        <ProtectedRoute gameId="kalimat">
                            <KalimatApp />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                        <AdminDashboard />
                    } />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <UserDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/terms" element={<TermsAndConditions />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
