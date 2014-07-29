/**
 * Represents a material, including information on fill and stroke styles
 * @constructor
 * @param opts Material options
 * @param {string} opts.fillStyle
 * @param {string} opts.strokeStyle
 * @param {number} [opts.lineWidth=0]
 * @param {string} opts.lineCap butt|round|square
 * @param {string} opts.fontFamily Font family to use for text, eg. 'Arial'
 * @param {number} opts.fontSize Size of font as a number
 */
grease.Material = function (opts) {
    this.fillStyle = opts.fillStyle;
    this.strokeStyle = opts.strokeStyle;
    this.lineWidth = opts.lineWidth || 0;
    this.lineCap = opts.lineCap;
    this.fontFamily = opts.fontFamily;
    this.fontSize = opts.fontSize;
};

/**
 * Default material for shapes
 */
grease.defaultMaterial = new grease.Material({
    fillStyle: 'rgb(50, 100, 0)',
    strokeStyle: 0,
    lineWidth: 0,
    fontFamily: 'Arial',
    fontSize: 20
});