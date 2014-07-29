module('grease.Group tests');


test('Adding and removing a shape to/from group', function () {
	var group = new grease.Group(),
		shape = new grease.Shape({});

	ok(group.length === 0, 'Group length is zero before adding any shapes');

	group.add(shape);

	ok(group.length === 1, 'Group length is 1 after adding a shape');

	group.each(function () {
		ok(this === shape, 'Group contains shape after it has been added and context of call to Group#each is set to the shape');
	});

	group.remove(shape);

	ok(group.length === 0, 'Group length is zero after removing the shape');

});


test('Adding and removing multiple shapes to/from group', function () {
	var group = new grease.Group(),
		shape1 = new grease.Shape({}),
		shape2 = new grease.Shape({}),
		shape3 = new grease.Shape({});

	ok(group.length === 0, 'Group length is zero before adding any shapes');

	group.add([shape1, shape2, shape3]);

	ok(group.length === 3, 'Group length is 3 after adding an array of shapes');

	group.remove(shape2);

	ok(group.length === 2, 'Group length is 2 after removing a shape');

	group.each(function (index) {
		switch (index) {
			case 0:
				ok(this === shape1, 'Group contains the right shapes after one has been removed');
				break;
			case 1:
				ok(this === shape3, 'Group contains the right shapes after one has been removed');
				break;
		}
	});

});


test('Emptying a group', function () {

	var group = new grease.Group(),
		shape = new grease.Shape({});

	ok(group.length === 0, 'Group length is zero before adding any shapes');

	group.add(shape);

	ok(group.length === 1, 'Group length is 1 after adding a shape');

	group.empty();

	ok(group.length === 0, 'Group length is zero after emptying group');

});