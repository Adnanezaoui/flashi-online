const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// --------------------
// Game State
// --------------------
let players = [];
let currentLevel = 0;
let gameActive = false;
let timeLeft = 15;
let roundInterval = null;

const TOTAL_LEVELS = 20; // توليد 20 صورة مختلفة للعبة
const IMAGES = [
    { left: "https://i.imgur.com/1.jpg", right: "https://i.imgur.com/1_diff.jpg", diffs: [{x:0.2,y:0.3},{x:0.7,y:0.5}] },
    { left: "https://i.imgur.com/2.jpg", right: "https://i.imgur.com/2_diff.jpg", diffs: [{x:0.4,y:0.4},{x:0.6,y:0.6}] },
    { left: "https://i.imgur.com/3.jpg", right: "https://i.imgur.com/3_diff.jpg", diffs: [{x:0.3,y:0.7},{x:0.8,y:0.2}] }
    // أضف 17 صورة أخرى بنفس النمط
];

// --------------------
// Socket.io
// --------------------
io.on('connection', socket => {
    console.log(`Player connected: ${socket.id}`);

    // اللاعب يدخل
    socket.on('joinGame', ({name}) => {
        players.push({ id: socket.id, name, score:0 });
        io.emit('updatePlayers', players);
        console.log(players.map(p=>p.name));
    });

    // نقر اللاعب على اختلاف
    socket.on('foundDiff', () => {
        const player = players.find(p => p.id === socket.id);
        if(player) player.score += 1;
        io.emit('updatePlayers', players);
    });

    // بدء الجولة (الأدمن فقط)
    socket.on('startRound', () => {
        if(gameActive) return;
        gameActive = true;
        timeLeft = 15;
        io.emit('roundStart', { level: currentLevel, image: IMAGES[currentLevel], time: timeLeft });

        roundInterval = setInterval(()=>{
            timeLeft--;
            io.emit('timer', timeLeft);

            if(timeLeft <= 0){
                clearInterval(roundInterval);
                gameActive = false;

                // إرسال نتائج الجولة
                io.emit('roundEnd', players.sort((a,b)=>b.score-a.score));

                // الانتظار 5 ثواني ثم الجولة التالية
                setTimeout(()=>{
                    currentLevel = (currentLevel + 1) % IMAGES.length;
                    players.forEach(p=>p.score=0); // إعادة نقاط الجولة
                    io.emit('updatePlayers', players);
                    io.emit('nextRoundReady');
                }, 5000);
            }
        }, 1000);
    });

    // Disconnect
    socket.on('disconnect', () => {
        players = players.filter(p=>p.id !== socket.id);
        io.emit('updatePlayers', players);
        console.log(`Player disconnected: ${socket.id}`);
    });
});

// --------------------
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
