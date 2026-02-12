const socket = io();

// DOM
const loginPage = document.getElementById('loginPage');
const gamePage = document.getElementById('gamePage');
const loginBtn = document.getElementById('loginBtn');
const playerNameInput = document.getElementById('playerName');
const gamePasswordInput = document.getElementById('gamePassword');
const loginError = document.getElementById('loginError');
const displayName = document.getElementById('displayName');
const startRoundBtn = document.getElementById('startRoundBtn');
const timerDiv = document.getElementById('timer');
const leftImg = document.getElementById('leftImg');
const rightImg = document.getElementById('rightImg');
const playerList = document.getElementById('playerList');
const roundResults = document.getElementById('roundResults');

let playerName = "";
let isAdmin = false;

// Login
loginBtn.addEventListener('click', ()=>{
    const name = playerNameInput.value.trim();
    const password = gamePasswordInput.value.trim();

    if(password !== "POLO FAMILY"){
        loginError.innerText = "❌ كلمة المرور خاطئة";
        return;
    }
    if(!name){
        loginError.innerText = "❌ الرجاء إدخال الاسم";
        return;
    }

    playerName = name;
    displayName.innerText = name;
    loginPage.style.display = "none";
    gamePage.style.display = "block";

    // الإتصال بالسيرفر
    socket.emit('joinGame', {name});

    // الشخص الأول يكون أدمن
    if(name.toLowerCase() === "admin"){
        isAdmin = true;
        startRoundBtn.style.display = "inline-block";
    } else {
        startRoundBtn.style.display = "none";
    }
});

// بدء الجولة
startRoundBtn.addEventListener('click', ()=>{
    socket.emit('startRound');
});

// استقبال بيانات الجولة
socket.on('roundStart', ({level, image, time})=>{
    timerDiv.innerText = time;
    leftImg.src = image.left;
    rightImg.src = image.right;
    roundResults.style.display = "none";
});

// التايمر
socket.on('timer', (time)=>{
    timerDiv.innerText = time;
});

// نهاية الجولة
socket.on('roundEnd', (players)=>{
    roundResults.style.display = "block";
    roundResults.innerHTML = "<h3>نتائج الجولة:</h3>" +
        players.map(p=>`<p>${p.name} - نقاط: ${p.score}</p>`).join("");
});

// اللاعبين
socket.on('updatePlayers', (players)=>{
    playerList.innerHTML = "<h3>اللاعبون الحاليون:</h3>" +
        players.map(p=>`<p>${p.name} - مجموع النقاط: ${p.score}</p>`).join("");
});

// التحضير للجولة التالية
socket.on('nextRoundReady', ()=>{
    roundResults.style.display = "none";
});
