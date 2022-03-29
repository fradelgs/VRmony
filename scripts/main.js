const myTitle = document.querySelector('p');
myTitle.textContent = 'Pssst... Hey, you!';


var audio = new Audio('audio/lets-get-it-on.m4a');

document.querySelector(".overlay").style.cursor = "pointer";

document.querySelector('.overlay').onclick = function() {
 lets_play();
}

function lets_play(){
	var zone = document.querySelector('.redlight');
	if (zone.style.boxShadow == "none") {
		zone.style.boxShadow = "0px 200px 400px red inset";
		zone.style.filter = "brightness(85%)";
		audio.play();
	} else {
		zone.style.boxShadow = "none";
		zone.style.filter = "brightness(100%)";
		audio.pause();
	}
}