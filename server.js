const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = []; // {id, name, totalScore, roundScore}
let roundActive = false;
let roundTime = 15;
let timerInterval = null;

// -----------------
// صور جاهزة حقيقية
const images = [
  {left:'https://i.imgur.com/1.jpg', right:'https://i.imgur.com/1.jpg', diff:5},
  {left:'https://i.imgur.com/2.jpg', right:'https://i.imgur.com/2.jpg', diff:5},
  {left:'https://i.imgur.com/3.jpg', right:'https://i.imgur.com/3.jpg', diff:5},
  {left:'https://i.imgur.com/4.jpg', right:'https://i.imgur.com/4.jpg', diff:6},
  {left:'https://i.imgur.com/5.jpg', right:'https://i.imgur.com/5.jpg', diff:6},
  {left:'https://i.imgur.com/6.jpg', right:'https://i.imgur.com/6.jpg', diff:7},
  {left:'https://i.imgur.com/7.jpg', right:'https://i.imgur.com/7.jpg', diff:7},
  {left:'https://i.imgur.com/8.jpg', right:'https://i.imgur.com/8.jpg', diff:8},
  {left:'https://i.imgur.com/9.jpg', right:'https://i.imgur.com/9.jpg', diff:8}
];
let currentImageIndex = 0;

// -----------------
io.on('connection', socket=>{
  console.log('A user connected', socket.id);

  socket.on('joinGame', ({name})=>{
    let player = players.find(p=>p.id===socket.id);
    if(!player) {
      players.push({id:socket.id,name,totalScore:0,roundScore:0});
    }
    io.emit('updatePlayers', players);
  });

  socket.on('foundDiff', ()=>{
    if(!roundActive) return;
    let player = players.find(p=>p.id===socket.id);
    if(player){
      player.roundScore += 1;
      player.totalScore += 1;
      io.emit('updatePlayers', players);
    }
  });

  socket.on('startRound', ()=>{
    if(roundActive) return;
    startRound();
  });

  socket.on('stopRound', ()=>{
    clearInterval(timerInterval);
    roundActive=false;
  });

  socket.on('disconnect', ()=>{
    players = players.filter(p=>p.id!==socket.id);
    io.emit('updatePlayers', players);
  });
});

function startRound(){
  roundActive = true;
  players.forEach(p=>p.roundScore=0);
  let img = images[currentImageIndex % images.length];
  io.emit('roundStart',{image:img,time:roundTime});
  let timeLeft = roundTime;

  timerInterval = setInterval(()=>{
    timeLeft--;
    io.emit('timer', timeLeft);
    if(timeLeft <=0){
      clearInterval(timerInterval);
      roundActive=false;
      // نهاية الجولة
      io.emit('roundEnd', players.map(p=>{
        return {name:p.name, roundScore:p.roundScore, totalScore:p.totalScore};
      }));
      // 10 ثوان لعرض النتائج
      setTimeout(()=>{
        currentImageIndex++;
        io.emit('nextRoundReady');
        startRound();
      },10000);
    }
  },1000);
}

http.listen(3000, ()=>console.log('Server running on http://localhost:3000'));
