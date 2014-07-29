/**
 * Represents a gradient for use in a material
 * @constructor
 * @param opts - Gradient options
 * @param opts.type - grease.Gradient.RADIAL_GRADIENT|grease.Gradient.LINEAR_GRADIENT
 * @throws {TypeError} Gradient constructor must be provided a valid type
 */
grease.Gradient = function (opts) {
    if (opts.type === grease.Gradient.LINEAR_GRADIENT) {

    } else if (opts.type === grease.Gradient.RADIAL_GRADIENT) {

    } else {
        throw new TypeError('No valid type provided for gradient creation.');
    }
};


grease.Gradient.RADIAL_GRADIENT = 'radial';
grease.Gradient.LINEAR_GRADIENT = 'linear';