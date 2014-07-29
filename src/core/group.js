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
                throw new TypeError('Attempt to add a non-shape to the group failed.');
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