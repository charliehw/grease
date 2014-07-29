/**
 * Collection of utility functions
 * @namespace grease.util
 */
grease.util = {

    /**
     * Produce a basic vector object
     * @param {number} [x=0] Horizontal position
     * @param {number} [y=0] Vertical position
     * @returns {object}
     */
    vector: function (x, y) {
        return {
            x: x || 0,
            y: y || 0
        };
    },

    /**
     * Add two vectors together to create a new vector
     * @param {vector} a
     * @param {vector} b
     * @returns {vector}
     */
    addVectors: function (a, b) {
        return grease.util.vector(a.x + b.x, a.y + b.y);
    }

};