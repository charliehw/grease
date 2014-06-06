/* global grease, module, test, ok */

module('grease.Shape tests');


test('Shape extension', function () {
	var NewShape = grease.Shape.extend({
		constructor: function () {}
	});

	var instanceOfNewShape = new NewShape({
		x: 0,
		y: 0
	});

	ok(instanceOfNewShape instanceof NewShape, 'Newly created shape constructed properly');
	ok(instanceOfNewShape instanceof grease.Shape, 'Prototype chain set up properly');
});


test('Shape moveTo', function () {
	var shape = new grease.Shape({
		x: 30,
		y: 20
	});

	ok(shape.position().x === 30 && shape.position().y === 20, 'Shape position set correctly on construction');

	shape.move({
		x: 50,
		y: 80
	});

	ok(shape.position().x === 80 && shape.position().y === 100, 'Shape moved to expected position');
});


test('Event handling', function () {
	var shape = new grease.Shape({});

	shape.on('click', function () {
		ok(this === shape, 'Click handler called and context set appropriately in callback');
	});

	shape.trigger('click');

});