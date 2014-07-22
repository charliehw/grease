/* global grease, module, test, ok */

module('grease.utilities tests');


test('Vector utilities', function () {
	
	var vector1 = grease.utilities.vector(5, 10),
		vector2 = grease.utilities.vector(-3, 7),
		summedVector = grease.utilities.addVectors(vector1, vector2);

	ok(vector1.x === 5 && vector1.y === 10, 'First vector created with correct x and y values');
	ok(vector2.x === -3 && vector2.y === 7, 'Second vector created with correct x and y values');
	ok(summedVector.x === 2 && summedVector.y === 17, 'Summed vector created with correct x and y values');

});