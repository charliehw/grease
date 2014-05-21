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

	var shapes = [],
		shape,
		mat,
		opts,
		number = 1000;


	while (number--) {
		mat = new grease.Material({fillStyle: 'rgb(' + random(0, 255) + ', ' + random(0, 255) + ', ' + random(0, 255) + ')'});

		opts = {
			x: random(40, 650), 
			y: random(40, 500), 
			material: mat
		};

		if (number % 2 === 0) {
			opts.radius = random(10,50);
			shape = new grease.Circle(opts);
		} else {
			opts.width = random(20, 100);
			opts.height = random(20, 100);
			shape = new grease.Rectangle(opts);
		}
		shape.on('click', function (e) {
			scene.remove(this);
		});
		shapes.push(shape);
	}



	// Variable time loop for rendering - from requestAnimationFrame
	scene.add(shapes).on('render', function (info) {
		updateInfo(info);
	}).start();



	// Fixed time loop to update
	window.setInterval(function () {
		scene.each(function () {
			this.moveTo({
				x: this.position().x += randomSign(),
				y: this.position().y += randomSign()
			});
		}).moveTo({
			x: scene.position().x += 1,
			y: scene.position().y
		});
	}, 1000/60);

};