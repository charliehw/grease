// Test scene
function random(a, b) {
	return Math.floor(Math.random() * b) + a;
}

function randomSign() {
	return Math.round(Math.random()) * 2 - 1;
}

var updateInfo = (function () {
	var fps = document.querySelector('#fps');
	return function (info) {
		fps.innerHTML = info.fps;
	};
}());

window.onload = function () {
	
	window.scene = new grease.Scene('#canvas');

	var circles = [],
		circle,
		mat,
		number = 100;


	while (number--) {
		mat = new grease.Material({fillStyle: 'rgb(' + random(0, 255) + ', ' + random(0, 255) + ', ' + random(0, 255) + ')'});
		circle = new grease.Circle({
			x: random(40, 650), 
			y: random(40, 500), 
			radius: random(10,50), 
			material: mat
		});
		circle.on('click', function (e) {
			scene.removeChild(e.actualTarget);
		});
		circles.push(circle);
	}



	// Variable time loop for rendering - from requestAnimationFrame
	scene.add(circles).on('update', function (info) {
		updateInfo(info);
	}).start();



	// Fixed time loop to update
	window.setInterval(function () {
		scene.eachChild(function () {
			this.moveTo({
				x: this.position.x += randomSign() * 2,
				y: this.position.y += randomSign() * 2
			});
		});
	}, 20);

};