const messages = [

"Initializing...",

"Loading Memory...",

"Loading Voice...",

"Loading Personality...",

"Initializing Consciousness..."

];

const status = document.getElementById("status");

let index = 0;

setInterval(()=>{

index++;

if(index<messages.length){

status.innerText=messages[index];

}

},1200);