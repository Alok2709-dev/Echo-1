const canvas = document.getElementById("coreCanvas");
const ctx = canvas.getContext("2d");

function resize(){

    canvas.width = 700;
    canvas.height = 700;

}

resize();

window.addEventListener("resize", resize);

let angle = 0;
let pulse = 0;
let angle2 = 0;
let angle3 = 0;

function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.save();

    ctx.translate(350,350);
    ctx.save();
ctx.rotate(angle2);
// =========================
// HEXAGON
// =========================

ctx.beginPath();

for(let i=0;i<6;i++){

    let a=(Math.PI*2/6)*i;

    let x=Math.cos(a)*55;
    let y=Math.sin(a)*55;

    if(i===0){

        ctx.moveTo(x,y);

    }else{

        ctx.lineTo(x,y);

    }

}

ctx.closePath();

ctx.strokeStyle="rgba(125,211,255,.45)";
ctx.lineWidth=2;

ctx.stroke();

// =========================
// CROSSHAIR
// =========================

ctx.beginPath();

ctx.moveTo(-25,0);
ctx.lineTo(25,0);

ctx.moveTo(0,-25);
ctx.lineTo(0,25);

ctx.strokeStyle="rgba(125,211,255,.35)";
ctx.lineWidth=1;

ctx.stroke();

ctx.beginPath();
ctx.arc(0,0,170,0,Math.PI*2);

ctx.strokeStyle="rgba(125,211,255,.08)";
ctx.lineWidth=1;

ctx.stroke();

ctx.restore();

ctx.save();
ctx.rotate(angle3);

ctx.beginPath();
ctx.arc(0,0,210,0,Math.PI*2);

ctx.strokeStyle="rgba(125,211,255,.04)";
ctx.lineWidth=1;

ctx.stroke();

ctx.restore();

    angle += 0.008;
    pulse += 0.04;
    angle2 -= 0.004;
    angle3 += 0.002;

    ctx.rotate(angle);

    // =========================
    // OUTER RING
    // =========================

    ctx.beginPath();
    ctx.arc(0,0,120,0,Math.PI*2);
    ctx.strokeStyle="rgba(125,211,255,.12)";
    ctx.lineWidth=3;
    ctx.stroke();
    // =========================
// TICK MARKS
// =========================

for(let i=0;i<48;i++){

    let a=(Math.PI*2/48)*i;

    let x1=Math.cos(a)*132;
    let y1=Math.sin(a)*132;

    let x2=Math.cos(a)*140;
    let y2=Math.sin(a)*140;

    ctx.beginPath();

    ctx.moveTo(x1,y1);

    ctx.lineTo(x2,y2);

    ctx.strokeStyle="rgba(125,211,255,.18)";
    ctx.lineWidth=1;

    ctx.stroke();

}

    // =========================
    // INNER RING
    // =========================

    ctx.beginPath();
    ctx.arc(0,0,75,0,Math.PI*2);
    ctx.strokeStyle="#7dd3ff";
    ctx.lineWidth=2;
    ctx.stroke();

    // =========================
    // SCANNER ARC 1
    // =========================

    ctx.beginPath();
    ctx.strokeStyle="#7dd3ff";
    ctx.lineWidth=4;
    ctx.arc(0,0,150,0,Math.PI/3);
    ctx.stroke();

    // =========================
    // SCANNER ARC 2
    // =========================

    ctx.beginPath();
    ctx.strokeStyle="rgba(125,211,255,.35)";
    ctx.lineWidth=2;
    ctx.arc(0,0,95,Math.PI,Math.PI+1.4);
    ctx.stroke();

    // =========================
    // ROTATING DOTS
    // =========================

    for(let i=0;i<8;i++){

        let a=(Math.PI*2/8)*i;

        let x=Math.cos(a)*120;
        let y=Math.sin(a)*120;

        ctx.beginPath();
        ctx.arc(x,y,4,0,Math.PI*2);

        ctx.fillStyle="#7dd3ff";
        ctx.fill();

    }

    // =========================
    // CORE
    // =========================

    let r = 18 + Math.sin(pulse)*3;

    ctx.beginPath();
    ctx.arc(0,0,r,0,Math.PI*2);

    ctx.fillStyle="#7dd3ff";
    ctx.shadowBlur=40;
    ctx.shadowColor="#7dd3ff";
    ctx.fill();

    // =========================
    // PULSE RING
    // =========================

    ctx.beginPath();
    ctx.arc(0,0,35+Math.sin(pulse)*5,0,Math.PI*2);

    ctx.strokeStyle="rgba(125,211,255,.35)";
    ctx.lineWidth=2;
    ctx.stroke();

    // =========================
    // ORBITING ENERGY BALL
    // =========================

    let orbitAngle = angle * 3;

    let ox = Math.cos(orbitAngle) * 95;
    let oy = Math.sin(orbitAngle) * 95;

    ctx.beginPath();
    ctx.arc(ox,oy,5,0,Math.PI*2);

    ctx.fillStyle="#7dd3ff";
    ctx.shadowBlur=25;
    ctx.shadowColor="#7dd3ff";
    ctx.fill();
// =========================
// SECOND ORBIT NODE
// =========================

let orbit2 = angle * -2;

ctx.beginPath();

ctx.arc(
    Math.cos(orbit2) * 150,
    Math.sin(orbit2) * 150,
    3,
    0,
    Math.PI * 2
);

ctx.fillStyle = "#ffffff";
ctx.shadowBlur = 18;
ctx.shadowColor = "#7dd3ff";

ctx.fill();
    ctx.restore();

    requestAnimationFrame(draw);

}

draw();