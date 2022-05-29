import * as THREE from './libs/three/three.module.js';
import { BoxLineGeometry } from './libs/three/jsm/BoxLineGeometry.js';
import { VRButton } from './libs/VRButton.js';
import { XRControllerModelFactory } from './libs/three/jsm/XRControllerModelFactory.js';

let camera, listener, scene, raycaster, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let room;

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
    camera.position.set( 0, 1.6, 0 );
    camera.lookAt( 0, 0, -2 );
    camera.add(listener);

    // ROOM
    room = new THREE.LineSegments(
        new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ),
        new THREE.LineBasicMaterial( { color: 0x808080 } )
    );
    room.geometry.translate( 0, 3, 0 );
    scene.add(room);

    // LIGHT
    scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );
	const light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 ).normalize();
	scene.add( light ); 

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild( renderer.domElement );

    window.addEventListener('resize', onWindowResize );
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