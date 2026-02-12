const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};

io.on("connection", (socket) => {

  socket.on("joinGame", (name) => {
    players[socket.id] = { name, score: 0 };
    io.emit("updatePlayers", players);
  });

  socket.on("addPoint", () => {
    if (players[socket.id]) {
      players[socket.id].score++;
      io.emit("updatePlayers", players);
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });

});

server.listen(process.env.PORT || 3000);
