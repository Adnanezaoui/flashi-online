const socket = io();

const loginPage = document.getElementById('loginPage');
const gamePage = document.getElementById('gamePage');

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

// Player login
loginPlayerSubmit.addEventListener('click', ()=>{
  const name = document.getElementById('playerName').value.trim();
  const password = document.getElementById('playerPassword').value.trim();
  if(password !== "POLO FAMILY"){ loginError.innerText="❌ كلمة المرور خاطئة"; return; }
  if(!name){ loginError.innerText="❌ الرجاء إدخال الاسم"; return; }
  playerName = name;
  displayName.innerText = name;
  loginPage.style.display="none";
  gamePage.style.display="block";
  adminControls.style.display="none";
  socket.emit('joinGame', {name});
});

// Admin login
loginAdminSubmit.addEventListener('click', ()=>{
  const name = document.getElementById('adminName').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  if(password !== "ADMINPOLO"){ adminError.innerText="❌ كلمة مرور الأدمن خاطئة"; return; }
  if(!name){ adminError.innerText="❌ الرجاء إدخال الاسم"; return; }
  playerName = name;
  displayName.innerText = name;
  loginPage.style.display="none";
  gamePage.style.display="block";
  isAdmin = true;
  adminControls.style.display="block";
  socket.emit('joinGame', {name});
});

// Admin buttons
startRoundBtn.addEventListener('click', ()=>socket.emit('startRound'));
stopRoundBtn.addEventListener('click', ()=>socket.emit('stopRound'));

// Player clicks
leftImg.addEventListener('click', ()=>socket.emit('foundDiff'));
rightImg.addEventListener('click', ()=>socket.emit('foundDiff'));

// Socket events
socket.on('roundStart', ({image,time})=>{
  timerDiv.innerText = time;
  leftImg.src = image.left;
  rightImg.src = image.right;
  roundResults.style.display="none";
  document.getElementById('images').style.display="block";
});

socket.on('timer', time=>{ timerDiv.innerText = time; });

socket.on('roundEnd', players=>{
  document.getElementById('images').style.display="none";
  roundResults.style.display="block";
  let html = `<h3>نتائج الجولة (المجموع الحالي):</h3>
              <table><tr><th>اللاعب</th><th>نقاط الجولة</th><th>المجموع الكلي</th></tr>`;
  players.forEach(p=>{
    html += `<tr><td>${p.name}</td><td>${p.roundScore}</td><td>${p.totalScore}</td></tr>`;
  });
  html += `</table>`;
  roundResults.innerHTML = html;
});

socket.on('updatePlayers', players=>{
  playerList.innerHTML = "<h3>اللاعبون الحاليون:</h3>" +
      players.map(p=>`<p>${p.name} - مجموع النقاط: ${p.totalScore}</p>`).join("");
});
