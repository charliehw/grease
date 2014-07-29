/**
 * 2D animation framework for HTML canvas
 * @file grease.js
 * @requires underscore.js
 * @author charliehw
 * @version 0.0.1
 * @license MIT
 * @todo Gradient materials
 * @todo Transformation - rotation, proper scaling
 * @todo Sprites - custom frames and sequences
 * @todo Dirty flags - no need to calculate the absolute transform for a shape that hasn't changed since the last frame
 * @todo Optimise event checking by just working out what the mouse is interacting with each frame, rather than checking on every mouse event (thanks Toby)
 */

(function (root, factory) {
 
    // Environment setup taken from Backbone.js
    // Start with AMD
    if (typeof define === 'function' && define.amd) {

        define(['underscore', 'exports'], function (_, exports) {
            root.grease = factory(root, exports, _);
        });
 
    // Next for Node.js or CommonJS
    } else if (typeof exports !== 'undefined') {

        var _ = require('underscore');
        factory(root, exports, _);

    // Finally, as a browser global
    } else {

        /**
         * @namespace grease
         */
        root.grease = factory(root, {}, root._);

    }

}(this, function (root, grease, _) {

'use strict';

var doc = root.document,
    math = root.Math,
    date = root.Date;


grease.version = '0.0.1';


/**
 * Shim for requestAnimationFrame
 */
root.requestAnimationFrame = (function () {
    return root.requestAnimationFrame || root.webkitRequestAnimationFrame || root.mozRequestAnimationFrame || function (callback) {
        root.setTimeout(callback, 1000 / 60);
    };
}());