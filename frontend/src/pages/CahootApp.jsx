import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

import CahootJoinView from '../components/Cahoot/CahootJoinView';
import CahootHostView from '../components/Cahoot/CahootHostView';
import CahootPlayerView from '../components/Cahoot/CahootPlayerView';

function CahootApp() {
    const { user } = useAuth();
    const socket = useSocket();
    const [roomId, setRoomId] = useState('');
    const [inRoom, setInRoom] = useState(false);
    const [gameState, setGameState] = useState('waiting');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const joinId = urlParams.get('join');
        if (joinId && joinId.length === 6) {
            setRoomId(joinId.toUpperCase());
            // If we have a user and socket, we can try to auto-join
            if (user && socket) {
                socket.emit('join_room', {
                    roomId: joinId.toUpperCase(),
                    playerName: user.displayName,
                    gameType: 'cahoot',
                    userId: user.id
                });
                setInRoom(true);
            }
        }
    }, [user, socket]);

    // Room Data
    const [players, setPlayers] = useState([]);
    const [hostId, setHostId] = useState(null);

    // Game Data
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [timer, setTimer] = useState(0);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [myAnswerIndex, setMyAnswerIndex] = useState(null);

    // Host metrics
    const [answersReceivedCount, setAnswersReceivedCount] = useState({ count: 0, total: 0 });

    // Custom Questions
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customQuestions, setCustomQuestions] = useState([]);

    useEffect(() => {
        if (!socket) return;

        socket.on('game_error', (msg) => alert(msg));
        socket.on('room_host', (hid) => setHostId(hid));
        socket.on('update_players', (list) => setPlayers(list.sort((a, b) => b.score - a.score)));
        socket.on('game_status', (status) => {
            setGameState(status);
            if (status === 'question_active') {
                setHasAnswered(false);
                setCorrectAnswerIndex(null);
                setMyAnswerIndex(null);
                setAnswersReceivedCount({ count: 0, total: 0 });
            }
        });
        socket.on('timer', (t) => setTimer(t));
        socket.on('cahoot_question', (data) => setCurrentQuestion(data));
        socket.on('cahoot_answer_received', (data) => setAnswersReceivedCount(data));
        socket.on('cahoot_reveal', (idx) => setCorrectAnswerIndex(idx));
        socket.on('cahoot_podium', (list) => setPlayers(list.sort((a, b) => b.score - a.score)));

        return () => {
            socket.off('game_error');
            socket.off('room_host');
            socket.off('update_players');
            socket.off('game_status');
            socket.off('timer');
            socket.off('cahoot_question');
            socket.off('cahoot_answer_received');
            socket.off('cahoot_reveal');
            socket.off('cahoot_podium');
        };
    }, [socket]);

    const handleCreateRoom = () => {
        const id = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomId(id);
        socket.emit('join_room', { roomId: id, playerName: user?.displayName, gameType: 'cahoot', userId: user?.id });
        setInRoom(true);
    };

    const handleJoinRoom = () => {
        if (!roomId.trim()) return;
        socket.emit('join_room', { roomId, playerName: user?.displayName, gameType: 'cahoot', userId: user?.id });
        setInRoom(true);
    };

    const startGame = () => socket.emit('cahoot_start', roomId);
    const submitAnswer = (idx) => {
        if (hasAnswered || gameState !== 'question_active') return;
        setHasAnswered(true);
        setMyAnswerIndex(idx);
        socket.emit('cahoot_submit_answer', { roomId, answerIndex: idx });
    };
    const nextQuestion = () => socket.emit('cahoot_next_question', roomId);
    const showLeaderboard = () => socket.emit('cahoot_show_leaderboard', roomId);

    const handleLeave = () => {
        if (window.confirm("هل أنت متأكد من مغادرة اللعبة؟")) {
            if (socket) socket.disconnect();
            window.location.href = '/';
        }
    };

    const isHost = socket && socket.id === hostId;

    if (!inRoom) {
        return <CahootJoinView
            roomId={roomId}
            setRoomId={setRoomId}
            handleCreateRoom={handleCreateRoom}
            handleJoinRoom={handleJoinRoom}
        />;
    }

    if (isHost) {
        return <CahootHostView
            roomId={roomId}
            gameState={gameState}
            players={players}
            user={user}
            timer={timer}
            currentQuestion={currentQuestion}
            answersReceivedCount={answersReceivedCount}
            correctAnswerIndex={correctAnswerIndex}
            startGame={startGame}
            setShowCustomModal={setShowCustomModal}
            customQuestions={customQuestions}
            showLeaderboard={showLeaderboard}
            nextQuestion={nextQuestion}
            handleLeave={handleLeave}
        />;
    }

    return <CahootPlayerView
        handleLeave={handleLeave}
        roomId={roomId}
        myScore={players.find(p => p.name === user?.displayName)?.score || 0}
        gameState={gameState}
        hasAnswered={hasAnswered}
        submitAnswer={submitAnswer}
        correctAnswerIndex={correctAnswerIndex}
        myAnswerIndex={myAnswerIndex}
    />;
}

export default CahootApp;
