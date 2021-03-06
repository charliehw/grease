module('grease.Scene tests');


test('Canvas creation and deletion', function () {

	ok(document.getElementsByTagName('canvas').length === 0, 'No canvas in document before scene construction');
	var scene = new grease.Scene('#scene');

	ok(document.getElementsByTagName('canvas').length === 2, 'Canvases created by scene construction');
	scene.destroy();
	ok(document.getElementsByTagName('canvas').length === 0, 'Canvases destroyed by Scene#destroy');

});


asyncTest('Scene start event', function () {

	expect(2);
	var scene = new grease.Scene('#scene');

	scene.on('start', function (e) {
		ok(e.type === 'start', 'Start event fired and handler was called');
		ok(this === scene, 'Context of event handler set to scene itself');
		scene.destroy();
		start();
	}).start();
	
});