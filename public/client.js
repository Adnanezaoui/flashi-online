const socket = io();

const loginPage = document.getElementById('loginPage');
const gamePage = document.getElementById('gamePage');

// Buttons/forms
const playerLoginBtn = document.getElementById('playerLoginBtn');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const playerForm = document.getElementById('playerForm');
const adminForm = document.getElementById('adminForm');
const loginPlayerSubmit = document.getElementById('loginPlayerSubmit');
const loginAdminSubmit = document.getElementById('loginAdminSubmit');
const loginError = document.getElementById('loginError');
const adminError = document.getElementById('adminError');

const displayName = document.getElementById('displayName');
const adminControls = document.getElementById('adminControls');
const startRoundBtn = document.getElementById('startRoundBtn');
const stopRoundBtn = document.getElementById('stopRoundBtn');

const timerDiv = document.getElementById('timer');
const leftImg = document.getElementById('leftImg');
const rightImg = document.getElementById('rightImg');
const playerList = document.getElementById('playerList');
const roundResults = document.getElementById('roundResults');

let playerName = "";
let isAdmin = false;

// Show forms
playerLoginBtn.addEventListener('click', ()=>{ playerForm.style.display="block"; adminForm.style.display="none"; });
adminLoginBtn.addEventListener('click', ()=>{ adminForm.style.display="block"; playerForm.style.display="none"; });

// -------------------
// Login Player
loginPlayerSubmit.addEventListener('click', ()=>{
  const name = document.getElementById('playerName').value.trim();
  const password = document.getElementById('playerPassword').value.trim();

  if(password !== "POLO FAMILY"){ loginError.innerText="❌ كلمة المرور خاطئة"; return; }
  if(!name){ loginError.innerText="❌ الرجاء إدخال الاسم"; return; }

  playerName = name;
  displayName.innerText = name;
  loginPage.style.display="none";
  gamePage.style.display="block";

  socket.emit('joinGame', {name});
  adminControls.style.display="none"; // لاعب لا يرى أزرار
});

// -------------------
// Login Admin
loginAdminSubmit.addEventListener('click', ()=>{
  const name = document.getElementById('adminName').value.trim();
  const password = document.getElementById('adminPassword').value.trim();

  if(password !== "ADMINPOLO"){ adminError.innerText="❌ كلمة مرور الأدمن خاطئة"; return; }
  if(!name){ adminError.innerText="❌ الرجاء إدخال الاسم"; return; }

  playerName = name;
  displayName.innerText = name;
  loginPage.style.display="none";
  gamePage.style.display="block";

  socket.emit('joinGame', {name});
  isAdmin = true;
  adminControls.style.display="block"; // الأدمن يرى أزرار
});

// -------------------
// Admin buttons
startRoundBtn.addEventListener('click', ()=>socket.emit('startRound'));
stopRoundBtn.addEventListener('click', ()=>socket.emit('stopRound'));

// -------------------
// Socket events
socket.on('roundStart', ({level, image, time})=>{
  timerDiv.innerText = time;
  leftImg.src = image.left;
  rightImg.src = image.right;
  roundResults.style.display = "none";
});

socket.on('timer', time=>{ timerDiv.innerText = time; });

socket.on('roundEnd', players=>{
  roundResults.style.display="block";
  roundResults.innerHTML = "<h3>نتائج الجولة:</h3>" +
      players.map(p=>`<p>${p.name} - نقاط: ${p.score}</p>`).join("");
});

socket.on('updatePlayers', players=>{
  playerList.innerHTML = "<h3>اللاعبون الحاليون:</h3>" +
      players.map(p=>`<p>${p.name} - مجموع النقاط: ${p.score}</p>`).join("");
});

socket.on('nextRoundReady', ()=>{
  roundResults.style.display="none";
});

// Player clicks differences
rightImg.addEventListener('click', ()=>socket.emit('foundDiff'));
leftImg.addEventListener('click', ()=>socket.emit('foundDiff'));
