const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

/* -------- IMAGE ROUTE (RENDER SAFE) -------- */
app.get("/image", (req, res) => {
  const seed = Date.now();
  res.redirect(`https://picsum.photos/seed/${seed}/800/500`);
});

/* -------- SIMPLE GAME STATE -------- */
let players = {};
let roundActive = false;

/* -------- START ROUND -------- */
function startRound() {
  roundActive = true;

  io.emit("roundStarted", {
    image: "/image?" + Date.now(),
    time: 20
  });

  setTimeout(() => {
    roundActive = false;
    io.emit("roundEnded", getLeaderboard());
  }, 20000);
}

function getLeaderboard() {
  return Object.values(players).sort(
    (a, b) => b.score - a.score
  );
}

function updatePlayers() {
  io.emit("playersUpdate", getLeaderboard());
}

/* -------- SOCKET -------- */
io.on("connection", (socket) => {

  socket.on("join", (name) => {
    players[socket.id] = {
      name: name || "Player",
      score: 0
    };
    updatePlayers();
  });

  socket.on("score", () => {
    if (!roundActive) return;
    if (!players[socket.id]) return;

    players[socket.id].score++;
    updatePlayers();
  });

  socket.on("start", () => {
    if (!roundActive) startRound();
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    updatePlayers();
  });
});

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
