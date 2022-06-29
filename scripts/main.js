type = "text/javascript";

var audio = new Audio('audio/lets-get-it-on.m4a');
var book = document.getElementById('book');

book.onmouseover = function() {lets_play()};
book.onmouseleave = function() {dont_play()};
book.setAttribute('onclick', 'location.href = "vrmony.html"');

function lets_play(){
	if (audio.paused == true) {
		audio.currentTime = 1.5;
		audio.play();
	}
}

function dont_play(){
	if (audio.paused == false) {
		audio.pause();
		audio.currentTime = 1.5;
	}
}