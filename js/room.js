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
/* ==========================================
   PARTICLES
========================================== */

const particleBox = document.querySelector(".particles");

for(let i=0;i<80;i++){

    const p=document.createElement("div");

    p.className="particle";

    p.style.left=Math.random()*100+"%";

    p.style.top=Math.random()*100+"%";

    p.style.animationDuration=(10+Math.random()*18)+"s";

    p.style.animationDelay=Math.random()*10+"s";

    p.style.opacity=Math.random()*.25;

    particleBox.appendChild(p);

}

/* ==========================================
   LIGHTNING
========================================== */

const lightning=document.querySelector(".lightning");

function flash(){

    lightning.animate(

    [

        {opacity:0},

        {opacity:.22},

        {opacity:0},

        {opacity:.12},

        {opacity:0}

    ],

    {

        duration:250

    }

    );

}

setInterval(()=>{

    if(Math.random()>.72){

        flash();

    }

},5000);