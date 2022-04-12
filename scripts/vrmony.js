import * as THREE from '../../libs/three/three.module.js';
import { VRButton } from '../../libs/three/jsm/VRButton.js';
// import { VRButton } from 'https://unpkg.com/three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { Stats } from '../../libs/stats.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import { CannonHelper } from '../../libs/CannonHelper.js';

import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/controls/PointerLockControls.js';
import { GUI } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/libs/dat.gui.module.js';
import { RectAreaLightHelper } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { Sky } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/objects/Sky.js';
// Find the latest version by visiting https://cdn.skypack.dev/three.
// Terminal: npm run dev
//import vertices from './vertices.js'; // note that we have the freedom to use import m instead of import k, because k was default export
//import spherePosition from './spherePosition.js';

class Vrmony{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
        this.listener = new THREE.AudioListener();

		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 1.6, 0 );
        this.camera.lookAt( 0, 0, -2 );
        this.camera.add(listener);
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x505050 );

		this.scene.add( new THREE.HemisphereLight( 0x555555, 0xFFFFFF ) );

        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1.25, 1.25 ).normalize();
        light.castShadow = true;
        const size = 15;
        light.shadow.left = -size;
        light.shadow.bottom = -size;
        light.shadow.right = size;
        light.shadow.top = size;
		this.scene.add( light );
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.shadowMap.enabled = true;
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		container.appendChild( this.renderer.domElement );
        
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 0, -3);
        this.controls.update();
        
        this.stats = new Stats();
        document.body.appendChild( this.stats.dom );
        
        this.initScene();
        this.setupVR();
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
        
        this.raycaster = new THREE.Raycaster();
        this.workingMatrix = new THREE.Matrix4();
        this.origin = new THREE.Vector3();
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initScene(){
        
        //Create a marker to indicate where the joint is
        const geometry = new THREE.SphereBufferGeometry( 0.1, 8, 8 );
        const material = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
        this.marker = new THREE.Mesh( geometry, material );
        this.marker.visible = false;
        this.scene.add(this.marker);

        this.initPhysics();
    }

    initPhysics(){
        this.world = new CANNON.World();
		
        this.dt = 1.0/60.0;
	    this.damping = 0.01;
		
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.gravity.set(0, -10, 0);
  
        this.helper = new CannonHelper( this.scene, this.world );
		
        const groundShape = new CANNON.Plane();
        //const groundMaterial = new CANNON.Material();
        const groundBody = new CANNON.Body({ mass: 0 });//, material: groundMaterial });
        groundBody.quaternion.setFromAxisAngle( new CANNON.Vec3(1,0,0), -Math.PI/2);
        groundBody.addShape(groundShape);
        this.world.add(groundBody);
        this.helper.addVisual(groundBody, 0xffaa00);

        // Joint body
        const shape = new CANNON.Sphere(0.1);
        this.jointBody = new CANNON.Body({ mass: 0 });
        this.jointBody.addShape(shape);
        this.jointBody.collisionFilterGroup = 0;
        this.jointBody.collisionFilterMask = 0;
        this.world.add(this.jointBody);

        this.box = this.addBody();
    }

    addBody(box=true){
        let shape;
        if (!box){
            shape = new CANNON.Sphere(0.5);
        }else{
            shape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5));
        }
        const material = new CANNON.Material();
        const body = new CANNON.Body({ mass: 5, material: material });
        body.addShape(shape);

        body.position.set(0, 1, -3);
        body.linearDamping = this.damping;
        this.world.add(body);

        this.helper.addVisual(body);

        return body;
    }

    addConstraint(pos, body){
        const pivot = pos.clone();
        body.threemesh.worldToLocal(pivot);
        
        this.jointBody.position.copy(pos);
 
        const constraint = new CANNON.PointToPointConstraint(body, pivot, this.jointBody, new CANNON.Vec3(0,0,0));

        this.world.addConstraint(constraint);
        
        this.controller.userData.constraint = constraint;
    }


    setupVR(){
        this.renderer.xr.enabled = true;
        
        const button = new VRButton( this.renderer );
        
        const self = this;
        
        function onSelectStart() {
            
            this.userData.selectPressed = true;
            if (this.userData.selected){
                self.addConstraint( self.marker.getWorldPosition( self.origin ), self.box );
                self.controller.attach( self.marker );
            }
        }

        function onSelectEnd() {

            this.userData.selectPressed = false;
            const constraint = self.controller.userData.constraint;
            if (constraint){
                self.world.removeConstraint(constraint);
                self.controller.userData.constraint = undefined;
                self.scene.add( self.marker );
                self.marker.visible = false;
            }
            
        }
        
        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'selectstart', onSelectStart );
        this.controller.addEventListener( 'selectend', onSelectEnd );
        this.controller.addEventListener( 'connected', function ( event ) {

            const mesh = self.buildController.call(self, event.data );
            mesh.scale.z = 0;
            this.add( mesh );

        } );
        this.controller.addEventListener( 'disconnected', function () {

            this.remove( this.children[ 0 ] );
            self.controller = null;
            self.controllerGrip = null;

        } );
        this.scene.add( this.controller );

        const controllerModelFactory = new XRControllerModelFactory();

        this.controllerGrip = this.renderer.xr.getControllerGrip( 0 );
        this.controllerGrip.add( controllerModelFactory.createControllerModel( this.controllerGrip ) );
        this.scene.add( this.controllerGrip );
    }

    buildController( data ) {
        let geometry, material;
        
        switch ( data.targetRayMode ) {
            
            case 'tracked-pointer':

                geometry = new THREE.BufferGeometry();
                geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
                geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

                material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

                return new THREE.Line( geometry, material );

            case 'gaze':

                geometry = new THREE.RingBufferGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
                material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
                return new THREE.Mesh( geometry, material );

        }

    }
    
    handleController( controller ){
        if (!controller.userData.selectPressed){
            controller.children[0].scale.z = 10;

            this.workingMatrix.identity().extractRotation( controller.matrixWorld );

            this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
            this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.workingMatrix );

            const intersects = this.raycaster.intersectObject( this.box.threemesh.children[0] );

            if (intersects.length>0){
                this.marker.position.copy(intersects[0].point);
                this.marker.visible = true;
                controller.children[0].scale.z = intersects[0].distance;
                controller.userData.selected = true;
            }else{
                this.marker.visible = false;
                controller.userData.selected = false;
            }
        }else{
            const constraint = controller.userData.constraint;
            if (constraint){
                this.jointBody.position.copy( this.marker.getWorldPosition( this.origin ) );
                constraint.update(); 
            }
        }
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        this.stats.update();
        if (this.renderer.xr.isPresenting) this.handleController( this.controller );
        this.world.step(this.dt);
        this.helper.update( );
        this.renderer.render( this.scene, this.camera );
    }
}

export { Vrmony };

//////////

// Your web app's Firebase configuration
const firebaseConfig = {

  apiKey: "AIzaSyBBxwvgfNZysOF69F-mO5GJB0d6OtDBrG0",

  authDomain: "vr-mony.firebaseapp.com",

  projectId: "vr-mony",

  storageBucket: "vr-mony.appspot.com",

  messagingSenderId: "870369185832",

  appId: "1:870369185832:web:583fe2ce2748a0170c651d"

};

firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();

let model = false;
let id = [];
//////////

let cube, cube2;
let triangle = [];
let sky, floor;
let scene, camera, raycaster, renderer;
let container, stats;
let CLICKED = null;

let color = {
	false: 'white', 
	true: '0xff00ff'
};

// const pointer = new THREE.Vector2();

// //var AudioContext = window.AudioContext || window.webkitAudioContext;
// //var audioCtx = new AudioContext();
// const listener = new THREE.AudioListener();

let material = [];

let LFO;
let sound2;

var freq = 220;
let volume = 0.0;

init();
animate();

function init(){
	// container = document.createElement( 'div' );
	// document.body.appendChild( container );

	// camera
	// camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
	// camera.position.set( 0, -5, 50 );
	// camera.add(listener);
        
	// scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 'white' );
	scene.add(camera);

	// sky
	sky = new Sky();
	sky.scale.setScalar( 450000 );
	scene.add( sky );

	// // light
	// const BackLight = new THREE.DirectionalLight(0xffffff, 0.3)
	// BackLight.position.set( 50,1,-50);
	// scene.add(BackLight)

	// const FrontLight = new THREE.DirectionalLight(0xffffff, 1)
	// FrontLight.position.set( 50,3,50);
	// scene.add(FrontLight)

	///////////
 
	var limitLattice = 3;
	const intonation = [];
	let fund = 261.6;

	for(var i = 0; i < limitLattice; i++){
		intonation.push(fund * Math.pow(2, (i*4)/12));
		//console.log(thirds.push(fund * Math.pow(2, (i*4)/12)))
	}


	const d = 10;
	var note = new Array(limitLattice);
	var sound = new Array(limitLattice);
	var oscillator = new Array(limitLattice);
	var spherePosition = new Array(limitLattice);

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
				spherePosition[i][j][k] = [ d * (i+0.5), d*j, d*k];
				intonation[i][j][k] = ((fund * Math.pow(2, (i*7)/12)) * Math.pow(2, (j*4)/12))*Math.pow(2, (k*10)/12);
			}
		}
	}

	console.log(intonation)

	const vertex = new THREE.SphereGeometry(3, 30, 30);
	
	cube = new THREE.Group();

	const geometry = [];
	const material = [];

	for(var i = 0; i<limitLattice; i++){
		for(var j = 0; j<limitLattice; j++){
			for(var k = 0; k<limitLattice; k++){
				note[i][j][k] = new THREE.Mesh( vertex, new THREE.MeshStandardMaterial( { color: 'darkred', roughness: 1, metalness: 0.5 } ) );
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
				note[i][j][k].add(sound[i][j][k]);
				cube.add(note[i][j][k]);
			}
		}
	}

	cube.rotation.y = -Math.PI;
	cube.position.x = d;

	
	cube.uuid = "CUBO"
	scene.add( cube );

	////////

	// raycaster = new THREE.Raycaster();
	// renderer = new THREE.WebGLRenderer( { antialias: true } );
	// renderer.setPixelRatio( window.devicePixelRatio );
	// renderer.setSize( window.innerWidth, window.innerHeight );
	// renderer.outputEncoding = THREE.sRGBEncoding;
	// renderer.xr.enabled = true;

	// const controls = new OrbitControls( camera, renderer.domElement );

	// controls.update();
	
	// container.appendChild( renderer.domElement );
	// stats = new Stats();
	// container.appendChild( stats.dom );
	


	const GeneratorControls = function () {

		this.frequency = oscillator[0][0][0].frequency.value;
		this.wavetype = oscillator[0][0][0].type;

	};

	const GenerateLimit = function () {

		this.limitLattice = limitLattice;
	};

	const gui = new GUI();
	const generatorControls = new GeneratorControls();
	const generatorFolder = gui.addFolder( 'sound generator' );
	generatorFolder.add( generatorControls, 'frequency' ).min( 50.0 ).max( 5000.0 ).step( 1.0 ).onChange( function () {

		freq = generatorControls.frequency;
		//oscillator[0][0][0].frequency.setValueAtTime( freq, listener.context.currentTime );

		for(var i = 0; i<limitLattice; i++){
			for(var j = 0; j<limitLattice; j++){
				for(var k = 0; k<limitLattice; k++){
					oscillator[i][j][k].frequency.setValueAtTime( intonation[i][j][k], listener.context.currentTime );
				}
			}
		}

	} );
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

	const generatorLim = new GenerateLimit();
	const LimFolder = gui.addFolder( 'lim generator' );
	LimFolder.add( generatorLim, 'limitLattice' ).min( 1 ).max( 5 ).step( 1 ).onChange( function () {

		limitLattice = generatorLim.limitLattice;
		console.log(limitLattice)
	
	})

	const cameraFolder = gui.addFolder('Camera')
	cameraFolder.add(camera.position, 'z', -100, 100)
	cameraFolder.open()

	document.addEventListener( 'pointerdown', mouseDown, false );
	//document.addEventListener( 'pointermove', hover, false );

	window.addEventListener( 'resize', onWindowResize );
	document.body.appendChild( VRButton.createButton( renderer ) );
	db.collection("state").doc("counter").onSnapshot(db_callback);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function db_callback(doc) {
	console.log("New data received: ", doc.data())

	if(doc.data()){
		model = doc.data().value; 
		id = doc.data().id_note;
	}

	console.log(doc)
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
	const clicks = raycaster.intersectObjects( scene.children, true );

	if ( clicks.length > 0){

		CLICKED = clicks[ 0 ].object; // get clicked object

		const id = CLICKED.uuid; //getID of clicked object
		console.log("id " + id)
		
		changeState(CLICKED);

		console.log(CLICKED);
	}
}

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	stats.update();
}