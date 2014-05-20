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
		circle = new grease.Circle(random(40, 650), random(40, 500), random(10,50), mat);
		circle.on('click', function (e) {
			scene.remove(e.actualTarget);
		});
		circles.push(circle);
	}



	// Variable time loop for rendering - from requestAnimationFrame
	scene.add(circles).on('update', function (info) {
		updateInfo(info);
	}).start();



	// Fixed time loop to update
	window.setInterval(function () {
		_.each(circles, function (circle) {
			circle.moveTo({
				x: circle.position.x += randomSign() * 2,
				y: circle.position.y += randomSign() * 2
			});
		});
	}, 20);

};