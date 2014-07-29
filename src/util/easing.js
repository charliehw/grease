/**
 * Collection of easing functions
 * t: current time, b: beginning value, c: change in value, d: duration
 * @namespace grease.easing
 */
grease.easing = {

    /**
     * Linear ease
     */
    linear: function (t, b, c, d) {
        return c*t/d + b;
    },

    /**
     * easeInQuad
     */
    easeInQuad: function (t, b, c, d) {
        t /= d;
        return c*t*t + b;
    },

    /**
     * easeOutQuad
     */
    easeOutQuad: function (t, b, c, d) {
        t /= d;
        return -c * t*(t-2) + b;
    },

    /**
     * easeInOutQuad
     */
    easeInOutQuad: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return c/2*t*t + b;
        }   
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
    },

    /**
     * easeInCubic
     */
    easeInCubic: function (t, b, c, d) {
        t /= d;
        return c*t*t*t + b;
    },

    /**
     * easeOutCubic
     */
    easeOutCubic: function (t, b, c, d) {
        t /= d;
        t--;
        return c*(t*t*t + 1) + b;
    },

    /**
     * easeInOutCubic
     */
    easeInOutCubic: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return c/2*t*t*t + b;
        }
        t -= 2;
        return c/2*(t*t*t + 2) + b;
    },

    /**
     * easeInQuart
     */
    easeInQuart: function (t, b, c, d) {
        t /= d;
        return c*t*t*t*t + b;
    },

    /**
     * easeOutQuart
     */
    easeOutQuart: function (t, b, c, d) {
        t /= d;
        t--;
        return -c * (t*t*t*t - 1) + b;
    },

    /**
     * easeInOutQuart
     */
    easeInOutQuart: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return c/2*t*t*t*t + b;
        }
        t -= 2;
        return -c/2 * (t*t*t*t - 2) + b;
    },

    /**
     * easeInQuint
     */
    easeInQuint: function (t, b, c, d) {
        t /= d;
        return c*t*t*t*t*t + b;
    },

    /**
     * easeOutQuint
     */
    easeOutQuint: function (t, b, c, d) {
        t /= d;
        t--;
        return c*(t*t*t*t*t + 1) + b;
    },

    /**
     * easeInOutQuint
     */
    easeInOutQuint: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return c/2*t*t*t*t*t + b;
        }
        t -= 2;
        return c/2*(t*t*t*t*t + 2) + b;
    },

    /**
     * easeInSine
     */
    easeInSine: function (t, b, c, d) {
        return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
    },

    /**
     * easeOutSine
     */
    easeOutSine: function (t, b, c, d) {
        return c * Math.sin(t/d * (Math.PI/2)) + b;
    },

    /**
     * easeInOutSine
     */
    easeInOutSine: function (t, b, c, d) {
        return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
    },

    /**
     * easeInExpo
     */
    easeInExpo: function (t, b, c, d) {
        return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
    },

    /**
     * easeOutExpo
     */
    easeOutExpo: function (t, b, c, d) {
        return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
    },

    /**
     * easeInOutExpo
     */
    easeInOutExpo: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
        }
        t--;
        return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
    },

    /**
     * easeInCirc
     */
    easeInCirc: function (t, b, c, d) {
        t /= d;
        return -c * (Math.sqrt(1 - t*t) - 1) + b;
    },

    /**
     * easeOutCirc
     */
    easeOutCirc: function (t, b, c, d) {
        t /= d;
        t--;
        return c * Math.sqrt(1 - t*t) + b;
    },

    /**
     * easeInOutCirc
     */
    easeInOutCirc: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
        }
        t -= 2;
        return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
    }

};