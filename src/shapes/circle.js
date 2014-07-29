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