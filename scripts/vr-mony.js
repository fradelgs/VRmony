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

let color = {
	false: 'white', 
	true: '0xff00ff'
};

const container = document.createElement( 'div' );
document.body.appendChild( container );
        
const clock = new THREE.Clock();

initScene();
animate();
setupVR();

console.log(controller1);

function initScene(){
    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x505050 );

    // LISTENER
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioCtx = new AudioContext();
    listener = new THREE.AudioListener();

    // CAMERA
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.set( 0, 1.6, 8 );
    camera.lookAt( 0, 0, 0 );
    camera.add(listener);

    // ROOM
    room = new THREE.LineSegments(
        new BoxLineGeometry( 20, 10, 20, 10, 10, 10 ),
        new THREE.LineBasicMaterial( { color: 0x808080 } )
    );
    room.geometry.translate( 0, 5, 0 );
    scene.add(room);

    // LIGHT
    scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );
	const light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 ).normalize();
	scene.add( light ); 

    // LATTICE
    initLattice();

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild( renderer.domElement );

    //POINTER MOUSE
    CLICKED = null;
    pointer= new THREE.Vector2();

    document.addEventListener( 'pointerdown', mouseDown, false );

    window.addEventListener('resize', onWindowResize );
}

function initLattice(){
    var limitLattice = 3;
	const intonation = [];
	let fund = 261.6;
	const d = 2;
	var note = new Array(limitLattice);
	var sound = new Array(limitLattice);
	var oscillator = new Array(limitLattice);
	var spherePosition = new Array(limitLattice);
    let lattice;

    for (var i = 0; i < limitLattice; i++) {
		spherePosition[i] = new Array(limitLattice);
		intonation[i] = new Array(limitLattice);
		note[i] = new Array(limitLattice);
		sound[i] = new Array(limitLattice);
		oscillator[i] = new Array(limitLattice);
	}

	for(var i = 0; i<limitLattice; i++){
		for(var j = 0; j<limitLattice; j++){
			spherePosition[i][j] = new Array(limitLattice);
			intonation[i][j] = new Array(limitLattice);
			note[i][j] = new Array(limitLattice);
			sound[i][j] = new Array(limitLattice);
			oscillator[i][j] = new Array(limitLattice);
		}
	}

	for(var i = 0; i<limitLattice; i++){
		for(var j = 0; j<limitLattice; j++){
			for(var k = 0; k<limitLattice; k++){
				spherePosition[i][j][k] = [ i*d, j*d, k*d];
				intonation[i][j][k] = ((fund * Math.pow(2, (i*7)/12)) * Math.pow(2, (j*4)/12))*Math.pow(2, (k*10)/12);
			}
		}
	}

    const vertex = new THREE.SphereGeometry(0.5, 30, 30);
	
	lattice = new THREE.Group();

	const geometry = [];
	const material = [];

    for(var i = 0; i<limitLattice; i++){
		for(var j = 0; j<limitLattice; j++){
			for(var k = 0; k<limitLattice; k++){
				note[i][j][k] = new THREE.Mesh( vertex, new THREE.MeshStandardMaterial( { color: 'white', roughness: 1, metalness: 0.5 } ) );
				note[i][j][k].position.set(spherePosition[i][j][k][0],spherePosition[i][j][k][1],spherePosition[i][j][k][2]);
				note[i][j][k].userData[0] = {MODEL: false, PREVIOUS: false};
				note[i][j][k].name = "vertex";
				note[i][j][k].uuid = [i, j, k];
				sound[i][j][k] = new THREE.PositionalAudio( listener );
				oscillator[i][j][k] = listener.context.createOscillator();
				oscillator[i][j][k].type = 'sawtooth';
				oscillator[i][j][k].frequency.setValueAtTime(intonation[i][j][k], listener.context.currentTime);
				oscillator[i][j][k].start(0);
				sound[i][j][k].setNodeSource(oscillator[i][j][k]);
				sound[i][j][k].setRefDistance(20);  
				sound[i][j][k].setVolume(0.0);
				//sound[i][j][k].connect(filter);
				note[i][j][k].add(sound[i][j][k]);
				lattice.add(note[i][j][k]);
			}
		}
	}

    lattice.name = "LATTICE";
    lattice.position.set(-0.5*(limitLattice),0.8,-0.5*(limitLattice + d)); // trovare position in f(limitLattice e distanza d)

    scene.add( lattice );

    // GUI
    initGUI(limitLattice, oscillator);

}

function changeState(Object){
	
	if (Object.userData[0].MODEL==false) {
		Object.userData[0].MODEL= true;
		myRender(Object);	
		
		db.collection("state").doc("counter").set({
			id_note: Object.uuid,
			value: Object.userData[0].MODEL,
			color: color[Object.userData[0].MODEL]
		})
	}
	else {Object.userData[0].MODEL= false;
		myRender(Object);	
		db.collection("state").doc("counter").set({
			id_note: Object.uuid,
			value: Object.userData[0].MODEL,
			color: color[Object.userData[0].MODEL]
		})
	}
}	

function myRender(Object){
	Object.material.emissive.setHex( color[Object.userData[0].MODEL] );
	if(Object.children[0]) Object.children[0].gain.gain.setTargetAtTime(Object.userData[0].MODEL*0.125, listener.context.currentTime + 0, 0.5);
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
	function onSelectStart() {
		userData.isSelecting = true;
	}

	function onSelectEnd() {
		userData.isSelecting = false;
	}

	controller1 = renderer.xr.getController( 0 );
	controller1.addEventListener( 'selectstart', onSelectStart );
	controller1.addEventListener( 'selectend', onSelectEnd );

    controller1.addEventListener( 'connected', function ( event ) {
    	this.add( buildController( event.data ) );
	} );

    controller1.addEventListener( 'disconnected', function () {
		this.remove( this.children[ 0 ] );
	} );

    scene.add( controller1 );

    controller2 = renderer.xr.getController( 1 );
	controller2.addEventListener( 'selectstart', onSelectStart );
	controller2.addEventListener( 'selectend', onSelectEnd );

    controller2.addEventListener( 'connected', function ( event ) {
		this.add( buildController( event.data ) );
	} );

    controller2.addEventListener( 'disconnected', function () {
    	this.remove( this.children[ 0 ] );
	} );

    scene.add( controller2 );

    const controllerModelFactory = new XRControllerModelFactory();

    // CONTROLLER GRIP
    controllerGrip1 = renderer.xr.getControllerGrip( 0 );
	controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
	scene.add( controllerGrip1 );

	controllerGrip2 = renderer.xr.getControllerGrip( 1 );
	controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
	scene.add( controllerGrip2 );

    // RAYCASTER
    raycaster = new THREE.Raycaster()
    const workingMatrix = new THREE.Matrix4();
    const origin = new THREE.Vector3();
    const controls = new OrbitControls( camera, renderer.domElement );
	controls.update();

}

function buildController( data ){
    let geometry, material;

    switch ( data.targetRayMode ) {

        case 'tracked-pointer':

            geometry = new THREE.BufferGeometry();
            geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
            geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

            material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

            return new THREE.Line( geometry, material );

        case 'gaze':

            geometry = new THREE.RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
            material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
            return new THREE.Mesh( geometry, material );

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

function handleController( controller ){
    if ( controller.userData.isSelecting ) {

        // const object = room.children[ count ++ ];

        // object.position.copy( controller.position );
        // object.userData.velocity.x = ( Math.random() - 0.5 ) * 3;
        // object.userData.velocity.y = ( Math.random() - 0.5 ) * 3;
        // object.userData.velocity.z = ( Math.random() - 9 );
        // object.userData.velocity.applyQuaternion( controller.quaternion );

        // if ( count === room.children.length ) count = 0;
    }
}
    
function render() {
    if (renderer.xr.isPresenting) {
        handleController( controller1 );
	    handleController( controller2 );
    }
    
    // world.step(dt);
    // helper.update( );
    renderer.render(scene, camera );
}