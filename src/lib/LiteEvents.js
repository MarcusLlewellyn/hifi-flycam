"use strict";
module.exports = /** @class */ (function () {
    function LiteEvent() {
        this.handlers = [];
    }
    LiteEvent.prototype.on = function (handler) {
        this.handlers.push(handler);
    };
    LiteEvent.prototype.off = function (handler) {
        this.handlers = this.handlers.filter(function (h) { return h !== handler; });
    };
    LiteEvent.prototype.trigger = function (data) {
        this.handlers.slice(0).forEach(function (h) { return h(data); });
    };
    LiteEvent.prototype.expose = function () {
        return this;
    };
    return LiteEvent;
}());
//# sourceMappingURL=LiteEvents.js.map