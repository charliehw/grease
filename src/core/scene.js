/**
 * Represents a scene, managing the canvas, animation, rendering etc.
 * @constructor
 * @augments grease.Group
 * @param {string} selector - Selector for the container DOM node
 * @throws {Error} No container found matching selector
 */
grease.Scene = grease.Group.extend({

    /**
     * Actual constructor implementation
     * @memberof grease.Scene#
     */
    constructor: function (selector) {

        this.container = doc.querySelector(selector);

        if (!this.container) {
            throw new Error('No container found matching selector, ' + selector + '. Cannot create scene.');
        }

        this.frameBuffer = new grease.FrameBuffer(this.container);
        this.listener = new grease.Listener(this);

    },

    /**
     * Start the animation loop
     * @memberof grease.Scene#
     * @fires start
     * @returns {grease.Scene}
     */
    start: function () {
        if (!this.animating) {
            this.trigger('start', {type: 'start'});
            this.animating = true;
            this.loop();
        }
        return this;
    },

    /**
     * Pause the animation loop
     * @memberof grease.Scene#
     * @fires stop
     * @returns {grease.Scene}
     */
    stop: function () {
        this.trigger('stop', {type: 'stop'});
        this.animating = false;
        return this;
    },

    /**
     * Internal animation loop
     * @memberof grease.Scene#
     * @fires render
     * @returns {grease.Scene}
     */
    loop: function () {
        var self = this;

        if (self.animating) {
            root.requestAnimationFrame(function () {    
                self.updateFrameInfo();
                self.trigger('render', self.frameInfo);

                self.render(self.frameBuffer.context(), self.transform, self.frameInfo);
                self.frameBuffer.flip();

                self.loop();
            });
        }

        return this;
    },

    /**
     * Update the frame info object
     * @memberof grease.Scene#
     */
    updateFrameInfo: function () {
        var now = date.now();
        if (!this.frameInfo) {
            this.frameInfo = {
                time: now,
                elapsed: 0,
                frame: 0,
                fps: 0
            };
        } else {
            this.frameInfo.elapsed = now - this.frameInfo.time;
            this.frameInfo.time = now;
            this.frameInfo.frame++;
            this.frameInfo.fps = root.parseInt(1000/this.frameInfo.elapsed);
        }
    },

    /**
     * Stop the scene and remove it's canvas
     * @memberof grease.Scene#
     * @returns {grease.Scene}
     */
    destroy: function () {
        this.stop();
        this.frameBuffer.destroy();
        return this;
    }

});