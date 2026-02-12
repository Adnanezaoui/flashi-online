const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = [];
let currentRound = 1;
let maxRounds = 10;

io.on('connection',(socket)=>{

  socket.on('playerJoin', ({name})=>{
    let existing = players.find(p=>p.name===name);
    if(!existing) players.push({name,score:0});
    io.emit('updatePlayers', players);
  });

  socket.on('adminJoin', ({name})=>{
    let existing = players.find(p=>p.name===name);
    if(!existing) players.push({name,score:0});
    io.emit('updatePlayers', players);
  });

  socket.on('startRound', ({round})=>{
    currentRound = round;
    // Pick images
    let leftImage = `https://picsum.photos/seed/${round*2}/600/400`;
    let rightImage = `https://picsum.photos/seed/${round*2+1}/600/400`;
    // Differences
    let differences = [];
    for(let i=0;i<5;i++){
      differences.push({x:Math.random()*300, y:Math.random()*200});
    }
    io.emit('startRoundClient',{round,leftImage,rightImage,differences});
  });

  socket.on('click', ({x,y,player,round})=>{
    io.emit('markDifference',{x,y});
    let p = players.find(p=>p.name===player);
    if(p) p.score += 1;
    io.emit('updatePlayers', players);
  });

  socket.on('endRound', ({round})=>{
    io.emit('showResults', players);
  });

  socket.on('stopRound', ()=>{
    io.emit('showResults', players);
  });

});

http.listen(3000,()=>console.log("Server running on port 3000"));
