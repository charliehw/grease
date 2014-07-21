/* global grease */

function random(a, b) {
	return Math.floor(Math.random()*(b-a+1)+a);
}

var updateInfo = (function () {
	var fps = document.querySelector('#fps');
	return function (info) {
		fps.innerHTML = info.fps;
	};
}());

window.onload = function () {
	
	var scene = new grease.Scene('#scene', 700, 500);

	var shapes = [],
		shape,
		mat,
		opts,
		number = 100;


	function removeShape() {
		scene.remove(this);
	}

	while (number--) {
		mat = new grease.Material({fillStyle: 'rgb(' + random(0, 255) + ', ' + random(0, 255) + ', ' + random(0, 255) + ')'});

		opts = {
			x: random(-650, 650), 
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
		shape.on('click', removeShape);
		shapes.push(shape);
	}


	// Variable time loop for rendering - from requestAnimationFrame
	scene.add(shapes).on('render', function (info) {
		updateInfo(info);
	}).start();


	var moveLeft = true;
	// Fixed time loop to update
	window.setInterval(function () {
		
		var p = scene.position();

		if (moveLeft) {
			scene.move({
				x: 1
			});
			if (p.x >= 180) {
				moveLeft = false;
			}
		} else {
			scene.move({
				x: -1
			});
			if (p.x <= 0) {
				moveLeft = true;
			}
		}

		scene.each(function () {
			this.move({
				x: random(-1, 1),
				y: random(-1, 1)
			});
		});

	}, 1000/60);


	var sprite = new grease.Sprite({
		src: 'img/sheet.png',
		rows: 4,
		cols: 6,
		cells: 23
	});

	sprite.move({x: 100, y: 50}, 1000, 'easeInQuad').on('click', function () {
		scene.remove(this);
	});

	scene.add(sprite).on('render', function (info) {
		if (info.frame % 2 === 0) {
			sprite.step(-1);
		}
	});


	var text = new grease.Text({
		text: 'This is text!',
		x: 100,
		y: 100
	});

	scene.add(text);




	var line = new grease.Line({
		points: [
			{x: 40, y: 400},
			{x: 60, y: 140},
			{x: 20, y: 140},
		],
		fill: false,
		material: new grease.Material({
			lineWidth: 5,
			strokeStyle: 'rgb(0,0,0)'
		})
	});

	scene.add(line);

};