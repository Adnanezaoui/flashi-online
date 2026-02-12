// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// Game state
let players = [];
let round = 0;
let roundActive = false;
let scores = {};
let roundTime = 15; // seconds
let countdown = null;

// Generate 300+ images
const totalImages = 300;
let images = [];
for (let i = 1; i <= totalImages; i++) {
    images.push({
        id: i,
        difficulty: i <= 50 ? "easy" : (i <= 150 ? "medium" : "hard"),
        differences: i <= 50 ? 5 : (i <= 150 ? 6 : 7),
        left: `https://source.unsplash.com/320x220/?nature&sig=${i}`,
        right: `https://source.unsplash.com/320x220/?nature&sig=${i+300}`
    });
}

// Socket.io connection
io.on('connection', socket => {
    console.log('Player connected:', socket.id);

    // New player joins
    socket.on('join', ({ name, isAdmin }) => {
        players.push({ id: socket.id, name, score: 0, totalScore: 0, isAdmin });
        io.emit('players', players);
        console.log(`${name} joined (Admin: ${isAdmin})`);
    });

    // Admin starts round
    socket.on('startRound', () => {
        if (!roundActive) startNextRound();
    });

    // Player found differences
    socket.on('foundDifference', ({ points }) => {
        let p = players.find(pl => pl.id === socket.id);
        if (p && roundActive) {
            p.score += points;
            p.totalScore += points;
            io.emit('players', players);
        }
    });

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit('players', players);
    });
});

// Start next round
function startNextRound() {
    roundActive = true;
    round++;
    players.forEach(p => p.score = 0); // reset round points
    const imageIndex = (round - 1) % totalImages;
    const image = images[imageIndex];

    io.emit('newRound', {
        round,
        roundTime,
        image
    });

    let timeLeft = roundTime;
    countdown = setInterval(() => {
        timeLeft--;
        io.emit('timer', timeLeft);
        if (timeLeft <= 0) {
            clearInterval(countdown);
            roundActive = false;
            io.emit('roundEnded', players.map(p => ({
                name: p.name,
                score: p.score,
                totalScore: p.totalScore
            })));

            // Wait 5 seconds then start next round
            setTimeout(startNextRound, 5000);
        }
    }, 1000);
}

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
