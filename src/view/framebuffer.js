/**
 * Frame buffer - ensures the scene is rendered to a hidden canvas each frame, which is then shown, therefore preventing partial frames
 * @constructor
 * @param {HTMLElement} container
 */
grease.FrameBuffer = function (container) {

    var first = new grease.Canvas(container, container.clientWidth, container.clientHeight),
        second = new grease.Canvas(container, container.clientWidth, container.clientHeight);

    second.hide();

    this.canvases = [first, second];
    this.visible = 0;
    this.buffer = second;

};

_.extend(grease.FrameBuffer.prototype, {

    /**
     * Reference to the constructor
     * @memberof grease.FrameBuffer#
     */
    constructor: grease.FrameBuffer,

    /**
     * Clear and hide the old frame, show the newly rendered frame
     * @memberof grease.FrameBuffer#
     */
    flip: function () {

        this.buffer = this.canvases[this.visible].hide().clear();
        this.visible = this.visible ? 0 : 1;

        this.canvases[this.visible].show();

    },

    /**
     * Get the context for the currently hidden frame
     * @memberof grease.FrameBuffer#
     * @returns {CanvasContext}
     */
    context: function () {
        return this.buffer.context();
    },

    /**
     * Destroy the frame buffer
     * @memberof grease.FrameBuffer#
     */
    destroy: function () {
        this.canvases[0].destroy();
        this.canvases[1].destroy();
    }

});