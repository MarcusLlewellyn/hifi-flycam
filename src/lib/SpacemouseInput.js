"use strict";
var Utility = Script.require("./Utility.js?" + Date.now());
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Input"] = 0] = "Input";
    MessageType[MessageType["RightButton"] = 1] = "RightButton";
    MessageType[MessageType["LeftButton"] = 2] = "LeftButton";
})(MessageType || (MessageType = {}));
var SpacemouseInputs;
(function (SpacemouseInputs) {
    SpacemouseInputs[SpacemouseInputs["TranslateX"] = 0] = "TranslateX";
    SpacemouseInputs[SpacemouseInputs["TranslateY"] = 1] = "TranslateY";
    SpacemouseInputs[SpacemouseInputs["TranslateZ"] = 2] = "TranslateZ";
    SpacemouseInputs[SpacemouseInputs["RotateX"] = 3] = "RotateX";
    SpacemouseInputs[SpacemouseInputs["RotateY"] = 4] = "RotateY";
    SpacemouseInputs[SpacemouseInputs["RotateZ"] = 5] = "RotateZ";
    SpacemouseInputs[SpacemouseInputs["RightButton"] = 6] = "RightButton";
    SpacemouseInputs[SpacemouseInputs["LeftButton"] = 7] = "LeftButton";
})(SpacemouseInputs || (SpacemouseInputs = {}));
module.exports = /** @class */ (function () {
    function SpacemouseInput() {
        // private class properties
        this.utility = new Utility(); // various helper methods
        this.position = { x: 0, y: 0, z: 0 }; // values from controller inpout
        this.rotation = { x: 0, y: 0, z: 0 }; // values from controller input
        this.utility.isDebug = true;
        this.utility.debugLog("SMI!");
        this.messageChannel = Uuid.generate();
        Script.update.connect(this, "update");
        Script.scriptEnding.connect(this, "destroy");
    }
    Object.defineProperty(SpacemouseInput.prototype, "getPosition", {
        get: function () {
            var result = this.position;
            this.position = Vec3.ZERO;
            return result;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpacemouseInput.prototype, "getRotation", {
        get: function () {
            var result = this.rotation;
            this.rotation = Vec3.ZERO;
            return result;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpacemouseInput.prototype, "Exists", {
        get: function () { return (Controller.Hardware.Spacemouse === undefined) ? true : false; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpacemouseInput.prototype, "MessageChannel", {
        get: function () { return this.messageChannel; },
        enumerable: true,
        configurable: true
    });
    SpacemouseInput.prototype.interval = function () {
        var data = [this.position, this.rotation];
        Messages.sendData(this.messageChannel, data);
        return;
    };
    SpacemouseInput.prototype.update = function (deltaTime) {
        for (var input in SpacemouseInputs) {
            var result = Controller.getValue(Controller.Hardware.Spacemouse[input]);
            // console.log(result.toString());
            // console.log(input);
            if (result) {
                this.setInputValue(input, result);
            }
        }
    };
    SpacemouseInput.prototype.setInputValue = function (input, value) {
        // this.utility.debugLog("setInputValue: " + input + " " + value.toString());
        if (input === "TranslateX") {
            this.position.x += value;
        }
        if (input === "TranslateZ") {
            this.position.y += -value;
        }
        if (input === "TranslateY") {
            this.position.z += value;
        }
        if (input === "RotateX") {
            this.rotation.x += value;
        }
        if (input === "RotateZ") {
            this.rotation.y += -value;
        }
        if (input === "RotateY") {
            this.rotation.z += value;
        }
        // Messages.sendMessage(this.messageChannel, JSON.stringify([MessageType.Input, this.position, this.rotation]));
        // this.position = Vec3.ZERO;
        // this.rotation = Vec3.ZERO;
        if (input === "LeftButton") {
            var data = [MessageType.LeftButton, value];
            // this.utility.debugLog("setInputValue: LeftButton " + JSON.stringify(data));
            Messages.sendMessage(this.messageChannel, JSON.stringify(data));
        }
        if (input === "RightButton") {
            var data = [MessageType.RightButton, value];
            // this.utility.debugLog("setInputValue: RightButton " + JSON.stringify(data));
            Messages.sendMessage(this.messageChannel, JSON.stringify(data));
        }
    };
    SpacemouseInput.prototype.destroy = function () {
        // this.doInput(false);
    };
    return SpacemouseInput;
}());
//# sourceMappingURL=SpacemouseInput.js.map