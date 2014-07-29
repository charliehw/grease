/**
 * Represents a sprite
 * @constructor
 * @augments grease.Image
 * @param opts Sprite options
 * @see grease.Image options
 * @param {number} [opts.cols] Number of columns in uniform sprite image
 * @param {number} [opts.rows] Number of rows in uniform sprite image
 * @param {number} [opts.cells] Total number of cells in sprite if rows*cols is not appropriate
 * @param {number} [opts.frames] Manually defined frames if the sprite is not uniform 
 * @param {number} [opts.sequences] Definition of sequences for animating the sprite
 */
grease.Sprite = grease.Image.extend({

    /**
     * Actual constructor implementation
     * @memberof grease.Sprite#
     */
    constructor: function (opts) {

        this.rows = opts.rows;
        this.cols = opts.cols;
        this.cells = opts.cells || this.rows * this.cols;

        this.on('load', function () {
            this.width = this.cellWidth = this.width / this.cols;
            this.height = this.cellHeight = this.height / this.rows;
        });

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
            positionInCol = (this.activeCell - positionInRow) / this.cols;

        this.clip = {
            x: positionInRow * this.cellWidth,
            y: positionInCol * this.cellHeight,
            width: this.cellWidth,
            height: this.cellHeight
        };

        grease.Image.prototype.draw.call(this, context, transform);

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