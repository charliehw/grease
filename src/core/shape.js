/**
 * Basic subclass drawable shape
 * @constructor
 * @param opts
 * @param {number} [opts.x=0] Horizontal position
 * @param {number} [opts.y=0] Vertical position
 * @param {number} [opts.scale=1]
 * @param {number} [opts.rotation=0]
 * @param {boolean} [opts.static=false]
 * @param {grease.Material} [opts.material=grease.defaultMaterial]
 */
grease.Shape = function (opts) {

    this.renderFlag = true;
    this.material = opts.material || grease.defaultMaterial;

    this.transform = {
        position: grease.util.vector(opts.x || 0, opts.y || 0),
        scale: _.isUndefined(opts.scale) ? 1 : opts.scale,
        rotation: opts.rotation || 0
    };

    // opt.static = false stops the shape or group from being checked for events at all
    // If it's a group, no shapes within the group will be checked either
    this.registerEvents = !opts.static;

    // Container for event handlers
    this.handlers = {};

    // States used by the event manager for mouseover mouseout
    this.states = {
        mousedover: false
    };

    // Updates used for animation
    this.updateQueue = [];

};

_.extend(grease.Shape.prototype, {

    /**
     * Reference to constructor
     * @memberof grease.Shape#
     */
    constructor: grease.Shape,

    /**
     * Apply the material to the canvas, called whilst the shape being rendered
     * @memberof grease.Shape#
     * @param context
     * @param transform
     * @param {number} transform.scale
     * @returns {grease.Shape}
     */
    applyMaterial: function (context, transform) {
        var mat = this.material;
        if (mat.fillStyle && !this.isOutline) {
            context.fillStyle = mat.fillStyle;
            context.fill();
        }

        context.lineWidth = mat.lineWidth * transform.scale;

        if (mat.lineCap) {
            context.lineCap = mat.lineCap;
        }
        if (mat.strokeStyle) {
            context.strokeStyle = mat.strokeStyle;
            context.stroke();
        }
        return this;
    },

    /**
     * Defines an event handler
     * @memberof grease.Shape#
     * @param {string} types - Event types to listen for, space delimited
     * @param {function} handler
     * @returns {grease.Shape}
     */
    on: function (types, handler) {
        _.each(types.split(' '), function (type) {
            if (this.handlers[type]) {
                this.handlers[type].push(handler);
            } else {
                this.handlers[type] = [handler];
            }
        }, this);
        return this;
    },

    /**
     * Removes an event handler
     * @memberof grease.Shape#
     * @param {string} [types] - Removes handlers for event types, space delimited
     * @param {function} [handler] - Removes a specific handler for a specific event
     * @returns {grease.Shape}
     */
    off: function (types, handler) {
        if (types) {
            _.each(types.split(' '), function (type) {
                if (this.handlers[type]) {
                    if (handler) {
                        // If handler is included, remove only that handler
                        this.handlers[type] = _.without(this.handlers[type], handler);
                    } else {
                        // Otherwise remove all handlers for the specified event
                        this.handlers[type] = null;
                    }
                }
            }, this);
        } else {
            this.handlers = {};
        }
        
        return this;
    },

    /**
     * Calls all handlers for specified event types
     * @memberof grease.Shape#
     * @param {string} types - Event types being triggered, space delimited
     * @param {event} [e]
     * @returns {grease.Shape}
     */
    trigger: function (types, e) {
        _.each(types.split(' '), function (type) {
            _.each(this.handlers[type], function (handler) {
                handler.call(this, e);
            }, this);
        }, this);

        return this;
    },

    /**
     * Test a point against the shape or the bounds set on it
     * @memberof grease.Shape#
     * @param coords
     * @param transform
     * @returns {boolean}
     */
    testBounds: function (coords, transform) {
        // this.registerEvents determines if any checking should take place for this shape at all
        if (this.registerEvents) {
            // Calculate the shape's absolute transform, otherwise this would have to be done in every shape's checkCollision
            transform = this.getAbsoluteTransform(transform);

            // If the shape has a 'bounds' property and it is a valid shape, use that to check for a collision
            if (this.bounds && this.bounds instanceof grease.Shape) {
                return this.bounds.checkCollision(coords, transform);
            } else {
                return this.checkCollision(coords, transform);
            }
        } else {
            return false;
        }
    },

    /**
     * Implemented by subclasses
     * @memberof grease.Shape#
     * @returns {boolean}
     */
    checkCollision: function () {
        return false;
    },

    /**
     * Parent transforms are taken into account to render a shape. This function compounds the parent transform with the shape's transform
     * @memberof grease.Shape#
     * @param transform
     * @returns {object}
     */
    getAbsoluteTransform: function (transform) {
        return {
            position: grease.util.vector(this.transform.position.x + transform.position.x, this.transform.position.y + transform.position.y),
            scale: this.transform.scale * transform.scale,
            rotation: this.transform.rotation + transform.rotation 
        };
    },

    /**
     * Move the shape relative to its current position. Animate if duration supplied
     * @memberof grease.Shape#
     * @param position Vector to move by or line to follow or a function that returns the required options
     * @param {number} [duration] Duration of animated movement
     * @param {function} [easing]
     * @returns {grease.Shape}
     * @throws {TypeError} Position provided is not valid
     */
    move: function (position, duration, easing) {
        if (typeof position === 'function') {
            var options = position.call(this);
            return this.move(options.position, options.duration, options.easing);
        } else if (duration) {
            this.animate({
                position: grease.util.addVectors(this.position(), position)
            }, duration, easing);
        } else if (_.isNumber(position.x) || _.isNumber(position.y)) {
            position.x = position.x || 0;
            position.y = position.y || 0;
            this.position(grease.util.addVectors(this.transform.position, position));
        } else {
            throw new TypeError('Invalid position provided for move operation.');
        }
        return this;
    },

    /**
     * Get or set the position of the shape relative to its group
     * @memberof grease.Shape#
     * @param {number} [position]
     * @param {number} [position.x] Horizontal position to move to or vector
     * @param {number} [position.y] Vertical position to move to
     * @returns {object}
     */
    position: function (position) {
        if (position && _.isNumber(position.x) && _.isNumber(position.y)) {
            this.transform.position = position;
        } else {
            return this.transform.position;
        }
    },

    /**
     * Renders the shape by updating any animations and then drawing it
     * @memberof grease.Shape#
     * @param context
     * @param transform
     * @param {frameInfo} frameInfo
     * @returns {grease.Shape}
     */
    render: function (context, transform, frameInfo) {
        // Apply any active animations
        this.update(frameInfo);

        transform = this.getAbsoluteTransform(transform);
        this.draw(context, transform, frameInfo);

        return this;
    },

    /**
     * Update the shape based on any queued animations
     * @memberof grease.Shape#
     * @param {frameInfo} frameInfo Includes information on the current frame
     * @returns {grease.Shape}
     */
    update: function (frameInfo) {
        if (!this.updateQueue.length) {
            return this;
        }

        var update = this.updateQueue[0],
            newPosition,
            elapsed;

        // If the animation has just started, store the initial transform
        if (update.elapsed === 0) {
            update.initial = {
                position: grease.util.vector(this.transform.position.x, this.transform.position.y)
            };
        }

        if (update.elapsed + frameInfo.elapsed > update.duration) {
            // If the frame overlaps the end of the animation, just do the last bit of the animation
            elapsed = update.duration;
        } else {
            // Otherwise do the whole segment of the animation based on time elapsed from last frame 
            elapsed = update.elapsed;
        }

        if (!update.easing || typeof update.easing !== 'function') {
            update.easing = grease.easing[update.easing] || grease.easing['linear'];
        }


        newPosition = grease.util.vector(
            update.easing(elapsed, update.initial.position.x, update.transform.position.x || 0, update.duration || 1),
            update.easing(elapsed, update.initial.position.y, update.transform.position.y || 0, update.duration || 1)
        );

        update.elapsed += frameInfo.elapsed;

        this.position(newPosition);

        if (update.elapsed >= update.duration) {
            this.updateQueue.splice(0, 1);
        }

        return this;
    },

    /**
     * Add an animation to the shape's queue
     * @memberof grease.Shape#
     * @param transform
     * @param duration
     * @param [easing]
     * @returns {grease.Shape}
     */
    animate: function (transform, duration, easing) {
        this.updateQueue.push({
            transform: transform,
            duration: duration,
            easing: easing,
            elapsed: 0
        });

        return this;
    },

    /**
     * Stop the shape's animation
     * @memberof grease.Shape#
     * @param {boolean} [clearQueue] Determines if the queue of animations should be cleared
     * @param {boolean} [jumpToEnd] Determines if the current animation should be completed instantly or discarded
     * @returns {grease.Shape}
     */
    stop: function (clearQueue, jumpToEnd) {
        if (clearQueue) {
            // Remove all but first update in queue
            this.updateQueue.splice(1, this.updateQueue.length - 1);
        }

        if (jumpToEnd) {
            // Complete the first update immediately
            this.updateQueue[0].duration = 0;
        } else {
            // Remove the first update from the queue
            this.updateQueue.splice(0, 1); 
        }

        return this;
    }

});


/**
 * Extend the base Shape to create a new shape contructor
 * @memberof grease.Shape
 * @static
 * @param prototypeMethods
 * @param staticMethods
 * @returns {function}
 * @example 
 *  var Star = grease.Shape.extend({
 *      constructor: function (opts) {...},
 *      draw: function (context, transform) {...}
 *  });
 */
grease.Shape.extend = function (prototypeMethods, staticMethods) {
    var constructorToBeExtended = this;

    function Contructor() {
        var args = arguments.length ? Array.prototype.slice.call(arguments) : [{}];
        constructorToBeExtended.apply(this, args);
        prototypeMethods.constructor.apply(this, args);
    }

    _.extend(Contructor, {extend: constructorToBeExtended.extend}, staticMethods);

    Contructor.prototype = Object.create(constructorToBeExtended.prototype);
    _.extend(Contructor.prototype, prototypeMethods);

    return Contructor;
};