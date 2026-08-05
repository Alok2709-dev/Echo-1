import * as THREE from "three";

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(

60,

window.innerWidth/window.innerHeight,

0.1,

1000

);

camera.position.z=5;

const renderer=new THREE.WebGLRenderer({

antialias:true

});

renderer.setSize(

window.innerWidth,

window.innerHeight

);

renderer.setPixelRatio(

window.devicePixelRatio

);

document.body.appendChild(

renderer.domElement

);

const light=new THREE.PointLight(

0xffffff,

5

);

light.position.set(

0,

3,

3

);

scene.add(light);

const ambient=new THREE.AmbientLight(

0xffffff,

0.25

);

scene.add(ambient);

const geometry=new THREE.SphereGeometry(

0.5,

64,

64

);

const material=new THREE.MeshPhysicalMaterial({

color:0xffffff,

emissive:0xffffff,

emissiveIntensity:2,

roughness:0,

metalness:0,

clearcoat:1

});

const orb=new THREE.Mesh(

geometry,

material

);

scene.add(orb);

function animate(){

requestAnimationFrame(

animate

);

orb.rotation.y+=0.003;

orb.rotation.x+=0.001;

renderer.render(

scene,

camera

);

}

animate();

window.addEventListener(

"resize",

()=>{

camera.aspect=

window.innerWidth/window.innerHeight;

camera.updateProjectionMatrix();

renderer.setSize(

window.innerWidth,

window.innerHeight

);

}

);