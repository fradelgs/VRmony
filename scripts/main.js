type = "text/javascript";

var audio = new Audio('audio/lets-get-it-on.m4a');
var book = document.getElementById('book');

book.onmouseover = function() {lets_play()};
book.onmouseleave = function() {dont_play()};
book.setAttribute('onclick', 'location.href = "vrmony.html"');
// book.setAttribute('onclick', 'location.href = "vr-mony-session.html"');
// book.onclick = function() {enterapp()};

function lets_play(){
	if (audio.paused == true) {
		audio.play();
	}
}

function dont_play(){
	if (audio.paused == false) {
		audio.pause();
	}
}

// function enterapp(){
//     var script = document.createElement("script");
//     script.type = "text/javascript";
//     script.src = "scripts/vrmony.js"; 
//     document.getElementsByTagName("head")[0].appendChild(script);
//     return false;
// }