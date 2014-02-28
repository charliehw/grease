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
		number = 200;


	while (number--) {
		mat = new grease.Material({fillStyle: 'rgb(' + random(0, 255) + ', ' + random(0, 255) + ', ' + random(0, 255) + ')'});
		circle = new grease.Circle({x: random(40, 650), y: random(40, 500)}, random(10,50), mat);
		circle.on('click', function (e) {
			scene.remove(e.actualTarget);
		});
		circles.push(circle);
	}

	scene.add(circles).on('frame', function (info) {
		var time = info.elapsed / 1000;

		_.each(circles, function (circle) {
			circle.position.x += randomSign() * 20 * time;
			circle.position.y += randomSign() * 20 * time;
		});

		updateInfo(info);

	}).start();

};