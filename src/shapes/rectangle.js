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
        var insideHorizontally = coords.x >= transform.position.x && coords.x <= transform.position.x + this.width * transform.scale,
            insideVertically = coords.y >= transform.position.y && coords.y <= transform.position.y + this.height * transform.scale;

        return insideHorizontally && insideVertically;
    }

});