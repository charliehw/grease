/**
 * Manages all the events triggered on the scene
 * @constructor
 * @param {grease.Scene} scene
 */
grease.Listener = function (scene) {
    this.scene = scene;
    this.captureEvents = true;
    this.init();
};

/**
 * List of events being handled by the event manager
 * @memberof grease.Listener
 * @static
 * @enum
 */
grease.Listener.events = {

    MOUSE: [
        'click',
        'mousedown',
        'mouseup',
        'mousemove',
        'dblclick'
    ],

    TOUCH: [
        'touchstart',
        'touchmove',
        'touchend'
    ],

    KEY: [
        'keyup',
        'keydown',
        'keypress'
    ],

    RESIZE: 'resize'
    
};

_.extend(grease.Listener.prototype, {

    /**
     * Reference to constructor
     * @memberof grease.Listener#
     */
    constructor: grease.Listener,

    /**
     * Initialise the event manager, setting a handler on the scene container for all listed event types
     * @memberof grease.Listener#
     */
    init: function () {
        var self = this,
            pointerEvents = grease.Listener.events.MOUSE.concat(grease.Listener.events.TOUCH);

        // Set up event handlers and delegation
        _.each(pointerEvents, function (event) {
            self.scene.container.addEventListener(event, function (e) {
                e.preventDefault();
                if (self.captureEvents) {
                    var greasyEvent = new grease.Event(e);
                    self.findMatches(greasyEvent);
                }            
            });
        });

        // Set up window event handlers for key events
        _.each(grease.Listener.events.KEY, function (event) {
            root.addEventListener(event, function (e) {
                if (self.captureEvents) {
                    self.scene.trigger(event, e);
                }
            });
        });

        self.scene.container.addEventListener(grease.Listener.events.RESIZE, function () {
            self.scene.trigger(grease.Listener.events.RESIZE, {
                type: grease.Listener.events.RESIZE
            });
        });
    },

    /**
     * Find all shapes matching the coordinates of the event and trigger that event on matches
     * @memberof grease.Listener#
     * @param {grease.Event} e
     */
    findMatches: function (e) {
        var matchingShapes = this.scene.testBounds(e, this.scene.transform),
            bubblePath = this.getBubblePath(matchingShapes).reverse(),
            shape;

        // Events on the container should always trigger on the scene, even if no shapes match
        if (!bubblePath.length) {
            bubblePath.push(this.scene);
        }

        for (var index = 0, length = bubblePath.length; index < length && !e.propagationStopped; index++) {
            shape = bubblePath[index];

            if (index === 0) {
                e.target = shape;
            }

            shape.trigger(e.type, e);

            index++;
        }
        
    },

    /**
     * Reformat the matches into an array ordered for bubbling
     * @memberof grease.Listener#
     * @param shape
     * @param [path]
     * @returns {array} - Ordered path of matching shapes
     */
    getBubblePath: function (shape, path) {
        path = path || [];

        if (shape.group) {
            path.push(shape.group);
            if (shape.shapes.length) {
                this.getBubblePath(shape.shapes[shape.shapes.length - 1], path);                 
            }
        } else {
            path.push(shape);
        }

        return path;      
    }

});