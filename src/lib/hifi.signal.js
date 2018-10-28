//
// signal.js
// A module that simulates QT style signals.
//
// Copyright humbletim 2017
//
// Licensed under the Apache 2.0 License
// See accompanying license file or http://apache.org/
//

"use strict";
/* eslint-env commonjs */
/* eslint-disable comma-dangle, brace-style, camelcase, no-empty */

module.exports = signal;
signal.version = '0.0.1';

// @function - Qt signal polyfill
function signal(template) {
    var callbacks = [];
    return Object.defineProperties(function() {
        var args = [].slice.call(arguments);
        callbacks.forEach(function(obj) {
            obj.handler.apply(obj.scope, args);
        });
    }, {
        connect: { value: function(scope, handler) {
            var callback = {scope: scope, handler: scope[handler] || handler || scope};
            if (!callback.handler || !callback.handler.apply) {
                throw new Error('invalid arguments to connect:' + [template, scope, handler]);
            }
            callbacks.push({scope: scope, handler: scope[handler] || handler || scope});
        }},
        disconnect: { value: function(scope, handler) {
            var match = {scope: scope, handler: scope[handler] || handler || scope};
            callbacks = callbacks.filter(function(obj) {
                return !(obj.scope === match.scope && obj.handler === match.handler);
            });
        }}
    });
}
