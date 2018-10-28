"use strict";
module.exports = /** @class */ (function () {
    function Utility() {
        this.isDebug = false;
        this.noop = 0;
    }
    Utility.prototype.toString = function () {
        return "[Utility isDebug=" + this.isDebug + "]";
    };
    Utility.prototype.sleep = function (milliseconds) {
        var now = Date.now();
        var then = now + milliseconds;
        while (Date.now() <= then) {
            this.noop = 0;
        }
        console.log("slept " + milliseconds.toString());
    };
    Utility.prototype.clamp = function (value, min, max) {
        return Math.min(Math.max(min, value), max);
    };
    Utility.prototype.lerp = function (vector1, vector2, factor) {
        var result = { x: 0, y: 0, z: 0 };
        result.x = vector1.x + (vector2.x - vector1.x) * factor;
        result.y = vector1.y + (vector2.y - vector1.y) * factor;
        result.z = vector1.z + (vector2.z - vector1.z) * factor;
        return result;
    };
    Utility.prototype.debugLog = function (text) {
        if (this.isDebug) {
            console.log(text);
        }
    };
    Utility.prototype.debugVariable = function (label, variable) {
        if (this.isDebug) {
            console.info(label, variable, typeof variable, JSON.stringify(variable));
        }
    };
    return Utility;
}());
//# sourceMappingURL=Utility.js.map