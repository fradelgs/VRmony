var audio = new Audio('audio/lets-get-it-on.m4a');
audio.currentTime = 1.55;
var random_vinyl;
var vinyl_1 = new Audio('audio/vinyl_needle_1.wav');
var vinyl_2 = new Audio('audio/vinyl_needle_2.wav');
var vinyl_3 = new Audio('audio/vinyl_needle_3.wav');
var vinyl_4 = new Audio('audio/vinyl_needle_4.wav');
var vinyl_5 = new Audio('audio/vinyl_needle_5.wav');
var vinyl_6 = new Audio('audio/vinyl_needle_6.wav');
var vinyl_scratches = new Array(vinyl_1, vinyl_2, vinyl_3, vinyl_4, vinyl_5, vinyl_6);

var book = document.getElementById('book');

book.onmouseover = function() {lets_play()};
book.onmouseleave = function() {dont_play()};
book.setAttribute('onclick', 'location.href = "vrmony.html"');

function lets_play(){
	if (audio.paused == true) {
		audio.play();
	}
}

function dont_play(){
	if (audio.paused == false) {
		audio.pause();
		audio.currentTime = audio.currentTime - 0.5;
	
		random_vinyl = vinyl_scratches[Math.floor(Math.random()*vinyl_scratches.length)];
		random_vinyl.play();
	}
}