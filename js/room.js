/* ==========================
   ROOM
========================== */

const rain=document.querySelector(".rain");

for(let i=0;i<180;i++){

const drop=document.createElement("div");

drop.className="drop";

drop.style.left=Math.random()*100+"%";

drop.style.top=(-Math.random()*400)+"px";

drop.style.animationDuration=(.45+Math.random()*.7)+"s";

drop.style.animationDelay=Math.random()*2+"s";

rain.appendChild(drop);

}

const glow=document.querySelector(".cursorGlow");

document.addEventListener("mousemove",(e)=>{

glow.style.left=e.clientX+"px";

glow.style.top=e.clientY+"px";

});