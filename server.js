const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};
let adminId = null;
let gameStarted = false;
let currentRound = 0;

io.on("connection", (socket) => {

  socket.on("login", ({ name, password }) => {

    if (password !== "POLO FAMILY") {
      socket.emit("loginError");
      return;
    }

    if (!adminId) {
      adminId = socket.id; // أول لاعب هو الأدمن
    }

    players[socket.id] = {
      name,
      score: 0
    };

    io.emit("updatePlayers", players);
    io.emit("adminUpdate", adminId);
  });

  socket.on("startGame", () => {
    if (socket.id === adminId) {
      gameStarted = true;
      currentRound = 1;
      io.emit("countdown", 10);
    }
  });

  socket.on("nextRound", () => {
    if (socket.id === adminId) {
      currentRound++;
      io.emit("countdown", 10);
    }
  });

  socket.on("addPoint", () => {
    if (players[socket.id]) {
      players[socket.id].score++;
      io.emit("updatePlayers", players);
    }
  });

  socket.on("stopGame", () => {
    if (socket.id === adminId) {
      gameStarted = false;
      currentRound = 0;
      io.emit("gameStopped");
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    if (socket.id === adminId) adminId = null;
    io.emit("updatePlayers", players);
  });

});

server.listen(process.env.PORT || 3000);
