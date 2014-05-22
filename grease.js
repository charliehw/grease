/* global define, require, exports */

/**
 * 2D animation framework for HTML canvas
 * @file grease.js
 * @author charliehw
 * @version 0.0.0
 * @todo Images, Lines, Gradients, Clipping, Text, Transformation, Sprites
 */

(function (root, factory) {
 
    // Environment setup taken from Backbone.js
    // Start with AMD
    if (typeof define === 'function' && define.amd) {

        define(['underscore', 'exports'], function (_, exports) {
            root.grease = factory(root, exports, _);
        });
 
    // Next for Node.js or CommonJS
    } else if (typeof exports !== 'undefined') {

        var _ = require('underscore');
        factory(root, exports, _);

    // Finally, as a browser global
    } else {

        root.grease = factory(root, {}, root._);

    }

}(this, function (root, grease, _) {

    var doc = root.document,
        math = root.Math,
        date = root.Date;

    var constants = {
        RADIAL_GRADIENT_TYPE: 'radial',
        LINEAR_GRADIENT_TYPE: 'linear'
    };

    grease.version = '0.0.0';


    root.requestAnimationFrame = (function () {
        return root.requestAnimationFrame || root.webkitRequestAnimationFrame || root.mozRequestAnimationFrame || function( callback ){
            root.setTimeout(callback, 1000 / 60);
        };
    }());


    /**
     * Basic subclass drawable shape
     * @constructor
     * @param opts
     * @param {number} opts.x Horizontal position
     * @param {number} opts.y Vertical position
     * @param {grease.Material} [opts.material]
     */
    grease.Shape = function (opts) {
        this.renderFlag = true;
        this.material = opts.material || grease.defaultMaterial;

        this.transform = {
            position: {
                x: opts.x || 0,
                y: opts.y || 0
            },
            scale: opts.scale || 1,
            rotation: opts.rotation || 0
        };

        // Container for event handlers
        this.events = {};

        // States used by the event manager for mouseover mouseout
        this.states = [];

        // Updates used for animation
        this.updateQueue = [];
    };

    _.extend(grease.Shape.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.Shape
         */
        constructor: grease.Shape,

        /**
         * Apply the material to the canvas, called whilst the shape being rendered
         * @memberof grease.Shape
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
            if (mat.lineWidth) {
                context.lineWidth = mat.lineWidth * transform.scale;
            }
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
         * @memberof grease.Shape
         * @param {string} event
         * @param {function} handler
         * @returns {grease.Shape}
         */
        on: function (event, handler) {
            if (this.events[event]) {
                this.events[event].push(handler);
            } else {
                this.events[event] = [handler];
            }
            return this;
        },

        /**
         * Removes an event handler
         * @memberof grease.Shape
         * @param {string} [event] - Removes handlers for a specific event
         * @param {function} [handler] - Removes a specific handler for a specific event
         * @returns {grease.Shape}
         */
        off: function (event, handler) {
            if (event) {
                if (this.events[event]) {
                    if (handler) {
                        // If handler is included, remove only that handler
                        this.events[event] = _.without(this.events[event], handler);
                    } else {
                        // Otherwise remove all handlers for the specified event
                        this.events[event] = null;
                    }
                }
            } else {
                this.events = {};
            }
            
            return this;
        },

        /**
         * Calls all handlers for a specific event
         * @memberof grease.Shape
         * @param {string} type - Event type being triggered
         * @param {event} e - Removes a specific handler for a specific event
         * @param data
         * @returns {grease.Shape}
         */
        trigger: function (type, e, data) {
            _.each(this.events[type], function (handler) {
                handler.call(this, e, data);
            }, this);
            return this;
        },

        /**
         * Unless the shape has bounds set against it, this should be implemented by a specific shape
         * @memberof grease.Shape
         * @param coords
         * @param transform
         * @returns {boolean}
         */
        testBounds: function (coords, transform) {
            return this.bounds ? this.bounds.testBounds(coords, transform) : false;
        },

        /**
         * Move the shape's position. Animate if duration supplied
         * @memberof grease.Shape
         * @param position Position to move to or line to follow or a function that returns the required options
         * @param {number} duration Duration of animated movement
         * @param {function} easing
         * @returns grease.Shape
         * @throws {TypeError} Position provided is not valid
         */
        moveTo: function (position, duration, easing) {
            if (typeof position === 'function') {
                var options = position.call(this);
                return this.moveTo(options.position, options.duration, options.easing);
            } else if (duration) {
                this.updates.push({
                    transform: {
                        position: position,
                    },
                    duration: duration,
                    easing: easing
                });
            } else if (_.isNumber(position.x) && _.isNumber(position.y)) {
                this.transform.position = position;
            } else {
                throw new TypeError('Invalid position provided for moveTo operation.');
            }
            return this;
        },

        /**
         * Parent transforms are taken into account to render a shape. This function compunds the parent transform with the shape's transform
         * @memberof grease.Shape
         * @param transform
         * @returns {object}
         */
        getAbsoluteTransform: function (transform) {
            return {
                position: {
                    x: this.transform.position.x + (transform.position.x || 0),
                    y: this.transform.position.y + (transform.position.y || 0),              
                },
                scale: this.transform.scale * (transform.scale || 1)
            };
        },

        /**
         * Get the relative position of the shape
         * @memberof grease.Shape
         * @returns {object}
         */
        position: function () {
            return this.transform.position;
        },

        /**
         * Renders the shape by updating any animations and then drawing it
         * @memberof grease.Shape
         * @returns grease.Shape
         */
        render: function (context, transform, frameInfo) {
            this.update(frameInfo);
            this.draw(context, transform);
            return this;
        },

        /**
         * Update the shape based on any queued animations
         * @memberof grease.Shape
         * @returns grease.Shape
         */
        update: function (frameInfo) {
            return this;
        },

        /**
         * Add an animation to the shape's queue
         * @memberof grease.Shape
         * @returns grease.Shape
         */
        animate: function (transform, duration, easing) {
            this.updates.push({
                transform: transform,
                duration: duration,
                easing: easing
            });

            return this;
        },

        /**
         * Stop the shape's animation
         * @memberof grease.Shape
         * @param {boolean} [clearQueue] Determines if the queue of animations should be cleared
         * @param {boolean} [jumpToEnd] Determines if the current animation should be completed instantly or discarded
         * @returns grease.Shape
         */
        stop: function (clearQueue, jumpToEnd) {
            if (clearQueue) {
                // Remove all but first update in queue
                this.updateQueue.splice(1, this.updateQueue.length - 1);
            }

            if (jumpToEnd) {
                // Comeplete the first update immediately
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
     * @returns function
     * @example var Star = grease.Shape.extend({
     *              constructor: function (opts) {...},
     *              render: function (context, transform) {...}
     *          });
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





    /**
     * Represents a rectangle to be drawn
     * @constructor
     * @param opts Rectangle options
     * @param {number} opts.x Horizontal position
     * @param {number} opts.y Vertical position
     * @param {number} opts.width Width
     * @param {number} opts.height Height
     * @param {grease.Material} [opts.material]
     */
    grease.Rectangle = grease.Shape.extend({

        /**
         * @constructor
         * @memberof grease.Rectangle
         */
        constructor: function (opts) {
            this.width = opts.width || 0;
            this.height = opts.height || 0;
        },

        /**
         * Draw the rectangle to the scene
         * @memberof grease.Rectangle
         * @param context
         * @param transform
         * @returns {grease.Rectangle}
         */
        draw: function (context, transform) {
            transform = this.getAbsoluteTransform(transform);

            context.beginPath();
            context.rect(transform.position.x, transform.position.y, this.width * transform.scale, this.height * transform.scale);
            context.closePath();
            this.applyMaterial(context, transform);
            return this;
        },

        /**
         * Check if coords land inside the rectangle
         * @memberof grease.Rectangle
         * @param coords
         * @param transform
         * @returns {boolean}
         */
        testBounds: function (coords, transform) {
            transform = this.getAbsoluteTransform(transform);
            var horizontal = coords.x >= transform.position.x && coords.x <= transform.position.x + this.width * transform.scale,
                vertical = coords.y >= transform.position.y && coords.y <= transform.position.y + this.height * transform.scale;

            return horizontal && vertical;
        }

    });


    /**
     * Represents an arc to be drawn
     * @constructor
     * @param opts Arc options
     * @param {number} opts.x Horizontal position
     * @param {number} opts.y Vertical position
     * @param {number} opts.radius Radius of the arc
     * @param {number} opts.startAngle Angle to start the arc path from
     * @param {number} opts.endAngle Angle to end the arc path
     * @param {grease.Material} [opts.material]
     * @param {boolean} [opts.direction] Draw path counter clockwise?
     */
    grease.Arc = grease.Shape.extend({

        /**
         * @constructor
         * @memberof grease.Arc
         */
        constructor: function (opts) {
            this.radius = opts.radius;
            this.startAngle = opts.startAngle;
            this.endAngle = opts.endAngle;
            this.direction = opts.direction || false;
        },

        /**
         * Draw the Arc in a context
         * @memberof grease.Arc
         * @param context
         * @param transform
         * @returns {grease.Arc}
         */
        draw: function (context, transform) {
            transform = this.getAbsoluteTransform(transform);

            context.beginPath();
            context.arc(transform.position.x, transform.position.y, this.radius * transform.scale, this.startAngle, this.endAngle, this.direction);
            context.closePath();
            this.applyMaterial(context, transform);
            return this;
        },

        /**
         * Check if a point is within the Arc
         * @memberof grease.Arc
         * @param coords
         * @param transform
         * @returns {boolean}
         */
        testBounds: function (coords, transform) {
            transform = this.getAbsoluteTransform(transform);
            // Check angle is between start and end
            var angle = math.atan2(coords.y - transform.position.y, coords.x - transform.position.x);
            if (angle < 0) {
                angle = (math.PI - angle) + math.PI;
            }

            // Check distance <= radius
            var distance = this.checkDistance(coords, transform);

            return angle >= this.startAngle && angle <= this.endAngle && distance;
        },

        /**
         * Part of the test bounds check for Arcs. Also used by Circles
         * @memberof grease.Arc
         * @param coords
         * @param transform
         * @returns {boolean}
         */
        checkDistance: function (coords, transform) {
            var distance = math.sqrt(math.pow(coords.x - transform.position.x, 2) + math.pow(coords.y - transform.position.y, 2));
            return distance <= (this.radius + (this.material.lineWidth / 2)) * transform.scale;
        }

    });



    /**
     * Represents a circle to be drawn
     * @constructor
     * @param opts Circle options
     * @param {number} opts.x Horizontal position
     * @param {number} opts.y Vertical position
     * @param {number} opts.radius Radius of the circle
     * @param {grease.Material} [opts.material]
     */
    grease.Circle = grease.Arc.extend({

        /**
         * @constructor
         * @memberof grease.Circle
         */
        constructor: function () {
            this.startAngle = 0;
            this.endAngle = math.PI*2;
        },

        /**
         * Simpler version of the arc test bounds
         * @memberof grease.Circle
         * @param coords
         * @param transform
         * @return {boolean}
         */
        testBounds: function (coords, transform) {
            transform = this.getAbsoluteTransform(transform);
            return this.checkDistance(coords, transform);
        }

    });





    /**
     * Forms a line of points. Can include quadratic or bezier curves
     * @constructor
     * @param opts Line options
     * @param {object[]} opts.points Array of points, each should contain x, y and any controlPoints needed for curves
     * @param {grease.Material} [opts.material]
     * @param {boolean} [opts.fill] Determines whether or not the area the line surrounds should be filled - default is false
     */
    grease.Line = grease.Shape.extend({

        /**
         * @constructor
         * @memberof grease.Line
         */
        constructor: function (opts) {
            this.transform.position.x = opts.points[0].x;
            this.transform.position.y = opts.points[0].y;

            this.isOutline = !opts.fill;
            this.points = opts.points || [];
        },

        /**
         * Add a point or array of points to the line
         * @memberof grease.Line
         */
        add: function (points) {
            if (_.isArray(points)) {
                _.each(points, function (point) {
                    this.points.push(point);
                }, this);
            } else {
                this.points.push(points);
            }
        },

        /**
         * Draw the line to the context
         * @memberof grease.Line
         */
        draw: function (context, transform) {
            context.beginPath();

            _.each(this.points, function (point, index) {
                // The first point should just be moved to
                if (index === 0) {
                    context.moveTo(point.x, point.y);
                } else {
                    // The other points might be curved to depending on the existence of control points
                    if (point.controlPoints) {
                        if (point.controlPoints.length > 1) {
                            context.bezierCurveTo(point.controlPoints[0].x, point.controlPoints[0].y, point.controlPoints[1].x, point.controlPoints[1].y, point.x, point.y);
                        } else {
                            context.quadraticCurveTo(point.controlPoints[0].x, point.controlPoints[0].y, point.x, point.y);
                        }
                    } else {
                        context.lineTo(point.x, point.y);
                    }
                }
            }, this);

            context.closePath();
            this.applyMaterial(context, transform);
            return this;
        }

    });





    /**
     * Loads an image for use in a scene
     * @constructor
     * @param opts Image options
     * @param {string} opts.src Source path to image
     * @param {number} opts.x Horizontal position of image
     * @param {number} opts.y Vertical position of image
     * @param {number} [opts.width] Display width of image
     * @param {number} [opts.height] Display height of image
     */
    grease.Image = grease.Shape.extend({

        /**
         * @constructor
         * @memberof grease.Image
         */
        constructor: function (opts) {
            this.width = opts.width;
            this.height = opts.height;

            this.renderFlag = false;
            this.elem = new root.Image();
            this.elem.src = opts.src;

            this.elem.onload = this.onload.bind(this);
        },

        /**
         * Called when the image element is loaded
         * @memberof grease.Image
         */
        onload: function (e) {
            // If a width and height was not provided, set them to the actual width/height of the image
            this.width = this.width ? this.width : this.elem.width;
            this.height = this.height ? this.height : this.elem.height;

            this.renderFlag = true;
            this.trigger('load', e);
        },

        /**
         * Draw the image to the specified context
         * @memberof grease.Image
         * @param context
         * @param transform
         * @param transform.position Position determined by parent group
         * @param {number} [transform.scale]
         * @returns {grease.Image}
         */
        draw: function (context, transform) {
            transform = this.getAbsoluteTransform(transform);

            context.drawImage(this.elem, transform.position.x, transform.position.y, this.width * transform.scale, this.height * transform.scale);
            return this;
        },

        /**
         * Tests the bounds of the image, either the bounds set, or a rectangle
         * @memberof grease.Image
         * @param coords
         * @param transform
         * @return {boolean}
         */
        testBounds: function (coords, transform) {
            if (this.bounds) {
                return this.bounds.testBounds(coords, transform);
            } else {
                return grease.Rectangle.prototype.testBounds.call(this, coords, transform);
            }
        }

    });



    /**
     * Represents a sprite
     * @constructor
     */
    grease.Sprite = grease.Shape.extend({
        constructor: function () {}
    });



    /**
     * Represents text to be drawn to a scene
     * @constructor
     * @param {string} text
     */
    grease.Text = grease.Shape.extend({

        /**
         * @constructor
         * @memberof grease.Text
         */
        constructor: function (opts) {
            this.text = opts.text;
        },

        /**
         * Apply the material to the text and draw to the canvas
         * @memberof grease.Text
         */
        applyMaterial: function (context, transform) {
            var mat = this.material;
            if (mat.fillStyle) {
                context.fillStyle = mat.fillStyle;
                context.fillText(this.text, this.transform.position.x, this.transform.position.y);
            }
            if (mat.lineWidth) {
                context.lineWidth = mat.lineWidth * transform.scale;
            }
            if (mat.lineCap) {
                context.lineCap = mat.lineCap;
            }
            if (mat.strokeStyle) {
                context.strokeStyle = mat.strokeStyle;
                context.strokeText(this.text, this.transform.position.x, this.transform.position.y);
            }        
        },

        /**
         * Draw the image to the specified context
         * @memberof grease.Text
         * @param context
         * @param transform
         * @returns {grease.Text}
         */
        draw: function (context, transform) {
            this.applyMaterial(context, transform);
            return this;
        }

    });




    /**
     * Represents a material, including information on fill and stroke styles
     * @constructor
     * @param opts Material options
     * @param {string} opts.fillStyle
     * @param {string} opts.strokeStyle
     * @param {number} opts.lineWidth
     * @param {string} opts.lineCap butt|round|square
     * @param {string} opts.font Font style to use for text
     */
    grease.Material = function (opts) {
        this.fillStyle = opts.fillStyle;
        this.strokeStyle = opts.strokeStyle;
        this.lineWidth = opts.lineWidth || 0;
        this.lineCap = opts.lineCap;
        this.font = opts.font;
    };

    /**
     * Default material for shapes
     */
    grease.defaultMaterial = new grease.Material({
        fillStyle: 'rgb(50, 100, 0)',
        strokeStyle: 'rgb(0, 0, 0)',
        lineWidth: 10
    });


    /**
     * Represents a gradient for use in a material
     * @constructor
     */
    grease.Gradient = function (type) {
        if (type === constants.LINEAR_GRADIENT_TYPE) {

        } else if (type === constants.RADIAL_GRADIENT_TYPE) {

        }
    };






    /**
     * Specifies a group of shapes. Shapes within the group will be positioned and scaled relative to the group
     * @constructor
     * @param position Position of shape
     * @param position.x Horizontal position
     * @param position.y Vertical position
     */

    grease.Group = grease.Shape.extend({

        /**
         * @constructor
         * @memberof grease.Group
         */
        constructor: function () {
            this.shapes = [];
        },

        /**
         * Draw the group of shapes
         * @memberof grease.Group
         * @param context
         * @param transform
         * @param [transform.position] Position determined by the parent group
         * @param {number} [transform.scale]
         * @returns grease.Group
         */
        draw: function (context, transform) {
            // The group adds its position to provide its children with an offset
            transform = this.getAbsoluteTransform(transform);

            this.each(function () {
                if (this.renderFlag) {
                    this.render(context, transform);
                }
            });

            return this;
        },

        /**
         * Add a shape, group, or array of shapes to a group
         * @memberof grease.Group
         * @param {(grease.Shape|grease.Shape[])} target
         * @param {number} [zindex]
         * @returns {grease.Group}
         * @throws {TypeError} Only shapes can be added to groups
         */
        add: function (target, zindex) {

            // Expect first argument as array or each argument as individual shape
            var givenShapes = _.isArray(target) ? target : [target];

            _.each(givenShapes, function (shape) {
                if (shape instanceof grease.Shape) {
                    // If a zindex is supplied, add the shape or shapes at the supplied index, 
                    // pushing forward any shapes already at or above that index
                    if (zindex) {
                        this.shapes.splice(zindex++, 0, shape);
                    } else {
                        this.shapes.push(shape);                  
                    }
                } else {
                    throw new TypeError('Attempt to add a non-shape to the ' + typeof this + ' failed.');
                }
            }, this);

            return this;

        },

        /**
         * Remove a specified shape from the group
         * @memberof grease.Group
         * @param {grease.Shape} target
         * @returns {grease.Group}
         */
        remove: function (target) {
            var self = this;
            this.each(function (index, shape) {
                if (target === shape) {
                    self.shapes.splice(index, 1);
                }
            });

            return self;

        },

        /**
         * Iterates over the group and calls the function passed to it, supplying shape and index and arguments
         * @memberof grease.Group
         * @param {function} callback
         * @returns {grease.Group}
         */
        each: function (callback) {

            _.each(this.shapes, function (shape, index) {
                if (shape) {
                    callback.call(shape, index, shape);
                }
            }, this);

            return this;

        },

        /**
         * Creates a representation of the event targets to allow for bubbling in nested group structures
         * @memberof grease.Group
         * @param coords
         * @param transform
         * @returns match
         * @returns {grease.Group} match.group The group that the matching shapes are in
         * @returns {grease.Shape[]} match.shapes The shapes that match the bounds
         */
        testBounds: function (coords, transform) {
            var test,
                match = {
                    group: this,
                    shapes: []
                };

            transform = this.getAbsoluteTransform(transform);

            this.each(function () {
                test = this.testBounds(coords, transform);
                if (this instanceof grease.Group) {
                    if (test.shapes.length) {
                        // If the tested shape is a group, add the representation so we can bubble later
                        match.shapes.push(test);
                    }
                } else {
                    if (test) {
                        // Otherwise just add the shape
                        match.shapes.push(this);
                    }
                    
                }
            });

            return match;
        }

    });





    /**
     * Represents a scene, managing the canvas, animation, rendering etc.
     * @constructor
     * @param {string|number} selectorOrWidth Selector to match an existing canvas element or width of new element
     * @param {number} [height]
     */
    grease.Scene = grease.Group.extend({

        /**
         * @constructor
         * @memberof grease.Scene
         */
        constructor: function (selectorOrWidth, height) {
            // The position of the scene determines the camera position, the scale determines camera zoom

            this.canvas = new grease.Canvas(selectorOrWidth, height);
            this.eventManager = new grease.EventManager(this);

            this.shapes = [];

        },

        /**
         * Start the animation loop
         * @memberof grease.Scene
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
         * @memberof grease.Scene
         * @returns {grease.Scene}
         */
        stop: function () {
            this.trigger('stop', {type: 'stop'});
            this.animating = false;
            return this;
        },

        /**
         * Internal animation loop
         * @memberof grease.Scene
         * @returns {grease.Scene}
         */
        loop: function () {
            var self = this;

            if (self.animating) {
                root.requestAnimationFrame(function () {    
                    self.updateFrameInfo();
                    self.trigger('render', self.frameInfo);
                    self.canvas.clear();

                    self.render(self.canvas.getContext(), self.transform, self.frameInfo);

                    self.loop();
                });
            }

            return this;
        },

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

        destroy: function () {
            this.canvas.destroy();
        }

    });

    

    /**
     * Manages all the events triggered on the scene
     * @constructor
     */
    grease.EventManager = function (scene) {
        this.scene = scene;
        this.captureEvents = true;
        this.init();
    };

    /**
     * List of events being handled by the event manager
     * @memberof grease.EventManager
     * @static
     */
    grease.EventManager.events = {
        MOUSE: [
            'click',
            'mousedown',
            'mouseup',
            'mousemove',
            'dblclick'
        ],
        KEY: [
            'keyup',
            'keydown',
            'keypress'
        ]
    };

    _.extend(grease.EventManager.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.EventManager
         */
        constructor: grease.EventManager,

        /**
         * Initialise the event manager, setting a handler on the canvas for all listed event types
         * @memberof grease.EventManager
         */
        init: function () {
            var self = this;

            // Set up canvas event handlers and delegation
            _.each(grease.EventManager.events.MOUSE, function (event) {
                self.scene.canvas.elem.addEventListener(event, function (e) {
                    e.preventDefault();
                    if (self.captureEvents) {
                        var wrappedEvent = self.wrapEvent(e);
                        self.findMatches(wrappedEvent);
                    }            
                });
            });

            // Set up window event handlers for key events
            _.each(grease.EventManager.events.KEY, function (event) {
                root.addEventListener(event, function (e) {
                    if (self.captureEvents) {
                        self.scene.trigger(event, e);
                    }
                });
            });
        },

        /**
         * Find all shapes matching the coordinates of the event
         * @memberof grease.EventManager
         */
        findMatches: function (e) {
            var matchingShapes = this.scene.testBounds({x: e.x, y: e.y}, this.scene.transform),
                bubblePath = this.getBubblePath(matchingShapes).reverse(),
                shape;

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
         * Wrap the event as a custom object so we can stop custom propagation
         * @memberof grease.EventManager
         */
        wrapEvent: function (e) {
            var offset = this.scene.canvas.offset();
            return {
                originalEvent: e,
                x: e.pageX - offset.left,
                y: e.pageY - offset.top,
                type: e.type,
                propagationStopped: false,
                stopPropagation: function () {this.propagationStopped = true;}
            };
        },

        /**
         * Reformat the matches into an array ordered for bubbling
         * @memberof grease.EventManager
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





    /**
     * Represents a canvas element
     * @contructor
     * @param {string|number} selectorOrWidth
     * @param {number} [height]
     * @throws {Error} Element not found from provided selector
     */
    grease.Canvas = function (selectorOrWidth, height) {

        // If the first argument is a string, expect a selector
        if (_.isString(selectorOrWidth)) {

            this.elem = doc.querySelector(selectorOrWidth);
            if (!(this.elem && this.elem.getContext)) {
                throw new Error('Canvas not found from selector.');
            }

        } else {

            this.elem = doc.createElement('canvas');
            if (_.isNumber(selectorOrWidth) && _.isNumber(height)) {
                this.elem.width = selectorOrWidth;
                this.elem.height = height;
            }
            doc.body.appendChild(this.elem);

        }

    };

    _.extend(grease.Canvas.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.Canvas
         */
        constructor: grease.Canvas,

        getContext: function (type) {

            if (!this._context || type) {
                this._context = this.elem.getContext(type || '2d');
            }
            return this._context;

        },

        clear: function (coords) {
            coords = coords || {
                x: 0,
                y: 0,
                width: this.width(),
                height: this.height()
            };

            this.getContext().clearRect(coords.x, coords.y, coords.width, coords.height);
            return this;

        },

        centerPoint: function () {
            return {
                x: this.width() / 2,
                y: this.height() / 2
            };
        },

        width: function () {
            return this.elem.width;
        },

        height: function () {
            return this.elem.height;
        },

        offset: function () {
            var elem = this.elem;
            var offset = {
                left: elem.offsetLeft,
                top: elem.offsetTop
            };

            do {
                elem = elem.offsetParent;
                offset.left += elem.offsetLeft;
                offset.top += elem.offsetTop;
            } while (elem.offsetParent);

            return offset;
        },

        destroy: function () {
            this.elem.parentElement.removeChild(this.elem);
        }

    });


    return grease;


}));