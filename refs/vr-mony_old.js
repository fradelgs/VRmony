const xr = navigator.xr;

// TRIGGER-CLICK  _OK!
AFRAME.registerComponent('cursor-listener', {
    init: function () {
      var lastIndex = -1;
      var COLORS = ['#8e9471', '#8e9471', '#8e9471']; //'red', 'green', 'blue'
      var intensity = 0;
      this.el.addEventListener('click', function (evt) {
        lastIndex = (lastIndex + 1) % COLORS.length;
        intensity = (intensity + 1) %2;
        this.setAttribute('material', 'color', COLORS[lastIndex]);
        this.setAttribute('sound', 'volume', intensity);
        console.log('I was clicked at: ', evt.detail.intersection.point);
      });
    }
  });

// // TRIGGER-PLAY/STOP
// AFRAME.registerComponent('play',{
//     init: function() {
//       var myEl = document.querySelector('#octahedronC');
//       this.el.addEventListener('click', function (){
//         myEl.components.sound.playSound();
//       });
//     }
// });

// AFRAME.registerComponent('stop',{
//   init: function() {
//     var myEl = document.querySelector('[sound]');
//     this.el.addEventListener('click', function (){
//       myEl.components.sound.pauseSound();
//     });
//   }
// });

// RAYCASTER COLLISION CHECK  _NOT-OK
  AFRAME.registerComponent('collider-check', {
    dependencies: ['raycaster'],
    init: function () {
      this.el.addEventListener('raycaster-intersection', function () {
        this.setAttribute('lineColor', red);
        this.setAttribute('lineOpacity', 0.5);
        console.log('Player hit something!');
      });
    }
  });

// // THUMBSTICK CONTROLS
// AFRAME.registerComponent('thumbstick-logging',{
//   init: function () {
//     this.el.addEventListener('thumbstickmoved', this.logThumbstick);
//   },
//   logThumbstick: function (evt) {
//     if (evt.detail.y > 0.95) { console.log("DOWN"); }
//     if (evt.detail.y < -0.95) { console.log("UP"); }
//     if (evt.detail.x < -0.95) { console.log("LEFT"); }
//     if (evt.detail.x > 0.95) { console.log("RIGHT"); }
//   }
// });