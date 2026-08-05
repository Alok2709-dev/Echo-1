const messages = [

    "Initializing...",

    "Loading Memory...",

    "Loading Voice Engine...",

    "Loading Neural Core...",

    "Loading Consciousness..."

];

const status = document.getElementById("status");

let current = 0;

const interval = setInterval(()=>{

    current++;

    if(current < messages.length){

        status.textContent = messages[current];

    }

},1200);


// Boot Finished

setTimeout(()=>{

    clearInterval(interval);

    document.getElementById("loader").classList.add("loaderHide");

    document.getElementById("room").classList.remove("hidden");

},6500);