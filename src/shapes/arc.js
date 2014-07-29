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