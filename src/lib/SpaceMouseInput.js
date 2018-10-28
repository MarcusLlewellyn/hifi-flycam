"use strict";
var Utility = Script.require("./Utility.js?" + Date.now());
var SpacemouseInputs;
(function (SpacemouseInputs) {
    SpacemouseInputs["PanHorizontal"] = "TranslateX";
    SpacemouseInputs["PanVertical"] = "TranslateY";
    SpacemouseInputs["PanLongitude"] = "TranslateZ";
    SpacemouseInputs["Pitch"] = "RotateX";
    SpacemouseInputs["Yaw"] = "RotateY";
    SpacemouseInputs["Roll"] = "RotateZ";
    SpacemouseInputs["RightButton"] = "RightButton";
    SpacemouseInputs["LeftButton"] = "LeftButton";
    SpacemouseInputs["BothButtons"] = "BothButtons";
})(SpacemouseInputs || (SpacemouseInputs = {}));
module.exports = /** @class */ (function () {
    // private mapping: any;                       // controller mapping
    // private inputTimer: Timer;
    function SpacemouseInput(start) {
        this.utility = new Utility(); // various helper methods
        // private class properties
        this.isFirstMove = true; // this will probably go away
        this.firstCameraMode = ""; // flycam off camera mode
        this.isFlyCameraActive = false; // fly camera is active
        this.position = { x: 0, y: 0, z: 0 }; // values from controller inpout
        this.rotation = { x: 0, y: 0, z: 0 }; // values from controller input
        this.utility.isDebug = true;
        this.utility.debugLog("SMI!");
        Script.update.connect(this, "update");
        if (start !== undefined && typeof start === "boolean") {
            this.doInput(true);
        }
        else {
            throw TypeError("Constructor parameter must be a boolean.");
        }
        Script.scriptEnding.connect(this, "destroy");
    }
    SpacemouseInput.prototype.doInput = function (active) {
        active ? this.inputTimer = Script.setInterval(this.interval(), 333) : Script.clearIInterval(this.inputTimer);
    };
    SpacemouseInput.prototype.interval = function () {
        return;
    };
    SpacemouseInput.prototype.update = function (deltaTime) {
        if (Controller.Hardware.Spacemouse === undefined) {
            return;
        }
        for (var input in SpacemouseInputs) {
            if (Controller.getValue(Controller.Hardware.Spacemouse[input])) {
                this.setInputValue(input, Controller.getValue(Controller.Hardware.Spacemouse[input]));
                return;
            }
        }
    };
    SpacemouseInput.prototype.setInputValue = function (input, value) {
        if (input === SpacemouseInputs.PanHorizontal) {
            this.position.x += value;
        }
        if (input === SpacemouseInputs.PanVertical) {
            this.position.y += value;
        }
        if (input === SpacemouseInputs.PanLongitude) {
            this.position.z += value;
        }
        if (input === SpacemouseInputs.Pitch) {
            this.position.x += value;
        }
        if (input === SpacemouseInputs.Yaw) {
            this.rotation.y += value;
        }
        if (input === SpacemouseInputs.Roll) {
            this.position.z += value;
        }
        if (input === SpacemouseInputs.LeftButton) {
            this.onLeftButton();
        }
        if (input === SpacemouseInputs.RightButton) {
            this.onRightButton();
        }
        if (input === SpacemouseInputs.BothButtons) {
            this.onBothButtons();
        }
    };
    SpacemouseInput.prototype.destroy = function () {
        this.doInput(false);
    };
    return SpacemouseInput;
}());
//# sourceMappingURL=SpaceMouseInput.js.map