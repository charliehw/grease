/**
 * Represents a canvas element
 * @constructor
 * @param {HTMLElement} container
 * @param {number} width
 * @param {number} height
 */
grease.Canvas = function (container, width, height) {

    this.elem = doc.createElement('canvas');

    this.elem.width = width;
    this.elem.height = height;

    container.appendChild(this.elem);

};

_.extend(grease.Canvas.prototype, {

    /**
     * Reference to constructor
     * @memberof grease.Canvas#
     */
    constructor: grease.Canvas,

    /**
     * Get the drawing context, either from cache or from the HTML element
     * @memberof grease.Canvas#
     * @param [type='2d']
     * @returns {CanvasContext}
     */
    context: function (type) {
        if (!this._context || type) {
            this._context = this.elem.getContext(type || '2d');
        }
        return this._context;
    },

    /**
     * Clear the canvas
     * @memberof grease.Canvas#
     * @param [coords]
     * @returns {grease.Canvas}
     */
    clear: function (coords) {
        coords = coords || {
            x: 0,
            y: 0,
            width: this.width(),
            height: this.height()
        };

        this.context().clearRect(coords.x, coords.y, coords.width, coords.height);
        return this;
    },

    /**
     * Returns the coordinates of the center point in the canvas
     * @memberof grease.Canvas#
     * @returns {object}
     */
    centerPoint: function () {
        return {
            x: math.floor(this.width() / 2),
            y: math.floor(this.height() / 2)
        };
    },

    /**
     * Get or set the width of the canvas
     * @memberof grease.Canvas#
     * @param {number} [width]
     * @returns {number|grease.Canvas}
     */
    width: function (width) {
        if (_.isUndefined(width)) {
            return this.elem.width;
        } else {
            this.elem.width = width;
            return this;
        }
    },

    /**
     * Get or set the height of the canvas
     * @memberof grease.Canvas#
     * @param {number} [height]
     * @returns {number|grease.Canvas}
     */
    height: function (height) {
        if (_.isUndefined(height)) {
            return this.elem.height;
        } else {
            this.elem.height = height;
            return this;
        }
    },

    /**
     * Remove the canvas from the document
     * @memberof grease.Canvas#
     * @returns {grease.Canvas}
     */
    destroy: function () {
        this.elem.parentElement.removeChild(this.elem);
        return this;
    },

    /**
     * Hide the canvas
     * @memberof grease.Canvas#
     * @returns {grease.Canvas}
     */
    hide: function () {
        this.elem.style.display = 'none';
        return this;
    },

    /**
     * Show the canvas
     * @memberof grease.Canvas#
     * @returns {grease.Canvas}
     */
    show: function () {
        this.elem.style.display = 'block';
        return this;
    }

});