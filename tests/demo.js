// Test scene
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
	
	window.scene = new grease.Scene('#canvas');

	var shapes = [],
		shape,
		mat,
		opts,
		number = 100;


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
		shape.on('click', function (e) {
			scene.remove(this);
		});
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

	sprite.move({x: 100, y: 50}, 1000).on('click', function (e) {
		scene.remove(this);
	});

	scene.add(sprite).on('render', function (info) {
		if (info.frame % 2 === 0) {
			sprite.step(-1);
		}
	});

};