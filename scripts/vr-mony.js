import * as THREE from './libs/three/three.module.js';
import { BoxLineGeometry } from './libs/three/jsm/BoxLineGeometry.js';
import { VRButton } from './libs/VRButton.js';
import { XRControllerModelFactory } from './libs/three/jsm/XRControllerModelFactory.js';
import { OrbitControls } from './libs/three/jsm/OrbitControls.js';
import { GUI } from './libs/three/jsm/dat.gui.module.js';

let camera, listener, scene, raycaster, renderer, pointer, CLICKED;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let room, marker, floor, baseReferenceSpace;
let settings;
let spherePosition;
let BallDistance = 2; // Distance between two balls
let SpheresPerEdge = 3; // per Edge
let Lattice = new THREE.Group();
let oscillator = new Array(SpheresPerEdge);
let gainNode = [];
let intonation = new Array(SpheresPerEdge);
let mixer;
let light1;
let ball = new Array(SpheresPerEdge);;
let audioCtx;
let f0 = 65.406; //Lattice Fundamental Frequency
let Oct = 1;
let k = 100;
let t = k * (1/f0);
let normAmp = 1/Math.pow(SpheresPerEdge, 3); //normalizzazione del volume
let xAxisInterval = 7; //Fifths default
let yAxisInterval = 4; //Maj.Thirds default
let zAxisInterval = 10; // min. Seventh default

let intersected = [];
let floor_intersection;
const floor_tempMatrix = new THREE.Matrix4();

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
    camera.position.set( 0, 1.6, 10);
    // camera.lookAt( 0, 0, 0 );
    camera.add(listener);

    // ROOM
    room = new THREE.LineSegments(
        new BoxLineGeometry( 20, 10, 20, 10, 10, 10 ).translate( 0, 5, 0 ),
        new THREE.LineBasicMaterial( { color: 0x808080 } )
    );
    
    scene.add(room);

	// MARKER
	marker = new THREE.Mesh(
		new THREE.CircleGeometry( 0.25, 32 ).rotateX( - Math.PI / 2 ),
		new THREE.MeshBasicMaterial( { color: 0x8b0000 } )
	);
	scene.add( marker );
	
	// FLOOR
	floor = new THREE.Mesh(
		new THREE.PlaneGeometry( 20, 20, 10, 10 ).rotateX( - Math.PI / 2 ),
		new THREE.MeshBasicMaterial( { color: 'green', transparent: true, opacity: 0.25 } )
	);
	scene.add( floor );

    // LIGHT
	const ambienceLight = new THREE.HemisphereLight( 0x606060, 0x404040 );
	const light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 ).normalize();
	light.intensity = 0.4;
	ambienceLight.intensity = 0.5;
	scene.add( ambienceLight);
	scene.add( light ); 

	// RAYCASTER
	raycaster = new THREE.Raycaster();
	
    // LATTICE
    initLatticeNEW();
	console.log(ball)

	//destroyLattice();
	console.log(ball)

	initSoundLattice();

	Lattice.position.set(-0.5*(SpheresPerEdge),0.8,-0.5*(SpheresPerEdge + BallDistance)); // trovare position in f(SpheresPerEdge e distanza d)
	// Creation of Lattice "Metadata"
	Lattice.name = "Lattice"; // per intersect nel raycaster!
	
	ball[1][1][1].material.emissiveIntensity = 1;
	light1 = new THREE.PointLight( 0xff0040, 100, 50 );
	ball[1][1][1].add(light1);
	ball[1][1][1].material.emissive = {r:1,g:0,b:0.25};

	fundGlow();

	SoundVisualPatching();
	
	// GUI
	initGUI();

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

    document.addEventListener( 'pointerdown', mouseDown, false );
    window.addEventListener('resize', onWindowResize, false );
}

function fundGlow(){
	t = 100 * (1/f0);
	// create some keyframe tracks
	const lightIntensityKF = new THREE.NumberKeyframeTrack( '.children[0].intensity', [ 0, t, 2*t], [ 0, 1, 0] );
	const colorKF = new THREE.ColorKeyframeTrack( '.material.emissiveIntensity', [ 0, 1*t, 2*t ], [ 0, 1, 0]);
	const clip = new THREE.AnimationClip( 'default', 2*t, [lightIntensityKF, colorKF]);
	mixer = new THREE.AnimationMixer( ball[1][1][1] );
	const clipAction = mixer.clipAction( clip );
	clipAction.play();
}

function defBallMatrix(){

	for (var i = 0; i < SpheresPerEdge; i++) {
		ball[i] = new Array(SpheresPerEdge);
	}
	
	for (var i = 0; i < SpheresPerEdge; i++) {
		for (var j = 0; j < SpheresPerEdge; j++) {
			ball[i][j] = new Array(SpheresPerEdge);
		}
	}

	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				spherePosition = [i*BallDistance, j*BallDistance, k*BallDistance];
				ball[i][j][k] = Ball();
				ball[i][j][k].userData[0] = {MODEL: false, PREVIOUS: false};
			}
		}
	}
}

function initLatticeNEW(){
	defBallMatrix();
	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				Lattice.add(ball[i][j][k]);
			}
		}
	}
	scene.add(Lattice);
}

function destroyLattice(){
	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				ball.pop();
			}
		}
	}
}

function defSoundMatrices(){
	for (var i = 0; i < SpheresPerEdge; i++) {
		intonation[i]= new Array(SpheresPerEdge);
		gainNode[i] = new Array(SpheresPerEdge);
		oscillator[i] = new Array(SpheresPerEdge);
		sound[i] = new Array(SpheresPerEdge);
	}

	for (var i = 0; i < SpheresPerEdge; i++) {
		for (var j = 0; j < SpheresPerEdge; j++) {
			intonation[i][j]= new Array(SpheresPerEdge);
			gainNode[i][j] = new Array(SpheresPerEdge);
			oscillator[i][j] = new Array(SpheresPerEdge);
			sound[i][j] = new Array(SpheresPerEdge);
		}
	}
}

function initIntonation(){

	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				intonation[i][j][k]=(f0 *(Math.pow(2, Oct) * Math.pow(2, ((i-1)*xAxisInterval)/12)) * Math.pow(2, ((j-1)*yAxisInterval)/12))* Math.pow(2, ((k-1)*zAxisInterval)/12);
			}
		}
	}

	return intonation;
}

function initOscFreqs(){

	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				oscillator[i][j][k].frequency.setValueAtTime(intonation[i][j][k], audioCtx.currentTime);
			}
		}
	}
	//return intonation;
}

function initSoundLattice(){
	defSoundMatrices();
	initIntonation();

	for(var i = 0; i< SpheresPerEdge; i++){
		for(var j = 0; j< SpheresPerEdge; j++){
			for(var k = 0; k< SpheresPerEdge; k++){
				gainNode[i][j][k] = audioCtx.createGain();
				oscillator[i][j][k]= audioCtx.createOscillator()
				oscillator[i][j][k].type = 'sine';
				oscillator[i][j][k].frequency.setValueAtTime(intonation[i][j][k], audioCtx.currentTime);
				oscillator[i][j][k].start(0);
				sound[i][j][k] = new THREE.PositionalAudio( listener );
				sound[i][j][k].setNodeSource(oscillator[i][j][k]);
				sound[i][j][k].setVolume(0.0);
				// connect oscillator to gain node to speakers
  				oscillator[i][j][k].connect(gainNode[i][j][k]);
  				gainNode[i][j][k].connect(audioCtx.destination);
				gainNode[i][j][k].gain.value = 0.0;
			}
		}
	}
}

function SoundVisualPatching(){

	let soundTempinRaw = new Array();

	for(var i = 0; i < SpheresPerEdge; i++){
		for(var j = 0; j < SpheresPerEdge; j++){
			for(var k = 0; k < SpheresPerEdge; k++){
				soundTempinRaw.push(sound[i][j][k]);
			}
		}
	}

	for(var i = 0; i<Math.pow(SpheresPerEdge,3); i++){
		Lattice.children[i].add(soundTempinRaw[i]);
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
	if(object.children[lastIndex]) object.children[lastIndex].gain.gain.setTargetAtTime(object.userData[0].MODEL*normAmp*8, listener.context.currentTime + 0, 0.5);
	//console.log(object.children[lastIndex])
}

function myRender(object){
	object.material.color.setHex( color[object.userData[0].MODEL] );
}

function mouseDown(event) {
	// find intersections
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	raycaster.setFromCamera( pointer, camera );
   
    var intersectable = scene.getObjectByName("Lattice", true);

    const intersects = raycaster.intersectObjects( intersectable.children, true );

	if ( intersects.length > 0){

		CLICKED = intersects[ 0 ].object; // get clicked object

		const id = CLICKED.uuid; //getID of clicked object
		
		changeState(CLICKED);
	}
}

function initGUI(){

	const panel = new GUI( { width: 400 });

	const folder1 = panel.addFolder( 'Sound Generator' );

	settings = {
		'Wave Form': 'sine',
		'Fundamental Frequency': 'C',
		'x-axis Interval': 'V',
		'y-axis Interval': 'M III',
		'z-axis Interval': 'm VII',
		'Octave': 1,
		'Intonation System': 'Equal Temperament',
		'SpheresPerEdge': 1,
	}

	//folder1.add( settings, 'frequency', 20.0, 20000.0, 0.01 ).listen().onChange( setFreq( f0 ));

    folder1.add( settings, 'Wave Form', ['sine', 'square', 'sawtooth', 'triangle']).onChange(setWave);
	folder1.add( settings, 'Fundamental Frequency', ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] ).onChange(setf0);
	folder1.add( settings, 'x-axis Interval', ['m II', 'M II', 'm III', 'M III','IV', 'm V', 'V', 'm VI', 'M VI', 'm VII', 'M VII', 'VIII']).onChange(setXaxis);
	folder1.add( settings, 'y-axis Interval', ['m II', 'M II', 'm III', 'M III','IV', 'm V', 'V', 'm VI', 'M VI', 'm VII', 'M VII', 'VIII']).onChange(setYaxis);
	folder1.add( settings, 'z-axis Interval', ['m II', 'M II', 'm III', 'M III','IV', 'm V', 'V', 'm VI', 'M VI', 'm VII', 'M VII', 'VIII']).onChange(setZaxis);
	folder1.add( settings, 'Octave', 0, 6, 1 ).onChange(setOctave);
	//folder1.add( settings, 'Intonation System', ['Equal Temperament', 'Pythagorean tuning']).onChange(intonationSystem);
	//folder1.add( settings, 'SpheresPerEdge', 1, 3, 1 ).onChange(setSpheresPerEdge);

    folder1.open();
}

/*function setSpheresPerEdge(NumberOfSpheres){
	destroyLattice();
	SpheresPerEdge = NumberOfSpheres;
	initLatticeNEW();
}*/

function setOctave(octave){
	Oct = octave;
	initIntonation();
	initOscFreqs();
	fundGlow();
}

function setXaxis(interval){
	switch (interval) {
		case 'm II': xAxisInterval = 1;
			break;
		case 'M II': xAxisInterval = 2;
			break;
		case 'm III': xAxisInterval = 3;
			break;
		case 'M III':  xAxisInterval = 4;
			break;
		case 'IV': xAxisInterval = 5;
			break;
		case 'm V': xAxisInterval = 6;
			break;
		case 'V': xAxisInterval = 7;
			break;
		case 'm VI':  xAxisInterval = 8;
			break;	
		case 'M VI': xAxisInterval = 9;
			break;
		case 'm VII': xAxisInterval = 10;
			break;	
		case 'M VII':  xAxisInterval = 11;
			break;
		case 'VIII':  xAxisInterval = 12;
			break;
		default: xAxisInterval = 4;
			break;
	}

	initIntonation();
	initOscFreqs();
	fundGlow();
}

function setYaxis(interval){
	switch (interval) {
		case 'm II': yAxisInterval = 1;
			break;
		case 'M II': yAxisInterval = 2;
			break;
		case 'm III': yAxisInterval = 3;
			break;
		case 'M III':  yAxisInterval = 4;
			break;
		case 'IV': yAxisInterval = 5;
			break;
		case 'm V': yAxisInterval = 6;
			break;
		case 'V': yAxisInterval = 7;
			break;
		case 'm VI':  yAxisInterval = 8;
			break;	
		case 'M VI': yAxisInterval = 9;
			break;
		case 'm VII': yAxisInterval = 10;
			break;	
		case 'M VII':  yAxisInterval = 11;
			break;
		case 'VIII':  yAxisInterval = 12;
			break;
		default: yAxisInterval = 4;
			break;
	}

	initIntonation();
	initOscFreqs();
	fundGlow();
}

function setZaxis(interval){
	switch (interval) {
		case 'm II': zAxisInterval = 1;
			break;
		case 'M II': zAxisInterval = 2;
			break;
		case 'm III': zAxisInterval = 3;
			break;
		case 'M III':  zAxisInterval = 4;
			break;
		case 'IV': zAxisInterval = 5;
			break;
		case 'm V': zAxisInterval = 6;
			break;
		case 'V': zAxisInterval = 7;
			break;
		case 'm VI':  zAxisInterval = 8;
			break;	
		case 'M VI': zAxisInterval = 9;
			break;
		case 'm VII': zAxisInterval = 10;
			break;	
		case 'M VII':  zAxisInterval = 11;
			break;
		case 'VIII':  zAxisInterval = 12;
			break;
		default: zAxisInterval = 4;
			break;
	}

	initIntonation();
	initOscFreqs();
	fundGlow();
}

function setWave(a){
	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				oscillator[i][j][k].type=a;
			}
		}
	}
};

function intonationSystem(system){
	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				switch (system) {
					case 'Equal Temperament':
						intonation[i][j][k] = (f0 * Math.pow(2, (i*xAxisInterval)/12)) * Math.pow(2, (j*yAxisInterval)/12)*Math.pow(2, (k*zAxisInterval)/12);
						break;

					case 'Pythagorean Tuning':
						intonation[i][j][k] = (f0 * Math.pow(3/2, i) * Math.pow(3/2, 0)*Math.pow(3/2, 0));
						break;
				
					default:
						break;
				}
			}
		}
	}

	initOscFreqs();
	fundGlow();
}

function setf0(fundNote){
	switch (fundNote) {
		case 'C': f0 = 65.406;
			break;
		case 'C#': f0 = 65.406 * Math.pow(2, 1/12);
			break;
		case 'D': f0 = 65.406 * Math.pow(2, 2/12);
			break;
		case 'D#': f0 = 65.406 * Math.pow(2, 3/12);
			break;
		case 'E': f0 = 65.406 * Math.pow(2, 4/12);
			break;
		case 'F': f0 = 65.406 * Math.pow(2, 5/12);
			break;
		case 'F#': f0 = 65.406 * Math.pow(2, 6/12);
			break;
		case 'G': f0 = 65.406 * Math.pow(2, 7/12);
			break;	
		case 'G#': f0 = 65.406 * Math.pow(2, 8/12);
			break;
		case 'A': f0 = 65.406 * Math.pow(2, 9/12);
			break;	
		case 'A#': f0 = 65.406 * Math.pow(2, 10/12);
			break;
		case 'B': f0 = 65.406 * Math.pow(2, 11/12);
			break;	
		default: f0 = 65.406;
			break;
	}

	initIntonation();
	initOscFreqs();
	fundGlow();
};


function setupVR(){
    renderer.xr.enabled = true;

    // VR BUTTON
    const button = new VRButton( renderer );

    // CONTROLLERS
	function onSelectStart(event) {
		this.userData.isSelecting = true;
		var controller = event.target;
		var intersections = getIntersections(controller);	// get intersected objects
	
		if (intersections.length > 0){
			var intersection = intersections[ 0 ]; // get the first intersected object
			var object = intersection.object;
			changeState(object);
	
			// controller.attach(object);
			// 	controller.userData.selected = object;
			// 	const id = object.uuid; //getID of clicked object
			// 	console.log("id " + id);
		}
	}
	
	function onSelectEnd() {
		this.userData.isSelecting = false;
	
		if ( floor_intersection ) {
			const baseReferenceSpace = renderer.xr.getReferenceSpace();

			const offsetPosition = { x:  -floor_intersection.x, y:  -floor_intersection.y, z:  -floor_intersection.z, w: 1 };
			const offsetRotation = new THREE.Quaternion();
			const transform = new XRRigidTransform( offsetPosition, offsetRotation );
			
			// const offsetPosition = camera.position;
        	// const offsetRotation = camera.rotation;
        	// const transform = new XRRigidTransform( offsetPosition, offsetRotation );
        
			const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace( transform );
	
			renderer.xr.setReferenceSpace( teleportSpaceOffset );
	
		}
	}

	controller1 = renderer.xr.getController( 0 );
	controller1.name ="right";
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
	controller2.name ="left";
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

	// DOLLY
	var dolly = new THREE.Group();
    // dolly.position.set(0, 0, 0);
    dolly.name = "dolly";
    scene.add(dolly);
    dolly.add(camera);
    dolly.add(controller1);
    dolly.add(controller2);
    dolly.add(controllerGrip1);
    dolly.add(controllerGrip2);

    
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



////////////////
function buildController( data ) {

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
////////////////

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
		line.scale.z = 20;   //MODIFIED AS OUR SCENE IS LARGER
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

	floor_intersection = undefined;

	if ( controller1.userData.isSelecting === true ) {

		floor_tempMatrix.identity().extractRotation( controller1.matrixWorld );

		raycaster.ray.origin.setFromMatrixPosition( controller1.matrixWorld );
		raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( floor_tempMatrix );

		const floor_intersects = raycaster.intersectObjects( [ floor ] );

			if ( floor_intersects.length > 0 ) {

				floor_intersection = floor_intersects[ 0 ].point;

			}

	} else if ( controller2.userData.isSelecting === true ) {

		floor_tempMatrix.identity().extractRotation( controller2.matrixWorld );

		raycaster.ray.origin.setFromMatrixPosition( controller2.matrixWorld );
		raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( floor_tempMatrix );

		const floor_intersects = raycaster.intersectObjects( [ floor ] );

		if ( floor_intersects.length > 0 ) {
			floor_intersection = floor_intersects[ 0 ].point;
		}

	}

	if ( floor_intersection ) marker.position.copy( floor_intersection );

	marker.visible = floor_intersection !== undefined;

	renderer.render(scene, camera );    
}
