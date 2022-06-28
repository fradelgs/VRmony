import * as THREE from './libs/three/three.module.js';
import { BoxLineGeometry } from './libs/three/jsm/BoxLineGeometry.js';
import { VRButton } from './libs/VRButton.js';
import { XRControllerModelFactory } from './libs/three/jsm/XRControllerModelFactory.js';
import { OrbitControls } from './libs/three/jsm/OrbitControls.js';
import { GUI } from './libs/three/jsm/dat.gui.module.js';

let camera, listener, scene, raycaster, renderer, pointer, CLICKED;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let room;
let settings;
let spherePosition;
let BallDistance = 2; // Distance between two balls
let SpheresPerEdge = 2; // per Edge
let Lattice = new THREE.Group();
let oscillator = [];
let gainNode = [];
let intonation = [];
let mixer;
let light1;
let ball;
let audioCtx;
let f0 = 261.6; //Lattice Fundamental Frequency

let intersected = [];

let sound = [];

let color = {
	false: '0xffffff', 
	true: '0xff00ff'
};

const container = document.createElement( 'div' );
document.body.appendChild( container );
        
let clock;

initScene();
animate();
setupVR();

console.log(controller1);

function initScene(){
    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x505050 );

    // LISTENER
    // var AudioContext = window.AudioContext || window.webkitAudioContext;
    // var audioCtx = new AudioContext();
    listener = new THREE.AudioListener();
	audioCtx = listener.context;

    // CAMERA
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.set( 0, 1.6, 4 );
    // camera.lookAt( 0, 0, 0 );
    camera.add(listener);

    // ROOM
    room = new THREE.LineSegments(
        new BoxLineGeometry( 20, 10, 20, 10, 10, 10 ),
        new THREE.LineBasicMaterial( { color: 0x808080 } )
    );
    room.geometry.translate( 0, 5, 0 );
    scene.add(room);

    // LIGHT
	const ambienceLight = new THREE.HemisphereLight( 0x606060, 0x404040 );
	const light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 ).normalize();
	light.intensity = 0.4;
	ambienceLight.intensity = 0.5;
	scene.add( ambienceLight);
	scene.add( light ); 

    // LATTICE
    initLatticeNEW();

	initSoundLattice();


	Lattice.position.set(-0.5*(SpheresPerEdge),0.8,-0.5*(SpheresPerEdge + BallDistance)); // trovare position in f(SpheresPerEdge e distanza d)
	// Creation of Lattice "Metadata"
	Lattice.name = "Reticolo"; 
	Lattice.children[0].material.transparent = 'true';
	//Lattice.children[0].material.emissive.setHex = '0xff0040';
	Lattice.children[0].material.emissiveIntensity = 1;
	light1 = new THREE.PointLight( 0xff0040, 100, 50 );
	Lattice.children[0].add(light1);
	Lattice.children[0].material.emissive = {r:1,g:0,b:0.25};
	console.log(Lattice);
	Lattice.name= "LATTICE";

	// create some keyframe tracks
	const lightIntensityKF = new THREE.NumberKeyframeTrack( '.children[0].intensity', [ 0, 1, 2], [ 0, 1, 0] );
	const colorKF = new THREE.ColorKeyframeTrack( '.material.emissiveIntensity', [ 0, 1, 2 ], [ 0, 1, 0]);
	const clip = new THREE.AnimationClip( 'default', 2, [lightIntensityKF, colorKF]);
	mixer = new THREE.AnimationMixer( Lattice.children[0] );
	const clipAction = mixer.clipAction( clip );
	clipAction.play();


	SoundVisualPatching();
	
	// GUI
	//initGUI();

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild( renderer.domElement );

    //POINTER MOUSE
    CLICKED = null;
    pointer= new THREE.Vector2();

	clock = new THREE.Clock();

    //document.addEventListener( 'pointerdown', mouseDown, false );
    window.addEventListener('resize', onWindowResize, false );
}

function initLatticeNEW(){
	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				spherePosition = [i*BallDistance, j*BallDistance, k*BallDistance];
				ball = Ball();
				ball.userData[0] = {MODEL: false, PREVIOUS: false};
				Lattice.add(ball);
			}
		}
	}
	scene.add(Lattice);
}

function initSoundLattice(){
	for(var i = 0; i< Math.pow(SpheresPerEdge, 3) ; i++){
		//intonation[i] = ((f0 * Math.pow(2, (i*7)/12)) * Math.pow(2, (i*4)/12))*Math.pow(2, (i*10)/12);
		intonation[i] = 100;
		gainNode[i] = audioCtx.createGain();
		oscillator[i]= audioCtx.createOscillator()
		oscillator[i].type = 'sine';
		oscillator[i].frequency.setValueAtTime(intonation[i], audioCtx.currentTime);
		oscillator[i].start(0);
		sound[i] = new THREE.PositionalAudio( listener );
		sound[i].setNodeSource(oscillator[i]);
		sound[i].setVolume(0.0);
		// connect oscillator to gain node to speakers
  		//oscillator[i+j+k].connect(gainNode[i+j+k]);
  		//gainNode[i+j+k].connect(audioCtx.destination);
		//gainNode[i+j+k].gain.value = 0.1;
		console.log(i)
			}
		}

function SoundVisualPatching(){
	for(var i = 0; i<Math.pow(SpheresPerEdge,3); i++){
		Lattice.children[i].add(sound[i]);
	}
}


function Ball(){
	const BallGeometry = new THREE.SphereGeometry(0.5, 30, 30);
	const material1 = new THREE.MeshStandardMaterial( { color: 'white', roughness: 0, metalness: 0, transparent: true } ) ;
	const material2 = new THREE.MeshPhongMaterial( {
		color: 'white',
		opacity: 1,

	} );

	var ball = new THREE.Mesh( BallGeometry, material2);
	ball.position.set(spherePosition[0],spherePosition[1],spherePosition[2]);
	return ball;
}

function changeState(object){
	console.log(object);
	if (object.userData[0].MODEL==false) {
		object.userData[0].MODEL= true;
		audioRender(object);
		myRender(object);

		
		// db.collection("state").doc("counter").set({
		// 	id_note: object.uuid,
		// 	value: object.userData[0].MODEL,
		// 	color: color[object.userData[0].MODEL]
		// })
	}
	else {object.userData[0].MODEL= false;
		audioRender(object);
		myRender(object);
	

		// db.collection("state").doc("counter").set({
		// 	id_note: object.uuid,
		// 	value: object.userData[0].MODEL,
		// 	color: color[object.userData[0].MODEL]
		// })
	}
}	

function audioRender(object){
	var lastIndex = object.children.length - 1;
	if(object.children[lastIndex]) object.children[lastIndex].gain.gain.setTargetAtTime(object.userData[0].MODEL*0.125, listener.context.currentTime + 0, 0.5);
}

function myRender(object){
	var lastIndex = object.children.length - 1;
	object.material.color.setHex( color[object.userData[0].MODEL] );
	if(object.children[lastIndex]) object.children[lastIndex].gain.gain.setTargetAtTime(object.userData[0].MODEL*0.125, listener.context.currentTime + 0, 0.5);
}

function mouseDown(event) {
	// find intersections
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	raycaster.setFromCamera( pointer, camera );
   
    var intersectable = scene.getObjectByName("LATTICE", true);
    console.log(intersectable)

    const intersects = raycaster.intersectObjects( intersectable.children, true );

	if ( intersects.length > 0){

		CLICKED = intersects[ 0 ].object; // get clicked object

		const id = CLICKED.uuid; //getID of clicked object
		console.log("id " + id);
		
		changeState(CLICKED);
	}
}

function initGUI(limitLattice, oscillator){
    const GeneratorControls = function () {
		//this.frequency = oscillator[0][0][0].frequency.value;
		this.wavetype = oscillator[0][0][0].type;
	};
    const gui = new GUI();
	const generatorControls = new GeneratorControls();
	const generatorFolder = gui.addFolder( 'sound generator' );

    generatorFolder.add( generatorControls, 'wavetype', [ 'sine', 'square', 'sawtooth', 'triangle' ] ).onChange( function () {

		for(var i = 0; i<limitLattice; i++){
			for(var j = 0; j<limitLattice; j++){
				for(var k = 0; k<limitLattice; k++){
					oscillator[i][j][k].type = generatorControls.wavetype;
				}
			}
        }
	} );

    generatorFolder.open();
}


function setupVR(){
    renderer.xr.enabled = true;

    // VR BUTTON
    const button = new VRButton( renderer );

    // CONTROLLERS
	controller1 = renderer.xr.getController( 0 );
	controller1.name="left";
	controller1.addEventListener( 'selectstart', onSelectStart );
    scene.add( controller1 );

    controller2 = renderer.xr.getController( 1 );
	controller2.name="right";
	controller2.addEventListener( 'selectstart', onSelectStart );
	scene.add( controller2 );

    const controllerModelFactory = new XRControllerModelFactory();

    // CONTROLLER GRIP
    controllerGrip1 = renderer.xr.getControllerGrip( 0 );
	controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
	scene.add( controllerGrip1 );

	controllerGrip2 = renderer.xr.getControllerGrip( 1 );
	controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
	scene.add( controllerGrip2 );

	// DOLLY
	var dolly = new THREE.Group();
    dolly.position.set(0, 0, 6);
    dolly.name = "dolly";
    scene.add(dolly);
    dolly.add(camera);
    dolly.add(controller1);
    dolly.add(controller2);
    dolly.add(controllerGrip1);
    dolly.add(controllerGrip2);

    // RAYCASTER
	raycaster = new THREE.Raycaster();
    const controls = new OrbitControls( camera, renderer.domElement );
	controls.update();

	var geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ]);

    var line = new THREE.Line(geometry);
    line.name = "line";
    line.scale.z = 50;   //MODIFIED FOR LARGER SCENE

    controller1.add(line.clone());
    controller2.add(line.clone());

}

function onSelectStart(event) {
	var controller = event.target;
	var intersections = getIntersections(controller);	// get intersected objects

	if (intersections.length > 0){
		var intersection = intersections[ 0 ]; // get the first intersected object
		var object = intersection.object;
		changeState(object);

		// controller.attach(object);
		// controller.userData.selected = object;
		// const id = object.uuid; //getID of clicked object
		// console.log("id " + id);
	}
}


function getIntersections(controller) {
	var tempMatrix = new THREE.Matrix4();
	tempMatrix.identity().extractRotation(controller.matrixWorld);
	raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
	raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
	return raycaster.intersectObjects(Lattice.children);
}

// HOVER
function intersectObjects(controller) {
	// Do not highlight when already selected

	if (controller.userData.selected !== undefined) return;

	var line = controller.getObjectByName("line");
	var intersections = getIntersections(controller);

	if (intersections.length > 0) {
		var intersection = intersections[0];
		var object = intersection.object;
		
		object.material.emissive.r = 1;
		object.material.emissiveIntensity = 1;
		intersected.push(object);

		line.scale.z = intersection.distance;
	} else {
		line.scale.z = 50;   //MODIFIED AS OUR SCENE IS LARGER
	}
}

// NOT HOVER
function cleanIntersected() {
	while (intersected.length) {
		var object = intersected.pop();
		object.material.emissiveIntensity = 0;
	}
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );  
}


function animate() {
    renderer.setAnimationLoop( render );
}


function render() {
	const delta = clock.getDelta();

	if ( mixer ) {
	mixer.update( delta );
	}

	cleanIntersected();

	intersectObjects(controller1);
    intersectObjects(controller2);
	
	renderer.render(scene, camera );    
}
