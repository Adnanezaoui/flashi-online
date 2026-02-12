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
let roundInterval = null;
let timeLeft = 15;

// --------------------
// Images and differences
// --------------------
const LEVELS = [
  {
    left: "https://i.imgur.com/qn4Vnkp.jpg", // غرفة
    right: "https://i.imgur.com/qn4Vnkp_diff.jpg",
    diffs: [{x:0.2,y:0.3},{x:0.5,y:0.6},{x:0.7,y:0.2}]
  },
  {
    left: "https://i.imgur.com/NXh1uKX.jpg", // صالة
    right: "https://i.imgur.com/NXh1uKX_diff.jpg",
    diffs: [{x:0.3,y:0.5},{x:0.6,y:0.4},{x:0.8,y:0.7},{x:0.1,y:0.2}]
  },
  {
    left: "https://i.imgur.com/ABcD123.jpg", // طبيعة
    right: "https://i.imgur.com/ABcD123_diff.jpg",
    diffs: [{x:0.25,y:0.25},{x:0.5,y:0.5},{x:0.75,y:0.75},{x:0.1,y:0.8},{x:0.9,y:0.2}]
  }
  // أضف المزيد حسب الحاجة
];

// --------------------
// Socket.io
// --------------------
io.on('connection', socket => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('joinGame', ({name}) => {
    players.push({ id: socket.id, name, score:0 });
    io.emit('updatePlayers', players);
  });

  socket.on('foundDiff', () => {
    const player = players.find(p => p.id === socket.id);
    if(player && gameActive) {
      player.score += 1;
      io.emit('updatePlayers', players);
    }
  });

  socket.on('startRound', () => {
    if(gameActive) return;
    gameActive = true;
    timeLeft = 15;

    io.emit('roundStart', { level: currentLevel, image: LEVELS[currentLevel], time: timeLeft });

    roundInterval = setInterval(()=>{
      timeLeft--;
      io.emit('timer', timeLeft);

      if(timeLeft <= 0){
        clearInterval(roundInterval);
        gameActive = false;

        io.emit('roundEnd', players.sort((a,b)=>b.score - a.score));

        setTimeout(()=>{
          currentLevel = (currentLevel + 1) % LEVELS.length;
          players.forEach(p=>p.score = 0);
          io.emit('updatePlayers', players);
          io.emit('nextRoundReady');
        }, 5000);
      }
    }, 1000);
  });

  socket.on('disconnect', () => {
    players = players.filter(p=>p.id !== socket.id);
    io.emit('updatePlayers', players);
  });
});

server.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
