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


    root.requestAnimationFrame = (function(){
        return root.requestAnimationFrame || root.webkitRequestAnimationFrame || root.mozRequestAnimationFrame || function( callback ){
            root.setTimeout(callback, 1000 / 60);
        };
    }());


    /**
     * Basic subclass drawable shape
     * @constructor
     * @param {number} x Horizontal position
     * @param {number} y Vertical position
     * @param {grease.Material} [material]
     */
    grease.Shape = function (x, y, material) {
        this.renderable = true;
        this.position = {x: x || 0, y: y || 0};
        this.material = material || grease.defaultMaterial;
        this.scale = 1;

        this.events = {};
        // States used by the event manager
        this.states = [];
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
         * @returns {grease.Shape}
         */
        applyMaterial: function (context, scale) {
            var mat = this.material;
            if (mat.fillStyle && !this.isOutline) {
                context.fillStyle = mat.fillStyle;
                context.fill();
            }
            if (mat.lineWidth) {
                context.lineWidth = mat.lineWidth * scale;
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
                handler.call(this, e, data)
            }, this);
            return this;
        },

        /**
         * Unless the shape has bounds set against it, this should be implemented by a specific shape
         * @memberof grease.Shape
         * @param coords
         * @returns {boolean}
         */
        testBounds: function (coords, scale) {
            return this.bounds ? this.bounds.testBounds(coords, scale) : false;
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
                // Uh, maths
            } else if (_.isNumber(position.x) && _.isNumber(position.y)) {
                this.position = position;
            } else {
                throw new TypeError('Invalid position provided for moveTo operation.');
            }
            return this;
        },

        /**
         * Transform the shape
         * @memberof grease.Shape
         * @returns grease.Shape
         */
        transform: function () {
            return this;
        }

    });

    /**
     * Extend the base Shape to create a new shape contructor
     * @memberof grease.Shape
     * @static
     * @param methods
     * @returns function
     * @example var Star = grease.Shape.extend()
     */
    grease.Shape.extend = function (prototypeMethods, staticMethods) {
        var Contructor = function () {
            grease.Shape.call(this);
            prototypeMethods.constructor.apply(this, Array.prototype.slice.call(arguments));
        }

        _.extend(Contructor, staticMethods);

        return Contructor;
    };





    /**
     * Represents a rectangle to be drawn
     * @constructor
     * @param {number} x Horizontal position
     * @param {number} y Vertical position
     * @param {number} width Width
     * @param {number} height Height
     * @param {grease.Material} [material]
     */
    grease.Rectangle = function (x, y, width, height, material) {
        // Call parent constructor
        grease.Shape.call(this, x, y, material);
        this.width = width || 0;
        this.height = height || 0;
    };

    // Rectangle extends Shape
    grease.Rectangle.prototype = Object.create(grease.Shape.prototype);

    _.extend(grease.Rectangle.prototype, {

        /**
         * Reference to the constructor
         * @memberof grease.Rectangle
         */
        constructor: grease.Rectangle,

        /**
         * Renders the rectangle to the scene
         * @memberof grease.Rectangle
         * @param context
         * @param offset Offset determined by parent group
         * @param {number} scale
         * @returns {grease.Rectangle}
         */
        render: function (context, offset, scale) {
            scale = scale * this.scale;
            context.beginPath();
            context.rect(this.position.x + offset.x, this.position.y + offset.y, this.width * scale, this.height * scale);
            context.closePath();
            this.applyMaterial(context, scale);
            return this;
        },

        /**
         * Check if coords land inside the rectangle
         * @memberof grease.Rectangle
         * @param coords
         * @returns {boolean}
         */
        testBounds: function (coords, scale) {
            var horizontal = coords.x >= this.position.x && coords.x <= this.position.x + this.width,
                vertical = coords.y >= this.position.y && coords.y <= this.position.y + this.height;

            return horizontal && vertical;
        }

    });


    /**
     * Represents an arc to be drawn
     * @constructor
     * @param x Horizontal position
     * @param y Vertical position
     * @param {number} radius Radius of the arc
     * @param {number} startAngle Angle to start the arc path from
     * @param {number} endAngle Angle to end the arc path
     * @param {grease.Material} [material]
     * @param {boolean} [direction] Draw path counter clockwise?
     */
    grease.Arc = function (x, y, radius, startAngle, endAngle, material, direction) {
        // Call parent constructor
        grease.Shape.call(this, x, y, material);
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.direction = direction || false;
    };

    // Arc extends Shape
    grease.Arc.prototype = Object.create(grease.Shape.prototype);

    _.extend(grease.Arc.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.Arc
         */
        constructor: grease.Arc,

        /**
         * Render the Arc in a context
         * @memberof grease.Arc
         * @param context
         * @param offset Offset position determined by parent group
         * @param {number} [scale]
         * @returns {grease.Arc}
         */
        render: function (context, offset, scale) {
            scale = scale * this.scale;
            context.beginPath();
            context.arc(this.position.x + offset.x, this.position.y + offset.y, this.radius * scale, this.startAngle, this.endAngle, this.direction)
            context.closePath();
            this.applyMaterial(context, scale);
            return this;
        },

        /**
         * Check if a point is within the Arc
         * @memberof grease.Arc
         * @param coords
         * @param {number} scale
         * @returns {boolean}
         */
        testBounds: function (coords, scale) {
            // Check angle is between start and end
            var angle = math.atan2(coords.y - this.position.y, coords.x - this.position.x);
            if (angle < 0) {
                angle = (math.PI - angle) + math.PI;
            }

            // Check distance <= radius
            var distance = math.sqrt(math.pow(coords.x - this.position.x, 2) + math.pow(coords.y - this.position.y, 2));
            scale = this.scale * (scale || 1);

            return angle >= this.startAngle && angle <= this.endAngle && distance <= (this.radius + (this.material.lineWidth / 2)) * scale;
        }

    });



    /**
     * Represents a circle to be drawn
     * @constructor
     * @param x Horizontal position
     * @param y Vertical position
     * @param {number} radius Radius of the circle
     * @param {grease.Material} [material]
     */
    grease.Circle = function (x, y, radius, material) {
        // Call parent constructor
        grease.Arc.call(this, x, y, radius, 0, math.PI*2, material);
    };

    // Circle extends Arc
    grease.Circle.prototype = Object.create(grease.Arc.prototype);

    _.extend(grease.Circle.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.Circle
         */
        constructor: grease.Circle,

        /**
         * Simpler version of the arc test bounds
         * @memberof grease.Circle
         * @param coords
         * @param {number} scale
         * @return {boolean}
         */
        testBounds: function (coords, scale) {
            var distance = math.sqrt(math.pow(coords.x - this.position.x, 2) + math.pow(coords.y - this.position.y, 2));
            scale = this.scale * (scale || 1);
            return distance <= (this.radius + (this.material.lineWidth / 2)) * scale;
        }

    });





    /**
     * Forms a line of points. Can include quadratic or bezier curves
     * @constructor
     * @param {object[]} points Array of points, each should contain x, y and any controlPoints needed for curves
     */
    grease.Line = function (points, material, fill) {
        // Call parent constructor
        grease.Shape.call(this, points[0].x, points[0].y, material);

        // Determines whether or not the area the line surrounds should be filled - default is false
        this.isOutline = !fill;
        this.points = points || [];
    };

    // Line extends Shape
    grease.Line.prototype = Object.create(grease.Shape.prototype);

    _.extend(grease.Line.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.Line
         */
        constructor: grease.Line,

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
         * Render the line to the context
         * @memberof grease.Line
         */
        render: function (context, offset, scale) {
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
                            content.quadraticCurveTo(point.controlPoints[0].x, point.controlPoints[0].y, point.x, point.y);
                        }
                    } else {
                        context.lineTo(point.x, point.y);
                    }
                }
            }, this);

            context.closePath();
            this.applyMaterial(context, scale);
            return this;
        }

    });





    /**
     * Loads an image for use in a scene
     * @constructor
     * @param {string} src Source path to image
     * @param {number} x Horizontal position of image
     * @param {number} y Vertical position of image
     * @param {number} [width] Display width of image
     * @param {number} [height] Display height of image
     */
    grease.Image = function (src, x, y, width, height) {
        // Call parent constructor
        grease.Shape.call(this, x, y);

        this.width = width;
        this.height = height;

        this.renderable = false;
        this.elem = new root.Image();
        this.elem.src = src;

        this.elem.onload = this.onload.bind(this);
    };

    // Image extends Shape - should it extend rectangle instead?
    grease.Image.prototype = Object.create(grease.Shape.prototype);

    _.extend(grease.Image.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.Image
         */
        constructor: grease.Image,

        /**
         * Called when the image element is loaded
         * @memberof grease.Image
         */
        onload: function (e) {
            // If a width and height was not provided, set them to the actual width/height of the image
            this.width = this.width ? this.width : this.elem.width;
            this.height = this.height ? this.height : this.elem.height;

            this.renderable = true;
            this.trigger('load', e);
        },

        /**
         * Renders the image to the specified context
         * @memberof grease.Image
         * @param context
         * @param offset Offset position determined by parent group
         * @param {number} [scale]
         * @returns {grease.Image}
         */
        render: function (context, offset, scale) {
            scale = scale * this.scale;
            context.drawImage(this.elem, this.position.x + offset.x, this.position.y + offset.y, this.width * scale, this.height * scale);
            return this;
        },

        /**
         * Tests the bounds of the image, either the bounds set, or a rectangle
         * @memberof grease.Image
         * @param coords
         * @param {number} scale
         * @return {boolean}
         */
        testBounds: function (coords, scale) {
            if (this.bounds) {
                return this.bounds.testBounds(coords, scale);
            } else {
                return grease.Rectangle.prototype.testBounds.call(this, coords, scale);
            }
        }

    });



    /**
     * Represents a sprite
     * @constructor
     */
    grease.Sprite = function () {
        // Call parent constructor
        grease.Shape.call(this, x, y);
    };



    /**
     * Represents text to be drawn to a scene
     * @constructor
     * @param {string} text
     */
    grease.Text = function (text, x, y, material) {
        // Call parent constructor
        grease.Shape.call(this, x, y);

        this.text = text;
    };

    // Text extends Shape
    grease.Text.prototype = Object.create(grease.Shape.prototype);

    _.extend(grease.Text.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.Text
         */
        constructor: grease.Text,

        /**
         * Apply the material to the text and draw to the canvas
         * @memberof grease.Text
         */
        applyMaterial: function (context, scale) {
            var mat = this.material;
            if (mat.fillStyle) {
                context.fillStyle = mat.fillStyle;
                context.fillText(this.text, this.position.x, this.position.y);
            }
            if (mat.lineWidth) {
                context.lineWidth = mat.lineWidth * scale;
            }
            if (mat.lineCap) {
                context.lineCap = mat.lineCap;
            }
            if (mat.strokeStyle) {
                context.strokeStyle = mat.strokeStyle;
                context.strokeText(this.text, this.position.x, this.position.y);
            }        
        },

        /**
         * Renders the image to the specified context
         * @memberof grease.Text
         * @param context
         * @param offset Offset position determined by parent group
         * @param {number} [scale]
         * @returns {grease.Text}
         */
        render: function (context, offset, scale) {
            this.applyMaterial();
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
    grease.Gradient = function () {

    };






    /**
     * Specifies a group of shapes. Shapes within the group will be positioned and scaled relative to the group
     * @constructor
     * @param position Position of shape
     * @param position.x Horizontal position
     * @param position.y Vertical position
     */
    grease.Group = function () {
        // Call parent constructor
        grease.Shape.call(this);
        this.shapes = [];

    };

    // Group extends Shape
    grease.Group.prototype = Object.create(grease.Shape.prototype);

    _.extend(grease.Group.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.Group
         */
        constructor: grease.Group,

        /**
         * Render the group of shapes
         * @memberof grease.Group
         * @param context
         * @param [offset] Offset position determined by the parent group
         * @param {number} [scale]
         */
        render: function (context, offset, scale) {
            // The group adds its position to provide its children with an offset
            if (offset) {
                offset = {
                    x: offset.x + this.position.x,
                    y: offset.y + this.position.y
                }
            } else {
                offset = this.position;
            }
            scale = scale || 1;
            this.each(function (shape) {
                if (shape.renderable) {
                    shape.render(context, offset, this.scale * scale);
                }
            });
        },

        /**
         * Add an shape, group, or array of shapes to a group
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

            this.each(function (shape, index) {
                if (target === shape) {
                    this.shapes.splice(index, 1);
                }
            });

            return this;

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
                    callback.call(this, shape, index);
                }
            }, this);

            return this;

        },

        /**
         * Creates a representation of the event targets to allow for bubbling in nested group structures
         * @memberof grease.Group
         * @param coords
         * @param {number} scale
         * @returns match
         * @returns {grease.Group} match.group The group that the matching shapes are in
         * @returns {grease.Shape[]} match.shapes The shapes that match the bounds
         */
        testBounds: function (coords, scale) {
            var test,
                scale = this.scale * (scale || 1),
                match = {
                    group: this,
                    shapes: []
                };

            // Offset the event coordinates by the position of the group
            coords.x -= this.position.x;
            coords.y -= this.position.y;


            this.each(function (shape) {
                test = shape.testBounds(coords, scale);
                if (shape instanceof grease.Group) {
                    if (test.shapes.length) {
                        // If the tested shape is a group, add the representation so we can bubble
                        match.shapes.push(test);
                    }
                } else {
                    if (test) {
                        // Otherwise just add the shape
                        match.shapes.push(shape);
                    }
                    
                }
            });

            return match;
        }

    });





    /**
     * Represents a scene, managing the canvas, animation, rendering etc.
     * @constructor
     * @param {string} [selector] - Selector to match an existing canvas element
     */
    grease.Scene = function (selector) {

        // Call parent constructor
        // The position of the scene determines the camera position, the scale determines camera zoom
        grease.Group.call(this);

        this.canvas = new grease.Canvas(selector);
        this.eventManager = new grease.EventManager(this);

        this.shapes = [];

    };

    // Scene extends Group
    grease.Scene.prototype = Object.create(grease.Group.prototype);

    _.extend(grease.Scene.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.Scene
         */
        constructor: grease.Scene,

        /**
         * Start the animation loop
         * @memberof grease.Scene
         * @param {function} userLoop
         * @returns {grease.Scene}
         */
        start: function (userLoop) {
            this.updateFrameInfo();
            if (!this.animating) {
                this.animating = true;
                this.animate(userLoop || this.userLoop);
            }
            return this;
        },

        /**
         * Pause the animation loop
         * @memberof grease.Scene
         * @returns {grease.Scene}
         */
        stop: function () {
            this.animating = false;
            return this;
        },

        /**
         * Internal animation loop
         * @memberof grease.Scene
         * @param {function} userLoop
         * @returns {grease.Scene}
         */
        animate: function (userLoop) {
            var self = this;
            this.userLoop = userLoop;

            if (self.animating) {
                root.requestAnimationFrame(function () {    
                    self.trigger('update', self.frameInfo);
                    self.canvas.clear();
                    self.render(self.canvas.getContext());

                    self.updateFrameInfo();

                    self.animate(userLoop);
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
                }
            } else {
                this.frameInfo.elapsed = now - this.frameInfo.time;
                this.frameInfo.time = now;
                this.frameInfo.frame++;
                this.frameInfo.fps = root.parseInt(1000/this.frameInfo.elapsed);
            }
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
        mouse: [
            'click',
            'mousedown',
            'mouseup',
            'mousemove',
            'dblclick'
        ],
        key: [
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
            _.each(grease.EventManager.events.mouse, function (event) {
                self.scene.canvas.elem.addEventListener(event, function (e) {
                    if (self.captureEvents) {
                        self.findMatches(e);
                    }            
                });
            });

            // Set up window event handlers for key events
            _.each(grease.EventManager.events.key, function (event) {
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
            var offset = this.scene.canvas.offset(),
                coords = {x: e.pageX - offset.left, y: e.pageY - offset.top},
                matchingShapes = this.scene.testBounds(coords),
                bubblePath = this.getBubblePath(matchingShapes);

            _.each(bubblePath.reverse(), function (shape, index) {

                if (index === 0) {
                    e.actualTarget = shape;
                }

                shape.trigger(e.type, e);

            }, this);
            
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
        }

    });


    return grease;


}));