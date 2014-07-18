/* global define, require, exports */

/**
 * 2D animation framework for HTML canvas
 * @file grease.js
 * @requires underscore.js
 * @author charliehw
 * @version 0.0.1
 * @license MIT
 * @todo Gradients, Clipping, Transformation, Sprites, Dirty flags, Frame buffer
 * @todo Optimise event checking by just working out what the mouse is interacting with each frame, rather than checking on every mouse event (thanks Toby)
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

        /**
         * @namespace grease
         */
        root.grease = factory(root, {}, root._);

    }

}(this, function (root, grease, _) {

    'use strict';

    var doc = root.document,
        math = root.Math,
        date = root.Date;


    grease.version = '0.0.1';


    /**
     * Shim for requestAnimationFrame
     */
    root.requestAnimationFrame = (function () {
        return root.requestAnimationFrame || root.webkitRequestAnimationFrame || root.mozRequestAnimationFrame || function (callback) {
            root.setTimeout(callback, 1000 / 60);
        };
    }());


    /**
     * A custom event object used by the library - gets passed to event handlers
     * @typedef {object} greasyEvent
     */

    /**
     * Information about the current frame
     * @typedef {object} frameInfo
     */

    /**
     * A basic x, y vector
     * @typedef {object} vector
     * @property {number} x Horizontal component
     * @property {number} y Vertical component
     */


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
        // Prevent the base constructor from being called more than once
        if (this.constructed) {
            return this;
        }

        this.renderFlag = true;
        this.material = opts.material || grease.defaultMaterial;

        this.transform = {
            position: grease.utilities.vector(opts.x || 0, opts.y || 0),
            scale: typeof opts.scale === 'undefined' ? 1 : opts.scale,
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

        this.constructed = true;
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
         * @param {string} event
         * @param {function} handler
         * @returns {grease.Shape}
         */
        on: function (event, handler) {
            if (this.handlers[event]) {
                this.handlers[event].push(handler);
            } else {
                this.handlers[event] = [handler];
            }
            return this;
        },

        /**
         * Removes an event handler
         * @memberof grease.Shape#
         * @param {string} [event] - Removes handlers for a specific event
         * @param {function} [handler] - Removes a specific handler for a specific event
         * @returns {grease.Shape}
         */
        off: function (event, handler) {
            if (event) {
                if (this.handlers[event]) {
                    if (handler) {
                        // If handler is included, remove only that handler
                        this.handlers[event] = _.without(this.handlers[event], handler);
                    } else {
                        // Otherwise remove all handlers for the specified event
                        this.handlers[event] = null;
                    }
                }
            } else {
                this.handlers = {};
            }
            
            return this;
        },

        /**
         * Calls all handlers for a specific event
         * @memberof grease.Shape#
         * @param {string} type - Event type being triggered
         * @param {event} e
         * @param [data]
         * @returns {grease.Shape}
         */
        trigger: function (type, e, data) {
            _.each(this.handlers[type], function (handler) {
                handler.call(this, e, data);
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
         * Parent transforms are taken into account to render a shape. This function compunds the parent transform with the shape's transform
         * @memberof grease.Shape#
         * @param transform
         * @returns {object}
         */
        getAbsoluteTransform: function (transform) {
            return {
                position: grease.utilities.vector(this.transform.position.x + (transform.position.x || 0), this.transform.position.y + (transform.position.y || 0)),
                scale: this.transform.scale * (transform.scale || 1),
                rotation: this.transform.scale + (transform.rotation || 0)
            };
        },

        /**
         * Move the shape relatively. Animate if duration supplied
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
                    position: grease.utilities.addVectors(this.position(), position)
                }, duration, easing);
            } else if (_.isNumber(position.x) || _.isNumber(position.y)) {
                position.x = position.x || 0;
                position.y = position.y || 0;
                this.position(grease.utilities.addVectors(this.transform.position, position));
            } else {
                throw new TypeError('Invalid position provided for move operation.');
            }
            return this;
        },

        /**
         * Get or set the relative position of the shape
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
                newPosition = grease.utilities.vector(),
                easing = update.easing,
                elapsed;

            // If the animation has just started, store the initial transform
            if (update.elapsed === 0) {
                update.initial = {
                    position: grease.utilities.vector(this.transform.position.x, this.transform.position.y)
                };
            }

            if (update.elapsed + frameInfo.elapsed > update.duration) {
                // If the frame overlaps the end of the animation, just do the last bit of the animation
                elapsed = update.duration;
            } else {
                // Otherwise do the whole segment of the animation based on time elapsed from last frame 
                elapsed = update.elapsed;
            }

            if (!easing || typeof easing !== 'function') {
                easing = grease.easing[update.easing] || grease.easing['linear'];
            }


            newPosition.x = easing(elapsed, update.initial.position.x, update.transform.position.x || 0, update.duration || 1);
            newPosition.y = easing(elapsed, update.initial.position.y, update.transform.position.y || 0, update.duration || 1);

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
     * @example var Star = grease.Shape.extend({
     *              constructor: function (opts) {...},
     *              draw: function (context, transform) {...}
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
     * @augments grease.Shape
     * @param opts Rectangle options
     * @see grease.Shape options
     * @param {number} [opts.width=0] Width
     * @param {number} [opts.height=0] Height
     */
    grease.Rectangle = grease.Shape.extend({

        /**
         * Actual constructor implementation
         * @memberof grease.Rectangle#
         */
        constructor: function (opts) {
            this.width = opts.width || 0;
            this.height = opts.height || 0;
        },

        /**
         * Draw the rectangle to the scene
         * @memberof grease.Rectangle#
         * @param context
         * @param transform
         * @returns {grease.Rectangle}
         */
        draw: function (context, transform) {
            context.beginPath();
            context.rect(transform.position.x, transform.position.y, this.width * transform.scale, this.height * transform.scale);
            context.closePath();
            this.applyMaterial(context, transform);
            return this;
        },

        /**
         * Check if coords land inside the rectangle
         * @memberof grease.Rectangle#
         * @param coords
         * @param transform
         * @returns {boolean}
         */
        checkCollision: function (coords, transform) {
            var horizontal = coords.x >= transform.position.x && coords.x <= transform.position.x + this.width * transform.scale,
                vertical = coords.y >= transform.position.y && coords.y <= transform.position.y + this.height * transform.scale;

            return horizontal && vertical;
        }

    });


    /**
     * Represents an arc to be drawn
     * @constructor
     * @augments grease.Shape
     * @param opts Arc options
     * @see grease.Shape options
     * @param {number} opts.radius Radius of the arc
     * @param {number} opts.startAngle Angle to start the arc path from
     * @param {number} opts.endAngle Angle to end the arc path
     * @param {boolean} [opts.direction=false] Draw path counter clockwise?
     */
    grease.Arc = grease.Shape.extend({

        /**
         * Actual constructor implementation
         * @memberof grease.Arc#
         */
        constructor: function (opts) {
            this.radius = opts.radius;
            this.startAngle = opts.startAngle;
            this.endAngle = opts.endAngle;
            this.direction = opts.direction || false;
        },

        /**
         * Draw the Arc in a context
         * @memberof grease.Arc#
         * @param context
         * @param transform
         * @returns {grease.Arc}
         */
        draw: function (context, transform) {
            context.beginPath();
            context.arc(transform.position.x, transform.position.y, this.radius * transform.scale, this.startAngle, this.endAngle, this.direction);
            context.closePath();
            this.applyMaterial(context, transform);
            return this;
        },

        /**
         * Check if a point is within the Arc
         * @memberof grease.Arc#
         * @param coords
         * @param transform
         * @returns {boolean}
         */
        checkCollision: function (coords, transform) {
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
         * @memberof grease.Arc#
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
     * Represents a circle to be drawn - start angle and end angle are automatically set
     * @constructor
     * @augments grease.Arc
     * @param opts Circle options
     * @see grease.Arc options
     */
    grease.Circle = grease.Arc.extend({

        /**
         * Actual constructor implementation
         * @memberof grease.Circle#
         */
        constructor: function () {
            this.startAngle = 0;
            this.endAngle = math.PI*2;
        },

        /**
         * Simpler version of the arc test bounds
         * @memberof grease.Circle#
         * @param coords
         * @param transform
         * @return {boolean}
         */
        checkCollision: function (coords, transform) {
            return this.checkDistance(coords, transform);
        }

    });





    /**
     * Forms a line of points. Can include quadratic or bezier curves
     * @constructor
     * @augments grease.Shape
     * @param opts Line options
     * @see grease.Shape options
     * @param {object[]} opts.points Array of points, each should contain x, y and any controlPoints needed for curves
     * @param {boolean} [opts.fill=false] Determines whether or not the area the line surrounds should be filled
     */
    grease.Line = grease.Shape.extend({

        /**
         * Actual constructor implementation
         * @memberof grease.Line#
         */
        constructor: function (opts) {
            this.isOutline = !opts.fill;
            this.points = opts.points || [];
        },

        /**
         * Add a point or array of points to the line
         * @memberof grease.Line#
         * @param points
         * @returns {grease.Line}
         */
        add: function (points) {
            if (_.isArray(points)) {
                _.each(points, function (point) {
                    this.points.push(point);
                }, this);
            } else {
                this.points.push(points);
            }

            return this;
        },

        /**
         * Draw the line to the context
         * @memberof grease.Line#
         * @param context
         * @param transform
         * @returns {grease.Line}
         */
        draw: function (context, transform) {
            context.beginPath();

            _.each(this.points, function (point, index) {
                var p = transform.position;

                // The first point should just be moved to
                if (index === 0) {
                    context.moveTo(point.x + p.x, point.y + p.y);
                } else {
                    // The other points might be curved to depending on the existence of control points
                    if (point.controlPoints) {
                        if (point.controlPoints.length > 1) {
                            context.bezierCurveTo(point.controlPoints[0].x + p.x, point.controlPoints[0].y + p.y, point.controlPoints[1].x + p.x, point.controlPoints[1].y + p.y, point.x + p.x, point.y + p.y);
                        } else {
                            context.quadraticCurveTo(point.controlPoints[0].x + p.x, point.controlPoints[0].y + p.y, point.x + p.x, point.y + p.y);
                        }
                    } else {
                        context.lineTo(point.x + p.x, point.y + p.y);
                    }
                }
            });

            this.applyMaterial(context, transform);
            return this;
        }

    });





    /**
     * Loads an image for use in a scene
     * @constructor
     * @augments grease.Rectangle
     * @param opts Image options
     * @see grease.Rectangle options
     * @param {string} opts.src Source path to image
     * @param {number} [opts.width] Display width of image - default is dynamic based on image
     * @param {number} [opts.height] Display height of image - default is dynamic based on image
     */
    grease.Image = grease.Rectangle.extend({

        /**
         * Actual constructor implementation
         * @memberof grease.Image#
         */
        constructor: function (opts) {
            this.renderFlag = false;
            this.elem = new root.Image();
            this.elem.src = opts.src;

            this.elem.onload = this.onload.bind(this);
        },

        /**
         * Called when the image element is loaded
         * @memberof grease.Image#
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
         * @memberof grease.Image#
         * @param context
         * @param transform
         * @param [clip]
         * @returns {grease.Image}
         */
        draw: function (context, transform, clip) {
            if (clip) {
                context.drawImage(this.elem, clip.x, clip.y, clip.width, clip.height, transform.position.x, transform.position.y, this.width * transform.scale, this.height * transform.scale);
            } else {
                context.drawImage(this.elem, transform.position.x, transform.position.y, this.width * transform.scale, this.height * transform.scale);                
            }
            return this;
        }

    });



    /**
     * Represents a sprite
     * @constructor
     * @augments grease.Shape
     * @param opts Sprite options
     * @see grease.Shape options
     * @param {number} opts.src Source of the image
     * @param {number} [opts.cols] Number of columns in uniform sprite image
     * @param {number} [opts.rows] Number of rows in uniform sprite image
     * @param {number} [opts.cells] Total number of cells in sprite if rows*cols is not appropriate
     * @param {number} [opts.frames] Manually defined frames if the sprite is not uniform 
     * @param {number} [opts.sequences] Definition of sequences for animating the sprite
     */
    grease.Sprite = grease.Shape.extend({

        /**
         * Actual constructor implementation
         * @memberof grease.Sprite#
         */
        constructor: function (opts) {
            var self = this;

            this.rows = opts.rows;
            this.cols = opts.cols;
            this.cells = opts.cells || this.rows * this.cols;

            this.image = new grease.Image({
                src: opts.src
            }).on('load', function () {
                this.width = self.cellWidth = this.width / self.cols;
                this.height = self.cellHeight = this.height / self.rows;
            });

            // The sprite uses its image to check for events
            this.bounds = this.image;

            this.activeCell = 0;
        },

        /**
         * Draw the sprite to the screen
         * @memberof grease.Sprite#
         * @param context
         * @param transform
         * @returns {grease.Sprite}
         */
        draw: function (context, transform) {
            var positionInRow = this.activeCell % this.cols,
                positionInCol = (this.activeCell - positionInRow) / this.cols,
                clip = {
                    x: positionInRow * this.cellWidth,
                    y: positionInCol * this.cellHeight,
                    width: this.cellWidth,
                    height: this.cellHeight
                };

            if (this.image.renderFlag) {
                this.image.draw(context, transform, clip);
            }

            return this;
        },

        /**
         * Step the sprite forward to the next cell in the sequence
         * @memberof grease.Sprite#
         * @param {number} [step] Amount to step through the current sequence, default +1
         * @returns {grease.Sprite}
         */
        step: function (step) {
            if (_.isUndefined(step)) {
                step = 1;
            }

            if (this.activeCell + step < 0) {
                this.activeCell = this.cells + 1 + step;
            } else if (this.activeCell + step > this.cells) {
                this.activeCell = (this.activeCell + step) - this.cells;
            } else {
                this.activeCell += step;
            }

            return this;
        },

    });



    /**
     * Represents text to be drawn to a scene
     * @constructor
     * @augments grease.Shape
     * @param opts Text options
     * @see grease.Shape options
     * @param {string} opts.text Text to be printed
     */
    grease.Text = grease.Shape.extend({

        /**
         * Actual constructor implementation
         * @memberof grease.Text#
         */
        constructor: function (opts) {
            this.text = opts.text;
        },

        /**
         * Apply the material to the text and draw to the canvas
         * @memberof grease.Text#
         */
        applyMaterial: function (context, transform) {
            var mat = this.material;
            context.font = this.material.fontSize + 'pt ' + this.material.fontFamily;

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
            context.closePath();
        },

        /**
         * Draw the image to the specified context
         * @memberof grease.Text#
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
     * @param {number} [opts.lineWidth=0]
     * @param {string} opts.lineCap butt|round|square
     * @param {string} opts.fontFamily Font family to use for text, eg. 'Arial'
     * @param {number} opts.fontSize Size of font as a number
     */
    grease.Material = function (opts) {
        this.fillStyle = opts.fillStyle;
        this.strokeStyle = opts.strokeStyle;
        this.lineWidth = opts.lineWidth || 0;
        this.lineCap = opts.lineCap;
        this.fontFamily = opts.fontFamily;
        this.fontSize = opts.fontSize;
    };

    /**
     * Default material for shapes
     */
    grease.defaultMaterial = new grease.Material({
        fillStyle: 'rgb(50, 100, 0)',
        strokeStyle: 0,
        lineWidth: 0,
        fontFamily: 'Arial',
        fontSize: 20
    });


    /**
     * Represents a gradient for use in a material
     * @constructor
     * @param opts - Gradient options
     * @param opts.type - grease.Gradient.RADIAL_GRADIENT|grease.Gradient.LINEAR_GRADIENT
     * @throws {TypeError} Gradient constructor must be provided a valid type
     */
    grease.Gradient = function (opts) {
        if (opts.type === grease.Gradient.LINEAR_GRADIENT) {

        } else if (opts.type === grease.Gradient.RADIAL_GRADIENT) {

        } else {
            throw new TypeError('No valid type provided for gradient creation.');
        }
    };


    grease.Gradient.RADIAL_GRADIENT = 'radial';
    grease.Gradient.LINEAR_GRADIENT = 'linear';






    /**
     * Specifies a group of shapes. Shapes within the group will be positioned and scaled relative to the group
     * @constructor
     * @augments grease.Shape
     * @param opts
     * @see grease.Shape options
     */
    grease.Group = grease.Shape.extend({

        /**
         * Actual constructor implementation
         * @memberof grease.Group#
         */
        constructor: function () {
            this.shapes = [];
            this.length = 0;
        },

        /**
         * Draw the group of shapes
         * @memberof grease.Group#
         * @param context
         * @param transform
         * @param [transform.position] Position determined by the parent group
         * @param {number} [transform.scale]
         * @param {frameInfo} frameInfo
         * @returns {grease.Group}
         */
        draw: function (context, transform, frameInfo) {
            this.each(function () {
                if (this.renderFlag) {
                    this.render(context, transform, frameInfo);
                }
            });

            return this;
        },

        /**
         * Add a shape, group, or array of shapes to a group
         * @memberof grease.Group#
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

            this.length = this.shapes.length;

            return this;
        },

        /**
         * Remove a specified shape from the group
         * @memberof grease.Group#
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

            this.length = this.shapes.length;

            return self;
        },

        /**
         * Empties the group
         * @memberof grease.Group#
         * @returns {grease.Group}
         */
        empty: function () {
            this.shapes = [];
            this.length = 0;
            return this;
        },

        /**
         * Iterates over the group and calls the function passed to it, supplying shape and index and arguments
         * @memberof grease.Group#
         * @param {function} callback
         * @returns {grease.Group}
         */
        each: function (callback) {
            _.each(this.shapes, function (shape, index) {
                if (shape) {
                    callback.call(shape, index, shape);
                }
            });

            return this;
        },

        /**
         * Creates a representation of the event targets to allow for bubbling in nested group structures
         * @memberof grease.Group#
         * @param coords
         * @param transform
         * @returns match
         * @returns {grease.Group} match.group The group that the matching shapes are in
         * @returns {grease.Shape[]} match.shapes The shapes that match the bounds
         */
        checkCollision: function (coords, transform) {
            var test,
                match = {
                    group: this,
                    shapes: []
                };

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
     * @augments grease.Group
     * @param {string|number} selectorOrWidth Selector to match an existing canvas element or width of new element
     * @param {number} [height]
     */
    grease.Scene = grease.Group.extend({

        /**
         * Actual constructor implementation
         * @memberof grease.Scene#
         */
        constructor: function (selectorOrWidth, height) {
            // The position of the scene determines the camera position, the scale determines camera zoom

            this.canvas = new grease.Canvas(selectorOrWidth, height);
            this.eventManager = new grease.EventManager(this);

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
                    self.canvas.clear();

                    self.render(self.canvas.getContext(), self.transform, self.frameInfo);

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
            this.canvas.destroy();
            return this;
        }

    });

    

    /**
     * Manages all the events triggered on the scene
     * @constructor
     * @param {grease.Scene} scene
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
     * @enum
     */
    grease.EventManager.events = {

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
        ]
        
    };

    _.extend(grease.EventManager.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.EventManager#
         */
        constructor: grease.EventManager,

        /**
         * Initialise the event manager, setting a handler on the canvas for all listed event types
         * @memberof grease.EventManager#
         */
        init: function () {
            var self = this;

            // Set up canvas event handlers and delegation
            _.each(grease.EventManager.events.MOUSE.concat(grease.EventManager.events.TOUCH), function (event) {
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
         * Find all shapes matching the coordinates of the event and trigger that event on matches
         * @memberof grease.EventManager#
         * @param {greasyEvent} e
         */
        findMatches: function (e) {
            var matchingShapes = this.scene.testBounds(e, this.scene.transform),
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
         * @memberof grease.EventManager#
         * @param {event} e
         * @returns {greasyEvent}
         */
        wrapEvent: function (e) {
            var touch = e;
            if (e.changedTouches) {
                touch = e.changedTouches[0];
            }

            return {
                originalEvent: e,
                x: touch.clientX,
                y: touch.clientY,
                type: e.type,
                propagationStopped: false,
                stopPropagation: function () {this.propagationStopped = true;}
            };
        },

        /**
         * Reformat the matches into an array ordered for bubbling
         * @memberof grease.EventManager#
         * @param shape
         * @param [path]
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
         * @memberof grease.Canvas#
         */
        constructor: grease.Canvas,

        /**
         * Get the drawing context, either from cache or from the HTML element
         * @memberof grease.Canvas#
         * @param type
         * @returns {CanvasContext}
         */
        getContext: function (type) {
            if (!this._context || type) {
                this._context = this.elem.getContext(type || '2d');
            }
            return this._context;
        },

        /**
         * Clear the canvas
         * @memberof grease.Canvas#
         * @param [coords]
         * @returns {grease.Canvas}
         */
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

        /**
         * Returns the coordinates of the center point in the canvas
         * @memberof grease.Canvas#
         * @returns {object}
         */
        centerPoint: function () {
            return {
                x: math.floor(this.width() / 2),
                y: math.floor(this.height() / 2)
            };
        },

        /**
         * Get the width of the canvas
         * @memberof grease.Canvas#
         * @returns {number}
         */
        width: function () {
            return this.elem.width;
        },

        /**
         * Get the height of the canvas
         * @memberof grease.Canvas#
         * @returns {number}
         */
        height: function () {
            return this.elem.height;
        },

        /**
         * Get the offset of the canvas within the document
         * @memberof grease.Canvas#
         * @returns {object}
         */
        offset: function () {
            var offset, elem;

            if (this.cachedOffset) {
                // Use the cached offset if it is available
                // We are assuming the canvas itself will not move so we don't have to calculate this all the time
                offset = this.cachedOffset;
            } else {
                // Calculate the offset by summing up all offset throughout the document hierarchy
                elem = this.elem;
                offset = {
                    left: elem.offsetLeft,
                    top: elem.offsetTop
                };

                do {
                    elem = elem.offsetParent;
                    offset.left += elem.offsetLeft;
                    offset.top += elem.offsetTop;
                } while (elem.offsetParent);

                // Then cache it
                this.cachedOffset = offset;
            }

            return offset;
        },

        /**
         * Remove the canvas from the document
         * @memberof grease.Canvas#
         * @returns {grease.Canvas}
         */
        destroy: function () {
            this.elem.parentElement.removeChild(this.elem);
            return this;
        },

        /**
         * Hide the canvas
         * @memberof grease.Canvas#
         * @returns {grease.Canvas}
         */
        hide: function () {
            this.elem.style.display = 'none';
            return this;
        },

        /**
         * Show the canvas
         * @memberof grease.Canvas#
         * @returns {grease.Canvas}
         */
        show: function () {
            this.elem.style.display = 'block';
            return this;
        }

    });


    /**
     * Collection of utility functions
     * @namespace grease.utilities
     */
    grease.utilities = {

        /**
         * Produce a basic vector object
         * @param {number} [x=0] Horizontal position
         * @param {number} [y=0] Vertical position
         * @returns {object}
         */
        vector: function (x, y) {
            return {
                x: x || 0,
                y: y || 0
            };
        },

        /**
         * Add two vectors together to create a new vector
         * @param {vector} a
         * @param {vector} b
         * @returns {vector}
         */
        addVectors: function (a, b) {
            return grease.utilities.vector(a.x + b.x, a.y + b.y);
        }

    };

    /**
     * Collection of easing functions
     * t: current time, b: beginning value, c: change in value, d: duration
     * @namespace grease.easing
     */
    grease.easing = {

        /**
         * Linear ease
         */
        linear: function (t, b, c, d) {
            return c*t/d + b;
        },

        /**
         * easeInQuad
         */
        easeInQuad: function (t, b, c, d) {
            t /= d;
            return c*t*t + b;
        },

        /**
         * easeOutQuad
         */
        easeOutQuad: function (t, b, c, d) {
            t /= d;
            return -c * t*(t-2) + b;
        },

        /**
         * easeInOutQuad
         */
        easeInOutQuad: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) {
                return c/2*t*t + b;
            }   
            t--;
            return -c/2 * (t*(t-2) - 1) + b;
        },

        /**
         * easeInCubic
         */
        easeInCubic: function (t, b, c, d) {
            t /= d;
            return c*t*t*t + b;
        },

        /**
         * easeOutCubic
         */
        easeOutCubic: function (t, b, c, d) {
            t /= d;
            t--;
            return c*(t*t*t + 1) + b;
        },

        /**
         * easeInOutCubic
         */
        easeInOutCubic: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) {
                return c/2*t*t*t + b;
            }
            t -= 2;
            return c/2*(t*t*t + 2) + b;
        },

        /**
         * easeInQuart
         */
        easeInQuart: function (t, b, c, d) {
            t /= d;
            return c*t*t*t*t + b;
        },

        /**
         * easeOutQuart
         */
        easeOutQuart: function (t, b, c, d) {
            t /= d;
            t--;
            return -c * (t*t*t*t - 1) + b;
        },

        /**
         * easeInOutQuart
         */
        easeInOutQuart: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) {
                return c/2*t*t*t*t + b;
            }
            t -= 2;
            return -c/2 * (t*t*t*t - 2) + b;
        },

        /**
         * easeInQuint
         */
        easeInQuint: function (t, b, c, d) {
            t /= d;
            return c*t*t*t*t*t + b;
        },

        /**
         * easeOutQuint
         */
        easeOutQuint: function (t, b, c, d) {
            t /= d;
            t--;
            return c*(t*t*t*t*t + 1) + b;
        },

        /**
         * easeInOutQuint
         */
        easeInOutQuint: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) {
                return c/2*t*t*t*t*t + b;
            }
            t -= 2;
            return c/2*(t*t*t*t*t + 2) + b;
        },

        /**
         * easeInSine
         */
        easeInSine: function (t, b, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        },

        /**
         * easeOutSine
         */
        easeOutSine: function (t, b, c, d) {
            return c * Math.sin(t/d * (Math.PI/2)) + b;
        },

        /**
         * easeInOutSine
         */
        easeInOutSine: function (t, b, c, d) {
            return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
        },

        /**
         * easeInExpo
         */
        easeInExpo: function (t, b, c, d) {
            return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
        },

        /**
         * easeOutExpo
         */
        easeOutExpo: function (t, b, c, d) {
            return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
        },

        /**
         * easeInOutExpo
         */
        easeInOutExpo: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) {
                return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
            }
            t--;
            return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
        },

        /**
         * easeInCirc
         */
        easeInCirc: function (t, b, c, d) {
            t /= d;
            return -c * (Math.sqrt(1 - t*t) - 1) + b;
        },

        /**
         * easeOutCirc
         */
        easeOutCirc: function (t, b, c, d) {
            t /= d;
            t--;
            return c * Math.sqrt(1 - t*t) + b;
        },

        /**
         * easeInOutCirc
         */
        easeInOutCirc: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) {
                return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
            }
            t -= 2;
            return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
        }

    };


    return grease;


}));