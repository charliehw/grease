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