/* global grease, module, test, ok */

module('grease.FrameBuffer tests');


test('Frame buffer', function () {

	var container = document.querySelector('#scene'),
		frameBuffer = new grease.FrameBuffer(container, 200, 200),
		canvases = document.querySelectorAll('canvas');

	ok(canvases[0].style.display === '' && canvases[1].style.display === 'none', 'Canvases created, one hidden, one visible');
	ok(frameBuffer.canvases[1] === frameBuffer.buffer, 'The hidden canvas will be drawn to');

	frameBuffer.flip();

	ok(canvases[0].style.display === 'none' && canvases[1].style.display === 'block', 'Canvases flipped');
	ok(frameBuffer.canvases[0] === frameBuffer.buffer, 'The hidden canvas will be drawn to after the flip');

});