const socket = io();

// DOM Elements
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
const timerEl = document.getElementById('timer');
const leftImg = document.getElementById('leftImg');
const rightImg = document.getElementById('rightImg');
const playerListEl = document.getElementById('playerList');
const roundResultsEl = document.getElementById('roundResults');

let isAdmin = false;
let playerNameVal = "";
let roundTime = 15;
let roundTimer;
let currentRound = 1;
let maxRounds = 10;
let imagesPerRound = 300;

// Dummy images with picsum.photos
function getImage(index){
  return `https://picsum.photos/seed/${index}/600/400`;
}

// Differences positions (random for demo)
function generateDifferences(){
  let diffs = [];
  for(let i=0;i<5;i++){
    diffs.push({x: Math.random()*300, y:Math.random()*200});
  }
  return diffs;
}

// Login buttons
playerLoginBtn.onclick = ()=>{ playerForm.style.display='block'; adminForm.style.display='none'; }
adminLoginBtn.onclick = ()=>{ adminForm.style.display='block'; playerForm.style.display='none'; }

// Player login
loginPlayerSubmit.onclick = ()=>{
  const name = document.getElementById('playerName').value.trim();
  const pass = document.getElementById('playerPassword').value.trim();
  if(pass !== "POLO FAMILY"){ loginError.innerText="❌ كلمة المرور خاطئة"; return;}
  if(name===""){ loginError.innerText="❌ الرجاء إدخال الاسم"; return;}
  playerNameVal = name;
  loginPage.style.display='none';
  gamePage.style.display='block';
  displayName.innerText = name;
  socket.emit('playerJoin',{name});
}

// Admin login
loginAdminSubmit.onclick = ()=>{
  const name = document.getElementById('adminName').value.trim();
  const pass = document.getElementById('adminPassword').value.trim();
  if(pass !== "ADMINPOLO"){ adminError.innerText="❌ كلمة مرور الأدمن خاطئة"; return;}
  isAdmin = true;
  playerNameVal = name;
  loginPage.style.display='none';
  gamePage.style.display='block';
  displayName.innerText = name;
  adminControls.style.display='block';
  socket.emit('adminJoin',{name});
}

// Admin starts round
startRoundBtn.onclick = ()=>{ socket.emit('startRound', {round: currentRound}); }
stopRoundBtn.onclick = ()=>{ socket.emit('stopRound'); }

// Handle image clicks
[leftImg,rightImg].forEach(img=>{
  img.onclick = (e)=>{
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    socket.emit('click',{x:clickX, y:clickY, player:playerNameVal, round:currentRound});
  }
});

// Socket events
socket.on('updatePlayers',(players)=>{
  playerListEl.innerHTML = "<h3>اللاعبون المتصلون:</h3>";
  players.forEach(p=>{
    playerListEl.innerHTML += `<div>${p.name} - نقاط: ${p.score}</div>`;
  });
});

socket.on('startRoundClient', ({round, leftImage, rightImage, differences})=>{
  currentRound = round;
  roundResultsEl.style.display='none';
  leftImg.src = leftImage;
  rightImg.src = rightImage;
  window.differences = differences; // save for marking
  startRoundTimer();
});

socket.on('markDifference', ({x,y})=>{
  const mark = document.createElement('div');
  mark.className='marker';
  mark.style.left=x+'px';
  mark.style.top=y+'px';
  mark.style.width='20px';
  mark.style.height='20px';
  document.querySelector('#images').appendChild(mark);
  setTimeout(()=>mark.remove(),1000);
});

socket.on('showResults', (players)=>{
  clearInterval(roundTimer);
  roundResultsEl.style.display='block';
  leftImg.src=''; rightImg.src='';
  timerEl.innerText='';
  let html = `<h3>نتائج الجولة ${currentRound}</h3><table><tr><th>الترتيب</th><th>اللاعب</th><th>النقاط</th></tr>`;
  players.sort((a,b)=>b.score-a.score).forEach((p,i)=>{
    html += `<tr><td>${i+1}</td><td>${p.name}</td><td>${p.score}</td></tr>`;
  });
  html += "</table>";
  roundResultsEl.innerHTML = html;
  // Next round after 10s
  setTimeout(()=>{
    if(currentRound<maxRounds && !isAdmin) return;
    socket.emit('startRound',{round:currentRound+1});
  },10000);
});

// Round timer
function startRoundTimer(){
  roundTime = 15;
  timerEl.innerText = roundTime;
  clearInterval(roundTimer);
  roundTimer = setInterval(()=>{
    roundTime--;
    timerEl.innerText = roundTime;
    if(roundTime<=0){
      clearInterval(roundTimer);
      socket.emit('endRound',{round:currentRound});
    }
  },1000);
}
