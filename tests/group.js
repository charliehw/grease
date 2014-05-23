module('grease.Group tests');


test('Adding and removing shapes to/from group', function () {
	var group = new grease.Group(),
		shape = new grease.Shape({});

	ok(group.length === 0, 'Group length is zero before adding any shapes');

	group.add(shape);

	ok(group.length === 1, 'Group length is 1 after adding some shapes')

	group.each(function () {
		ok(this === shape, 'Group contains shape after it has been added and context of call to Group#each is set to the shape');
	});

	group.remove(shape);

	ok(group.length === 0, 'Group length is zero after removing any shapes');

});

