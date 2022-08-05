import * as THREE from './libs/three/three.module.js';
import { BoxLineGeometry } from './libs/three/jsm/BoxLineGeometry.js';
import { VRButton } from './libs/myVRButton.js';
import { XRControllerModelFactory } from './libs/three/jsm/XRControllerModelFactory.js';
import { OrbitControls } from './libs/three/jsm/OrbitControls.js';
import { GUI } from './libs/three/jsm/dat.gui.module.js';

// POLYFILL
// provides support for mobile devices and devices which do not support WebVR (To be removed when WebXR will be widely supported)
import {QueryArgs} from './libs/query-args.js';
import WebXRPolyfill from './libs/webxr-polyfill.module.js';
if (QueryArgs.getBool('usePolyfill', true)) {
    let polyfill = new WebXRPolyfill();
}

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA0hcLZTFS_yfJDLZQc6jOS6CKDFumKagc",
    authDomain: "vr-mony-database.firebaseapp.com",
    projectId: "vr-mony-database",
    storageBucket: "vr-mony-database.appspot.com",
    messagingSenderId: "804712135463",
    appId: "1:804712135463:web:2b51ea8d9bb7e093ed8702"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
let state = 0; // value

let camera, listener, scene, raycaster, renderer, controls, pointer, CLICKED;
let controller1, controller2, controllerGrip1, controllerGrip2, line;
let light1, room, floor, floor_marker;
let clock = new THREE.Clock();
let settings;
let spherePosition, SphereName;
let BallDistance = 2; // Distance between two balls
let SpheresPerEdge = 3; // per Edge
let Lattice = new THREE.Group();
let oscillator = new Array(SpheresPerEdge);
let gainNode = [];
let intonation = new Array(SpheresPerEdge);
let mixer;
let ball = new Array(SpheresPerEdge);;
let audioCtx;
let switch_arp = 0, bpm=120, steps=4, pattern='Ascending', ArpLoop, arp_f0;
let notes = [arp_f0, arp_f0*Math.pow(2, 4/12), arp_f0*Math.pow(2, 7/12), arp_f0*Math.pow(2, 10/12), arp_f0*Math.pow(2, 13/12), arp_f0*Math.pow(2, 16/12)];
let f0 = 32.703; //Lattice Fundamental Frequency
let Oct = 3;
let k = 100;
let t = k * (1/f0);
let normAmp = 1/Math.pow(SpheresPerEdge, 3); //volume normalization
let xAxisInterval = 7; //Fifths default
let yAxisInterval = 4; //Maj.Thirds default
let zAxisInterval = 10; // min.Seventh default
let xColor = '#8f140e';
let yColor = '#0e8f1b';
let zColor = '#0e178f';
let name = "Sphere";
let intersected = [];
let sound = [];
let color = {0: '0xffffff',	1: '0xff00ff'};


const container = document.createElement( 'div' );
document.body.appendChild( container );

initScene();
animate();
setupVR();


function initScene(){
    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x505050 );

    // LISTENER
    listener = new THREE.AudioListener();
	audioCtx = listener.context;

    // CAMERA
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight);
    camera.position.set( -8.5, 7 , 1);
    camera.add(listener);

    // ROOM
    room = new THREE.LineSegments(
        new BoxLineGeometry( 20, 10, 20, 10, 10, 10 ).translate( 0, 5, 0 ),
        new THREE.LineBasicMaterial( { color: 0x808080 } )
    );

	// REFERENCE SYSTEM
	const geometryX = new THREE.CylinderGeometry( 0.01, 0.07, 20, 32 );
	const geometryY = new THREE.CylinderGeometry( 0.07, 0.01, 10, 32 );
	const geometryZ = new THREE.CylinderGeometry( 0.07, 0.01, 20, 32 );
	const materialX = new THREE.MeshBasicMaterial( {color: xColor} );
	const materialY= new THREE.MeshBasicMaterial( {color: yColor} );
	const materialZ= new THREE.MeshBasicMaterial( {color: zColor} );

	const xline = new THREE.Mesh( geometryX, materialX );
	const yline = new THREE.Mesh( geometryY, materialY );
	const zline = new THREE.Mesh( geometryZ, materialZ );

	xline.rotateZ(Math.PI / 2);
	yline.position.y = 2;
	zline.rotateX(Math.PI / 2);

	let ref_syst = new THREE.Group();
	ref_syst.add(xline);
	ref_syst.add(yline);
	ref_syst.add(zline);
	ref_syst.position.y = 3;

	// FLOOR
	floor = new THREE.Mesh(
		new THREE.PlaneGeometry( 16, 16, 2, 2 ).rotateX( -Math.PI / 2 ),
		new THREE.MeshBasicMaterial( { color: 0x808080, transparent: true, opacity: 0.2 } )
	);

	// FLOOR MARKER
	floor_marker = new THREE.Mesh(
		new THREE.CircleGeometry( 0.15, 32 ).rotateX( -Math.PI / 2 ),
		new THREE.MeshBasicMaterial( { color: 0x808080 } )
	);
	scene.add( floor_marker );

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

	initSoundLattice();
	Lattice.position.set(-BallDistance, 0.5*BallDistance,-BallDistance);

	// Creation of Lattice "Metadata"
	Lattice.name = "Lattice"; // per intersect nel raycaster!

	ball[1][1][1].material.emissiveIntensity = 1;
	light1 = new THREE.PointLight( 0xff0040, 100, 50 );
	ball[1][1][1].add(light1);
	ball[1][1][1].material.emissive = {r:1,g:0,b:0.25};

	fundGlow();
	SoundVisualPatching();

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.xr.enabled = true;
	document.body.appendChild( renderer.domElement );

    // CONTROLS
	controls = new OrbitControls( camera, renderer.domElement );
	controls.target = new THREE.Vector3(0, 3, -6);
	controls.update();

	// POINTER
    CLICKED = null;
    pointer= new THREE.Vector2();
    document.addEventListener( 'pointerdown', mouseDown, false );

	// SYSTEM - for centering wrt the user
	var system = new THREE.Group();
	scene.add(system);
	system.add(ref_syst, room, floor, Lattice);
	system.position.set(0,0,-6);

	initGUI();	// GUI
	readStateFromDB();	// Read Database

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
				ball[i][j][k].name = name.concat(i, j, k);
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

function DBwrite(name, state){
	console.log("Sphere clicked: writing on database ... ")
	SphereName = name;
	db.collection("LatticeData").doc('Spheres').set({name: SphereName, value: state});
}

function readStateFromDB(){
	db.collection("LatticeData").doc('Spheres').
	onSnapshot((doc) => {
		if (doc.exists) {
			let key = doc.data().name;
			let value = doc.data().value;
			console.log("New data received: ", key, value)
			let object = scene.getObjectByName(key);
			object.userData[0].MODEL = value;

			if(object.userData[0].MODEL == false){
				stopAudioRender(object);
				myRender(object);
			} else {
				audioRender(object);
				myRender(object);
			}

		} else { // doc.data() will be undefined in this case
			console.log("No such document!");
			doc.catch((error) => {
				console.log("Error getting document:", error);
			})
		}
	});
};

function changeState(object){
	var lastIndex = object.children.length - 1;
	
	if(object.userData[0].MODEL == false){
		object.userData[0].MODEL = true;
		arp_f0 =  object.children[lastIndex].source.frequency.value;
		state = 1;
		
	} else {
		object.userData[0].MODEL = false;
		initIntonation();
		initOscFreqs();
		state = 0;
		
	}
}

function audioRender(object){
	var lastIndex = object.children.length - 1;
	console.log("qui: ", object.children[lastIndex].source.frequency.value)
	initIntonation();
	initOscFreqs();
	if(object.children[lastIndex]) {

		//ARPEGGIATOR ON
		if(switch_arp){
			object.children[lastIndex].gain.gain.setTargetAtTime(object.userData[0].MODEL*normAmp*8, listener.context.currentTime + 0.1, 0.5);

			function arpeggiator(arp_index){
				let ms = 1000*60/bpm;	// from bpm to milliseconds

				ArpLoop = setTimeout(function() {

					switch (pattern) {
						case 'Ascending': notes = [arp_f0, arp_f0*Math.pow(2, 4/12), arp_f0*Math.pow(2, 7/12), arp_f0*Math.pow(2, 10/12), arp_f0*Math.pow(2, 13/12), arp_f0*Math.pow(2, 16/12)];
							break;
						case 'Descending': notes = [arp_f0, arp_f0/Math.pow(2, 4/12), arp_f0/Math.pow(2, 7/12), arp_f0/Math.pow(2, 10/12), arp_f0/Math.pow(2, 13/12), arp_f0/Math.pow(2, 16/12)];
							break;
						case 'Ascending + Descending': notes = [arp_f0, arp_f0*Math.pow(2, 4/12), arp_f0*Math.pow(2, 7/12), arp_f0*Math.pow(2, 10/12), arp_f0*Math.pow(2, 7/12), arp_f0*Math.pow(2, 4/12)];
							break;
						default: notes = [arp_f0, arp_f0*Math.pow(2, 4/12), arp_f0*Math.pow(2, 7/12), arp_f0*Math.pow(2, 10/12), arp_f0*Math.pow(2, 13/12), arp_f0*Math.pow(2, 16/12)];
							break;
					}

					if (pattern=='Random') object.children[lastIndex].source.frequency.setValueAtTime(notes[(Math.floor(Math.random()*notes.length))%steps], audioCtx.currentTime);
					else object.children[lastIndex].source.frequency.setValueAtTime(notes[arp_index%steps], audioCtx.currentTime);
					arp_index = ++arp_index % steps; // Increment the index

					arpeggiator(arp_index);
				}, ms);//  <--BPM
			}

			arpeggiator(0);
		}

		//ARPEGGIATOR OFF
		else object.children[lastIndex].gain.gain.setTargetAtTime(object.userData[0].MODEL*normAmp*8, listener.context.currentTime + 0, 0.5);
	}
}

function stopAudioRender(object){
	var lastIndex = object.children.length - 1;
	//arp_f0 = object.children[lastIndex].source.frequency.value;

	if(object.children[lastIndex]) {
		//ARPEGGIATOR ON
		if(switch_arp){
			clearTimeout(ArpLoop);
			object.children[lastIndex].gain.gain.setTargetAtTime(object.userData[0].MODEL*normAmp*8, listener.context.currentTime + 0, 0);
			// object.children[lastIndex].source.frequency.setValueAtTime(arp_f0, listener.context.currentTime + 0, 0);
			//initIntonation();
			//initOscFreqs();
			console.log(arp_f0);
			//console.log(object.children[lastIndex].source.frequency.value);
		}
		//ARPEGGIATOR OFF
		else object.children[lastIndex].gain.gain.setTargetAtTime(object.userData[0].MODEL*normAmp*8, listener.context.currentTime + 0, 0.5);
	}
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
		SphereName = CLICKED.name;

		changeState(CLICKED);
		DBwrite(SphereName, state);
	}
}

function initGUI(){
	const panel = new GUI( { width: 500, height: 200});
	const folder1 = panel.addFolder( 'Sound Generator' );
	const folder2 = panel.addFolder( 'Arpeggiator Settings' );
	const folder3 = panel.addFolder( 'Axes Intervals' );

	settings = {
		'Wave Form': 'sine',
		'Fundamental Frequency': 'C',
		'Octave': 3,
		'Arp mode ON': false,
		'Pattern': 'Ascending',
		'BPM': 120,
		'Steps': 4,
		'x-axis': 'V' ,
		'y-axis': 'M III',
		'z-axis': 'm VII',

	}

    folder1.add( settings, 'Wave Form', ['sine', 'square', 'sawtooth', 'triangle']).onChange(setWave);
	folder1.add( settings, 'Fundamental Frequency', ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] ).onChange(setf0);
	folder1.add( settings, 'Octave', 1, 6, 1 ).onChange(setOctave);
	folder1.add( settings, 'Arp mode ON' ).onChange((val) => {setArpeggiator(val, folder2)});
	folder2.add( settings, 'Pattern', ['Ascending', 'Descending', 'Ascending + Descending', 'Random'] ).onChange((val) => {setArpPattern(val)});
	folder2.add( settings, 'BPM', 60, 400, 5 ).onChange((val) => {setArpBPM(val)});
	folder2.add( settings, 'Steps', 2, 6, 1).onChange((val) => {setArpSteps(val)});
	folder3.add( settings, 'x-axis', ['m II', 'M II', 'm III', 'M III','IV', 'm V', 'V', 'm VI', 'M VI', 'm VII', 'M VII', 'VIII']).onChange(setXaxis);
	folder3.add( settings, 'y-axis', ['m II', 'M II', 'm III', 'M III','IV', 'm V', 'V', 'm VI', 'M VI', 'm VII', 'M VII', 'VIII']).onChange(setYaxis);
	folder3.add( settings, 'z-axis', ['m II', 'M II', 'm III', 'M III','IV', 'm V', 'V', 'm VI', 'M VI', 'm VII', 'M VII', 'VIII']).onChange(setZaxis);

	folder1.open();
	folder3.open();

	panel.domElement.style.visibility = 'visible';

	// gui border colors
	let gui_waveform = panel.__ul.children[0].children[0].children[0].children[1].style.borderLeftColor = '#c24e91';
	let gui_fundfreq = panel.__ul.children[0].children[0].children[0].children[2].style.borderLeftColor = '#c24e91';
	let gui_oct = panel.__ul.children[0].children[0].children[0].children[3].style.borderLeftColor = '#c24e91';

	let gui_arp = panel.__ul.children[0].children[0].children[0].children[4].style.borderLeftColor = 'grey';
	let gui_pat = panel.__ul.children[1].children[0].children[0].children[1].style.borderLeftColor = 'grey';
	let gui_bpm = panel.__ul.children[1].children[0].children[0].children[2].style.borderLeftColor = 'grey';
	let gui_steps = panel.__ul.children[1].children[0].children[0].children[3].style.borderLeftColor = 'grey';

	let gui_xaxis = panel.__ul.children[2].children[0].children[0].children[1].style.borderLeftColor = xColor;
	let gui_yaxis = panel.__ul.children[2].children[0].children[0].children[2].style.borderLeftColor = yColor;
	let gui_zaxis = panel.__ul.children[2].children[0].children[0].children[3].style.borderLeftColor = zColor;
}

function setOctave(octave){
	Oct = octave;
	initIntonation();
	initOscFreqs();
	fundGlow();
}

function setArpeggiator(val, folder2){
	if (val==0){
		switch_arp = 0;
		folder2.close();
	}
	if (val==1){
		switch_arp = 1;
		folder2.open();
	}
}

function setArpBPM(val){
	bpm = val;
}

function setArpSteps(val){
	steps = val;
}

function setArpPattern(val){
	pattern = val;
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

// VR CONTROLLERS
function onSelectStart() {
	this.userData.isSelecting = true;
}

function onSelectEnd(event) {
	this.userData.isSelecting = false;

	// BALL SOUND ACTIVATION
	var controller = event.target;
	var intersections = getIntersections(controller);	// get intersected objects

	if (intersections.length > 0){
		var intersection = intersections[ 0 ]; // get the first intersected object
		var object = intersection.object;
		SphereName = object.name;
		changeState(object);
		DBwrite(SphereName, state);
	}
}

function setupVR(){
    renderer.xr.enabled = true;

    // VR BUTTON
    const button = new VRButton( renderer);

    //CONTROLLERs
	controller1 = renderer.xr.getController( 0 );
	controller1.name = "right";
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
	controller2.name = "left";
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
}

function buildController( data ) {
	let geometry, material;

	switch ( data.targetRayMode ) {
		case 'tracked-pointer':
			geometry = new THREE.BufferGeometry();
			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
			geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );
			material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );
			return line = new THREE.Line( geometry, material );

		case 'gaze':
			geometry = new THREE.RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
			material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
			return new THREE.Mesh( geometry, material );
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

	var intersections = getIntersections(controller);

	if (intersections.length > 0) {
		var intersection = intersections[0];
		var object = intersection.object;

		object.material.emissive.r = 1;
		object.material.emissiveIntensity = 1;
		intersected.push(object);
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
	controls.update();
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