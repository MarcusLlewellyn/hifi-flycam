"use strict";
var Utility = Script.require("./Utility.js?" + Date.now());
var SpacemouseInput = Script.require("./SpacemouseInput.js?" + Date.now());
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Input"] = 0] = "Input";
    MessageType[MessageType["RightButton"] = 1] = "RightButton";
    MessageType[MessageType["LeftButton"] = 2] = "LeftButton";
})(MessageType || (MessageType = {}));
module.exports = /** @class */ (function () {
    function FlycamController() {
        // constants
        this.TRANSLATE_SPEED = 2; // position speed multiplier
        this.ROTATE_SPEED = 5; // rotate speed is slower
        this.DELTA_TIME = 1 / 60; // a pretend deltatime
        this.PITCH_MINIMUM = -80; // clamp pitch up
        this.PITCH_MAXIMUM = 80; // clamp pitch down
        this.input = new SpacemouseInput(true);
        this.utility = new Utility();
        this.isFirstMove = true; // this will probably go away
        this.firstCameraMode = "third person"; // flycam off camera mode
        this.flycameraActive = false; // fly camera is active
        this.audioFollows = false;
        this.lastPosition = { x: 0, y: 0, z: 0 }; // values from controller inpout
        this.lastRotation = { x: 0, y: 0, z: 0 }; // euler values from controller input
        this.currentPosition = { x: 0, y: 0, z: 0 }; // values from controller input
        this.currentRotation = { x: 0, y: 0, z: 0 }; // euler values from controller input
        this.utility.isDebug = true;
        this.utility.debugLog("FCC!");
        this.messageChannel = this.input.MessageChannel;
        Messages.subscribe(this.messageChannel);
        Messages.messageReceived.connect(this, "onMessageReceived");
        Script.scriptEnding.connect(this, "destroy");
    }
    FlycamController.prototype.doVisibleCamera = function (doit) {
        if (doit) {
            this.cameraEntityID = Entities.addEntity({
                name: "FlyCamera",
                type: "Model",
                collisionNask: 1,
                position: Vec3.sum(Camera.position, Vec3.multiplyQbyV(Camera.orientation, { x: 0, y: 0, z: 1 })),
                rotation: Camera.orientation,
                dimensions: { x: 0.1, y: 0.1, z: 0.1 },
                registrationPoint: { x: 0, y: 0, z: 0 },
                modelURL: "https://mikeybailey.org/hifi/Objects/CamBot_000.fbx#",
                userData: "{\"grabbableKey\": {\"wantsTrigger\": false}}"
            }, true);
        }
        else {
            Entities.deleteEntity(this.cameraEntityID);
            this.cameraEntityID = Uuid.NULL;
        }
    };
    FlycamController.prototype.updateVisibleCamera = function () {
        if (this.cameraEntityID === Uuid.NULL) {
            return;
        }
        var cameraEntity = Quat.safeEulerAngles(Camera.orientation);
        // cameraEntity = cameraEntity.y + 180;
        Entities.editEntity(this.cameraEntityID, {
            position: { x: Camera.position.x, y: Camera.position.y, z: Camera.position.z },
            rotation: Camera.orientation
        });
    };
    FlycamController.prototype.onMessageReceived = function (channel, message, sender, localOnly) {
        // this.utility.debugLog("onMessageReceived: " + JSON.stringify(message));
        if (channel !== this.messageChannel) {
            return;
        }
        var messageObject = JSON.parse(message);
        switch (messageObject[0]) {
            // case MessageType.Input: {
            //    if (this.flycameraActive) { this.onInput(messageObject[1], messageObject[2]); }
            //    break;
            // }
            case MessageType.LeftButton: {
                this.toggleFlyCam();
                break;
            }
            case MessageType.RightButton: {
                // this.onRightButton();
                break;
            }
        }
        messageObject = undefined;
    };
    FlycamController.prototype.interpolateCamera = function () {
        var distanceMoved = (Date.now() - this.moveTime) * this.TRANSLATE_SPEED;
        var fraction = distanceMoved / this.moveLength;
        return this.utility.lerp(this.lastPosition, this.currentPosition, fraction);
    };
    FlycamController.prototype.onInput = function (position, rotation) {
        this.currentPosition = Vec3.multiply(position, this.TRANSLATE_SPEED);
        this.currentRotation = Vec3.multiply(rotation, this.ROTATE_SPEED);
        if (this.flycameraActive) {
            this.updateCamera();
        }
    };
    FlycamController.prototype.audioFollowCamera = function (follows) {
        if (follows) {
            MyAvatar.audioListenerMode = MyAvatar.audioListenerModeCamera;
        }
        else {
            MyAvatar.audioListenerMode = MyAvatar.audioListenerModeHead;
        }
    };
    FlycamController.prototype.updateCamera = function () {
        // this.utility.debugLog("updateCamera fired");
        if (!this.flycameraActive) {
            return;
        }
        var position = this.interpolateCamera();
        this.move(position);
        this.rotate(this.currentRotation);
        this.updateVisibleCamera();
    };
    FlycamController.prototype.move = function (position) {
        if (!this.flycameraActive) {
            return;
        }
        this.currentPosition = Vec3.multiplyQbyV(Camera.orientation, this.currentPosition);
        this.currentPosition = Vec3.sum(Camera.position, this.currentPosition);
        Camera.setPosition(this.currentPosition);
        // this.lastPosition = this.currentPosition;
        this.currentPosition = Vec3.ZERO;
    };
    FlycamController.prototype.rotate = function (rotation) {
        if (!this.flycameraActive) {
            return;
        }
        this.currentRotation = Vec3.multiplyQbyV(Camera.orientation, this.currentRotation);
        var orientation = Quat.multiply(Quat.fromVec3Degrees(this.currentRotation), Camera.orientation);
        var cameraAngles = Quat.safeEulerAngles(Quat.cancelOutRoll(orientation));
        cameraAngles.x = this.utility.clamp(cameraAngles.x, this.PITCH_MINIMUM, this.PITCH_MAXIMUM);
        Camera.orientation = Quat.fromPitchYawRollDegrees(cameraAngles.x, cameraAngles.y, cameraAngles.z);
        // this.lastRotation = this.currentRotation;
        this.currentRotation = Vec3.ZERO;
    };
    FlycamController.prototype.toggleFlyCam = function () {
        var _this = this;
        this.utility.debugLog("onFlyCam fired");
        Messages.messageReceived.disconnect(this, "onMessageReceived");
        if (this.flycameraActive) {
            this.doVisibleCamera(false);
            Camera.setModeString(this.firstCameraMode);
            this.utility.debugLog(this.firstCameraMode);
            this.flycameraActive = false;
            this.currentPosition = Vec3.ZERO;
            this.currentRotation = Vec3.ZERO;
            this.audioFollowCamera(false);
            Script.clearInterval(this.inputTimer);
            this.utility.sleep(1000);
        }
        else {
            // this.firstCameraMode = Camera.getModeString();
            Camera.setModeString("independent");
            this.utility.debugLog("independent");
            this.doVisibleCamera(true);
            this.flycameraActive = true;
            this.utility.sleep(1000);
            this.audioFollowCamera(true);
            this.inputTimer = Script.setInterval(function () { return _this.onInput(_this.input.getPosition, _this.input.getRotation); }, 33);
        }
        Messages.messageReceived.connect(this, "onMessageReceived");
    };
    FlycamController.prototype.destroy = function () {
        this.doVisibleCamera(false);
        Messages.unsubscribe(this.messageChannel);
        Messages.messageReceived.disconnect(this, "onMessageReceived");
        Script.clearInterval(this.inputTimer);
        Camera.setModeString(this.firstCameraMode);
    };
    return FlycamController;
}());
//# sourceMappingURL=FlycamController.js.map