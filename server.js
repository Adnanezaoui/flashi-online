const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

let players = {};
let roundActive = false;
let roundNumber = 0;
let roundTime = 15;
let countdown;
let currentImageSeed = 1;

function startRound() {
    roundActive = true;
    roundNumber++;
    currentImageSeed = Math.floor(Math.random() * 10000);

    for (let id in players) {
        players[id].roundScore = 0;
    }

    io.emit("roundStarted", {
        round: roundNumber,
        seed: currentImageSeed,
        time: roundTime
    });

    let timeLeft = roundTime;

    countdown = setInterval(() => {
        timeLeft--;
        io.emit("timer", timeLeft);

        if (timeLeft <= 0) {
            clearInterval(countdown);
            endRound();
        }
    }, 1000);
}

function endRound() {
    roundActive = false;

    let leaderboard = Object.values(players)
        .sort((a, b) => b.totalScore - a.totalScore);

    io.emit("roundEnded", leaderboard);

    setTimeout(() => {
        startRound();
    }, 10000);
}

io.on("connection", (socket) => {

    socket.on("join", ({ name, isAdmin }) => {
        players[socket.id] = {
            id: socket.id,
            name,
            isAdmin,
            roundScore: 0,
            totalScore: 0
        };

        io.emit("playersUpdate", Object.values(players));
    });

    socket.on("scorePoint", () => {
        if (!roundActive) return;
        players[socket.id].roundScore++;
        players[socket.id].totalScore++;

        io.emit("playersUpdate", Object.values(players));
    });

    socket.on("startGame", () => {
        startRound();
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("playersUpdate", Object.values(players));
    });
});

server.listen(PORT, () => console.log("Server running on " + PORT));
