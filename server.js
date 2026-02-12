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
let roundTime = 15;
let countdown = null;

// Generate 300+ images
const totalImages = 300;
let images = [];
for(let i=1;i<=totalImages;i++){
    images.push({
        id:i,
        difficulty:i<=50?"easy":(i<=150?"medium":"hard"),
        left:`https://source.unsplash.com/320x220/?nature&sig=${i}`,
        right:`https://source.unsplash.com/320x220/?nature&sig=${i+300}`,
        differences:[ // sample positions (x,y relative 0-1)
            {x:0.2,y:0.3},
            {x:0.5,y:0.5},
            {x:0.7,y:0.2},
            {x:0.3,y:0.8},
            {x:0.6,y:0.7}
        ]
    });
}

// Socket.io connection
io.on('connection', socket=>{
    console.log('Player connected:', socket.id);

    socket.on('join',({name,isAdmin})=>{
        players.push({id:socket.id,name,score:0,totalScore:0,isAdmin});
        io.emit('players',players);
    });

    socket.on('startRound',()=>{
        if(!roundActive) startNextRound();
    });

    socket.on('foundDifference',({x,y})=>{
        let p = players.find(pl=>pl.id===socket.id);
        if(p && roundActive){
            p.score+=1;
            p.totalScore+=1;
            io.emit('players',players);
            io.emit('markDifference',{playerId:socket.id,x,y});
        }
    });

    socket.on('disconnect',()=>{
        players = players.filter(p=>p.id!==socket.id);
        io.emit('players',players);
    });
});

function startNextRound(){
    roundActive=true;
    round++;
    players.forEach(p=>p.score=0);
    const imageIndex=(round-1)%totalImages;
    const image=images[imageIndex];

    io.emit('newRound',{round,roundTime,image});

    let timeLeft=roundTime;
    countdown=setInterval(()=>{
        timeLeft--;
        io.emit('timer',timeLeft);
        if(timeLeft<=0){
            clearInterval(countdown);
            roundActive=false;
            io.emit('roundEnded',players.map(p=>({
                name:p.name,
                score:p.score,
                totalScore:p.totalScore
            })));
            setTimeout(startNextRound,5000);
        }
    },1000);
}

http.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
