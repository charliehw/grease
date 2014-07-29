/**
 * Custom event wrapper
 * @constructor
 * @param {Event} e
 */
grease.Event = function (e) {

    var touch = e;
    if (e.changedTouches) {
        touch = e.changedTouches[0];
    }

    this.x = touch.clientX;
    this.y = touch.clientY;

    this.originalEvent = e;
    this.type = e.type;
    this.propagationStopped = false;

};

_.extend(grease.Event.prototype, {

    /**
     * Reference to contructor
     * @memberof grease.Event#
     */
    constructor: grease.Event,

    /**
     * Stops propagation of the event
     * @memberof grease.Event#
     */
    stopPropagation: function () {
        this.propagationStopped = true;
    }

});