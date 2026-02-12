const socket = io();

let timerInterval;

function join() {
  const name = document.getElementById("name").value;
  socket.emit("join", name);
}

function startGame() {
  socket.emit("start");
}

socket.on("roundStarted", (data) => {

  document.getElementById("left").src = data.image;
  document.getElementById("right").src = data.image;

  startTimer(data.time);
});

socket.on("roundEnded", (leaderboard) => {
  alert("Round Finished!");
});

socket.on("playersUpdate", (leaderboard) => {

  const board = document.getElementById("board");
  board.innerHTML = "";

  leaderboard.forEach(p => {
    board.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>${p.score}</td>
      </tr>
    `;
  });
});

document.getElementById("right").addEventListener("click", () => {
  socket.emit("score");
});

function startTimer(seconds){
  clearInterval(timerInterval);
  let time = seconds;

  timerInterval = setInterval(() => {
    document.getElementById("timer").innerText = time;
    time--;
    if(time < 0){
      clearInterval(timerInterval);
    }
  }, 1000);
}
