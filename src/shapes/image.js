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

        this.elem.onload = this.onload.bind(this);
        this.elem.src = opts.src;

        // Where to clip the image if necessary
        this.clip = opts.clip;

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
     * @returns {grease.Image}
     */
    draw: function (context, transform) {
        if (this.clip) {
            context.drawImage(this.elem, this.clip.x, this.clip.y, this.clip.width, this.clip.height, transform.position.x, transform.position.y, this.width * transform.scale, this.height * transform.scale);
        } else {
            context.drawImage(this.elem, transform.position.x, transform.position.y, this.width * transform.scale, this.height * transform.scale);                
        }
        return this;
    }

});