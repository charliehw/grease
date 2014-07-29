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