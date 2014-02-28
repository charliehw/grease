/* global define, require, exports */

/**
 * Framework for working with canvas
 * @file grease.js
 * @author charliehw
 * @version 0.0.0
 * @todo Images, Lines, Gradients, Clipping, Transformation
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


    grease.version = '0.0.0';


    root.requestAnimationFrame = (function(){
        return root.requestAnimationFrame || root.webkitRequestAnimationFrame || root.mozRequestAnimationFrame || function( callback ){
            root.setTimeout(callback, 1000 / 60);
        };
    }());


    /**
     * Basic subclass drawable entity
     * @constructor
     * @param position Position of the entity
     * @param position.x Horizontal position
     * @param position.y Vertical position
     * @param {grease.Material} [material]
     */
    grease.Entity = function (position, material) {
        this.renderFlag = true;
        this.position = position || {x: 0, y: 0};
        this.material = material || grease.defaultMaterial;
        this.scale = 1;

        this.events = {};
        // States used by the event manager
        this.states = [];
    };

    _.extend(grease.Entity.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.Entity
         */
        constructor: grease.Entity,

        /**
         * Apply the material to the canvas, called whilst the entity being rendered
         * @memberof grease.Entity
         * @param context
         * @returns {grease.Entity}
         */
        applyMaterial: function (context, scale) {
            var mat = this.material;
            if (mat.fillStyle) {
                context.fillStyle = mat.fillStyle;
                context.fill();
            }
            if (mat.lineWidth) {
                context.lineWidth = mat.lineWidth * scale;
            }
            if (mat.strokeStyle) {
                context.strokeStyle = mat.strokeStyle;
                context.stroke();
            }
            return this;
        },

        /**
         * Defines an event handler
         * @memberof grease.Entity
         * @param {string} event
         * @param {function} handler
         * @returns {grease.Entity}
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
         * @memberof grease.Entity
         * @param {string} [event] - Removes handlers for a specific event
         * @param {function} [handler] - Removes a specific handler for a specific event
         * @returns {grease.Entity}
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
         * @memberof grease.Entity
         * @param {string} type - Event type being triggered
         * @param {event} e - Removes a specific handler for a specific event
         * @param data
         * @returns {grease.Entity}
         */
        trigger: function (type, e, data) {
            _.each(this.events[type], function (handler) {
                handler.call(this, e, data)
            }, this);
            return this;
        },

        /**
         * Unless the entity has bounds set against it, this should be implemented by a specific shape
         * @memberof grease.Entity
         * @param coords
         * @returns {boolean}
         */
        testBounds: function (coords) {
            if (this.bounds) {
                return this.bounds.testBounds(coords);
            }
        },

        /**
         * Move the entity's position. Animate if duration supplied
         * @memberof grease.Entity
         * @param position Position to move to or line to follow
         * @param {number} duration Duration of animated movement
         * @param {function} easing
         * @returns grease.Entity
         * @throws {TypeError} Position provided is not valid
         */
        moveTo: function (position, duration, easing) {
            if (duration) {
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
         * @memberof grease.Entity
         */
        transform: function () {

        }

    });




    /**
     * Represents a rectangle to be drawn
     * @constructor
     * @param position Position of the rectangle
     * @param position.x Horizontal position
     * @param position.y Vertical position
     * @param size Size of the rectangle
     * @param size.w Width
     * @param size.h Height
     * @param {grease.Material} [material]
     */
    grease.Rectangle = function (position, size, material) {
        // Call parent constructor
        grease.Entity.call(this, position, material);
        this.size = size || {w: 0, h: 0};
    };

    // Rectangle extends Entity
    grease.Rectangle.prototype = Object.create(grease.Entity.prototype);

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
            context.rect(this.position.x + offset.x, this.position.y + offset.y, this.size.w, this.size.h);
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
            var horizontal = coords.x >= this.position.x && coords.x <= this.position.x + this.size.w,
                vertical = coords.y >= this.position.y && coords.y <= this.position.y + this.size.h;

            return horizontal && vertical;
        }

    });


    /**
     * Represents an arc to be drawn
     * @constructor
     * @param position Position of the rectangle
     * @param position.x Horizontal position
     * @param position.y Vertical position
     * @param {number} radius Radius of the arc
     * @param {number} startAngle Angle to start the arc path from
     * @param {number} endAngle Angle to end the arc path
     * @param {grease.Material} [material]
     * @param {boolean} [direction] Draw path counter clockwise?
     */
    grease.Arc = function (position, radius, startAngle, endAngle, material, direction) {
        // Call parent constructor
        grease.Entity.call(this, position, material);
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.direction = direction || false;
    };

    // Arc extends Entity
    grease.Arc.prototype = Object.create(grease.Entity.prototype);

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
     * @param position Position of the rectangle
     * @param position.x Horizontal position
     * @param position.y Vertical position
     * @param {number} radius Radius of the circle
     * @param {grease.Material} [material]
     */
    grease.Circle = function (position, radius, material) {
        // Call parent constructor
        grease.Arc.call(this, position, radius, 0, math.PI*2, material);
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
     */
    grease.Line = function () {
        this.points = [];
    };



    /**
     * Loads an image for use in a scene
     * @constructor
     */
    grease.Image = function () {

    };




    /**
     * Represents a material, including information on fill and stroke styles
     * @constructor
     * @param opts Material options
     * @param {string} opts.fillStyle
     * @param {string} opts.strokeStyle
     * @param {number} opts.lineWidth
     */
    grease.Material = function (opts) {
        this.fillStyle = opts.fillStyle;
        this.strokeStyle = opts.strokeStyle;
        this.lineWidth = opts.lineWidth || 0;
    };

    /**
     * Default material for entities
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
     * Specifies a group of entities. Entities within the group will be positioned and scaled relative to the group
     * @constructor
     * @param position Position of entity
     * @param position.x Horizontal position
     * @param position.y Vertical position
     */
    grease.Group = function (position) {
        // Call parent constructor
        grease.Entity.call(this, position);
        this.entities = [];

    };

    // Group extends Entity
    grease.Group.prototype = Object.create(grease.Entity.prototype);

    _.extend(grease.Group.prototype, {

        /**
         * Reference to constructor
         * @memberof grease.Group
         */
        constructor: grease.Group,

        /**
         * Render the group of entities
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
            this.each(function (entity) {
                if (entity.renderFlag) {
                    entity.render(context, offset, this.scale * scale);
                }
            });
        },

        /**
         * Add an entity, group, or array of entities to a group
         * @memberof grease.Group
         * @param {(grease.Entity|grease.Entity[])} target
         * @param {number} [zindex]
         * @returns {grease.Group}
         * @throws {TypeError} Only entities can be added to groups
         */
        add: function (target, zindex) {

            // Expect first argument as array or each argument as individual entity
            var givenEntities = _.isArray(target) ? target : [target];

            _.each(givenEntities, function (entity) {
                if (entity instanceof grease.Entity) {
                    // If a zindex is supplied, add the entity or entities at the supplied index, 
                    // pushing forward any entities already at or above that index
                    if (zindex) {
                        this.entities.splice(zindex++, 0, entity);
                    } else {
                        this.entities.push(entity);                  
                    }
                } else {
                    throw new TypeError('Attempt to add a non-entity to the ' + typeof this + ' failed.');
                }
            }, this);

            return this;

        },

        /**
         * Remove a specified entity from the group
         * @memberof grease.Group
         * @param {grease.Entity} target
         * @returns {grease.Group}
         */
        remove: function (target) {

            this.each(function (entity, index) {
                if (target === entity) {
                    this.entities.splice(index, 1);
                }
            });

            return this;

        },

        /**
         * Iterates over the group and calls the function passed to it, supplying entity and index and arguments
         * @memberof grease.Group
         * @param {function} callback
         * @returns {grease.Group}
         */
        each: function (callback) {

            _.each(this.entities, function (entity, index) {
                if (entity) {
                    callback.call(this, entity, index);
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
         * @returns {grease.Group} match.group The group that the matching entities are in
         * @returns {grease.Entity[]} match.entities The entities that match the bounds
         */
        testBounds: function (coords, scale) {
            var test,
                scale = this.scale * (scale || 1),
                match = {
                    group: this,
                    entities: []
                };

            // Offset the event coordinates by the position of the group
            coords.x -= this.position.x;
            coords.y -= this.position.y;


            this.each(function (entity) {
                test = entity.testBounds(coords, scale);
                if (entity instanceof grease.Group) {
                    if (test.entities.length) {
                        // If the tested entity is a group, add the representation so we can bubble
                        match.entities.push(test);
                    }
                } else {
                    if (test) {
                        // Otherwise just add the entity
                        match.entities.push(entity);
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
        grease.Group.call(this, {x: 0, y: 0});

        this.canvas = new grease.Canvas(selector);
        this.eventManager = new grease.EventManager(this);

        this.entities = [];

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
                    self.trigger('frame', self.frameInfo);
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
            'mouseover',
            'mouseout',
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
         * Find all entities matching the coordinates of the event
         * @memberof grease.EventManager
         */
        findMatches: function (e) {
            var offset = this.scene.canvas.offset(),
                coords = {x: e.pageX - offset.left, y: e.pageY - offset.top},
                matchingEntities = this.scene.testBounds(coords),
                bubblePath = this.getBubblePath(matchingEntities);

            _.each(bubblePath.reverse(), function (entity, index) {

                if (index === 0) {
                    e.actualTarget = entity;
                }

                entity.trigger(e.type, e);

            }, this);
            
        },

        /**
         * Reformat the matches into an array ordered for bubbling
         * @memberof grease.EventManager
         */
        getBubblePath: function (entity, path) {
            path = path || [];

            if (entity.group) {
                path.push(entity.group);
                if (entity.entities.length) {
                    this.getBubblePath(entity.entities[entity.entities.length - 1], path);                 
                }
            } else {
                path.push(entity);
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