const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

let players = {};
let roundNumber = 0;
let roundActive = false;
let roundTime = 20;
let maxRounds = 15;

function getDifficulty(round){
    if(round <= 5) return "easy";
    if(round <= 10) return "medium";
    return "hard";
}

function generateImage(){
    const seed = Date.now(); 
    return `https://picsum.photos/800/500?random=${seed}`;
}

function startRound(){
    roundNumber++;
    roundActive = true;

    Object.values(players).forEach(p => p.roundScore = 0);

    const imageURL = generateImage();

    io.emit("roundStarted", {
        round: roundNumber,
        image: imageURL,
        difficulty: getDifficulty(roundNumber),
        time: roundTime
    });

    setTimeout(endRound, roundTime * 1000);
}

function endRound(){
    roundActive = false;

    const leaderboard = Object.values(players)
        .sort((a,b)=> b.totalScore - a.totalScore);

    io.emit("roundEnded", leaderboard);

    if(roundNumber < maxRounds){
        setTimeout(startRound, 10000);
    } else {
        io.emit("tournamentEnded", leaderboard);
    }
}

io.on("connection", socket => {

    socket.on("joinGame", name => {
        players[socket.id] = {
            name: name || "Player",
            totalScore: 0,
            roundScore: 0
        };

        sendPlayers();
    });

    socket.on("scorePoint", ()=>{
        if(!roundActive) return;

        const p = players[socket.id];
        if(!p) return;

        if(p.roundScore >= 25) return; // anti spam

        p.roundScore++;
        p.totalScore++;

        sendPlayers();
    });

    socket.on("startTournament", ()=>{
        if(!roundActive){
            roundNumber = 0;
            startRound();
        }
    });

    socket.on("disconnect", ()=>{
        delete players[socket.id];
        sendPlayers();
    });
});

function sendPlayers(){
    io.emit("playersUpdate",
        Object.values(players).map(p=>({
            name: p.name,
            totalScore: p.totalScore
        }))
    );
}

server.listen(PORT, ()=>{
    console.log("Server running on port " + PORT);
});
