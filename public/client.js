const socket = io();

let differences=[];
let timerInterval;

function join(){
    const name=document.getElementById("name").value;
    socket.emit("joinGame",name);
}

function start(){
    socket.emit("startTournament");
}

socket.on("roundStarted", data=>{
    document.getElementById("results").style.display="none";
    document.getElementById("images").style.display="flex";

    document.getElementById("roundInfo").innerText=
    "Round "+data.round+" - "+data.difficulty.toUpperCase();

    document.getElementById("left").src=data.image;
    document.getElementById("right").src=data.image;

    generateDifferences(data.difficulty);
    startTimer(data.time);
});

function generateDifferences(level){
    differences=[];
    let count=5;
    if(level==="medium") count=8;
    if(level==="hard") count=12;

    for(let i=0;i<count;i++){
        differences.push({
            x:Math.random()*350+20,
            y:Math.random()*200+20,
            found:false
        });
    }
}

document.getElementById("right").addEventListener("click", e=>{
    const rect=e.target.getBoundingClientRect();
    const x=e.clientX-rect.left;
    const y=e.clientY-rect.top;

    let hit=false;

    differences.forEach(d=>{
        if(!d.found &&
           Math.abs(x-d.x)<30 &&
           Math.abs(y-d.y)<30){
            d.found=true;
            hit=true;
            socket.emit("scorePoint");
            document.getElementById("correctSound").play();
        }
    });

    if(!hit){
        document.getElementById("wrongSound").play();
    }
});

function startTimer(seconds){
    clearInterval(timerInterval);
    let time=seconds;

    timerInterval=setInterval(()=>{
        document.getElementById("timer").innerText=time;
        time--;
        if(time<0){
            clearInterval(timerInterval);
        }
    },1000);
}

socket.on("roundEnded", leaderboard=>{
    document.getElementById("images").style.display="none";
    document.getElementById("results").style.display="block";

    const body=document.getElementById("resultBody");
    body.innerHTML="";

    leaderboard.forEach((p,i)=>{
        let medal="";
        if(i==0) medal="🥇";
        if(i==1) medal="🥈";
        if(i==2) medal="🥉";

        body.innerHTML+=`
        <tr>
        <td>${i+1}</td>
        <td>${medal} ${p.name}</td>
        <td>${p.totalScore}</td>
        </tr>`;
    });
});

socket.on("tournamentEnded", leaderboard=>{
    document.body.innerHTML=
    `<h1>🏆 TOURNAMENT WINNER 🏆</h1>
     <h2>${leaderboard[0].name}</h2>`;
    document.getElementById("winSound").play();
});
