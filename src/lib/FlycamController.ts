const libUtility: any = Script.require("./Utility.js?" + Date.now());
const libSpacemouseInput = Script.require("./SpacemouseInput.js?" + Date.now());

enum MessageType {
    Input,
    RightButton,
    LeftButton,
}

export = class FlycamController {

    // constants
    private readonly EPSILON = 0.01;
    private readonly TRANSLATE_SPEED = 2;   // position speed multiplier
    private readonly ROTATE_SPEED = 5;      // rotate speed is slower
    private readonly UPDATE_TIME = 1000;      // 30 fps
    private readonly PITCH_MINIMUM = -80;   // clamp pitch up
    private readonly PITCH_MAXIMUM = 80;    // clamp pitch down

    private input = new libSpacemouseInput(true);
    private utility = new libUtility();

    // private isFirstMove = true;                // this will probably go away
    private firstCameraMode = "third person";   // flycam off camera mode
    private flycameraActive = false;           // fly camera is active
    private audioFollows = false;
    private messageChannel: string;
    private cameraEntityID: string;
    private inputTimer: any;
    private updateTimer: any;

    private startTime: number;
    private moveLength: number;
    private startPosition: any = { x: 0, y: 0, z: 0 };       // values from controller inpout
    private startRotation: any = { x: 0, y: 0, z: 0 };       // euler values from controller input
    private targetPosition: any = { x: 0, y: 0, z: 0 };    // values from controller input
    private targetRotation: any = { x: 0, y: 0, z: 0 };    // euler values from controller input

    constructor() {
        this.utility.isDebug = true;
        this.utility.debugLog("FCC!");
        this.startTime = Date.now() / 1000;
        this.messageChannel  = this.input.MessageChannel;
        Messages.subscribe(this.messageChannel);
        Messages.messageReceived.connect(this, "onMessageReceived");
        Script.scriptEnding.connect(this, "destroy");
    }

    private updateTransform(): void {
        return;
    }

    private doVisibleCamera(doit: boolean): void {
        // TODO: z in position should be -1?
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
        } else {
            Entities.deleteEntity(this.cameraEntityID);
            this.cameraEntityID = Uuid.NULL;
        }
    }

    private updateVisibleCamera() {
        if (this.cameraEntityID === Uuid.NULL) { return; }

        let cameraEntity: any = Quat.safeEulerAngles(Camera.orientation);
        // cameraEntity = cameraEntity.y + 180;

        Entities.editEntity(this.cameraEntityID, {
            position: { x: Camera.position.x, y: Camera.position.y, z: Camera.position.z },
            rotation: Camera.orientation
        });
    }

    private onMessageReceived(channel: string, message: string, sender: string, localOnly: boolean): void {
        // this.utility.debugLog("onMessageReceived: " + JSON.stringify(message));
        if (channel !== this.messageChannel) { return; }

        let messageObject = JSON.parse(message);

        switch (messageObject[0]) {
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
    }

    public audioFollowCamera(follows: boolean) {
        if (follows) { MyAvatar.audioListenerMode = MyAvatar.audioListenerModeCamera; }
        else { MyAvatar.audioListenerMode = MyAvatar.audioListenerModeHead; }
    }

    private interpolateCameraPosition(): any {
        let distanceMoved: number = ((Date.now() / 1000) - this.startTime) * this.TRANSLATE_SPEED;
        let fraction: number = distanceMoved / this.moveLength;
        // return this.utility.lerp(this.startPosition, this.targetPosition, fraction);
        this.utility.debugLog("fraction: " + fraction.toString());
        this.utility.debugLog("lerp: " + JSON.stringify(Vec3.mix(this.startPosition, this.targetPosition, fraction)));
        return Vec3.mix(this.startPosition, this.targetPosition, fraction);
    }

    private onInput(position: any, rotation: any): void {
        this.utility.debugLog("onInput entered");
        this.startPosition = position;
        this.startRotation = rotation;
        this.targetPosition = Vec3.sum(position, this.input.PositionDelta); // Vec3.multiply(position, this.TRANSLATE_SPEED);
        this.targetRotation = rotation; // Vec3.multiply(rotation, this.ROTATE_SPEED);
        this.moveLength = Vec3.distance(this.startPosition, this.targetPosition);
        this.startTime = Date.now() / 1000;

        if (this.flycameraActive) {
            this.utility.debugLog("updateCamera updateTimer starting");
            this.updateTimer = Script.setInterval(() => this.updateCamera(), this.UPDATE_TIME);
        }
    }

    private updateCamera(): void {
        // this.utility.debugLog("updateCamera fired");
        if (!this.flycameraActive) { return; }
        let lerpPosition = this.interpolateCameraPosition();
        this.utility.debugLog("positions: " + JSON.stringify(this.startPosition) + " " + JSON.stringify(lerpPosition) + " " + JSON.stringify(this.targetPosition));
        if (Vec3.withinEpsilon(lerpPosition, this.targetPosition, this.EPSILON)) {
            this.utility.debugLog("epsilon");
            this.startPosition = this.targetPosition;
            this.targetPosition = Vec3.sum(this.startPosition, this.input.PositionDelta);
            // this.moveTime = Date.now();
        } else {
            this.utility.debugLog("!epsilon");
            this.move(lerpPosition);
            this.rotate(this.targetRotation);
            this.updateVisibleCamera();
        }
    }

    private move(position: any): void {
        if (!this.flycameraActive) { return; }
        position = Vec3.multiplyQbyV(Camera.orientation, position);
        position = Vec3.sum(Camera.position, position);
        Camera.setPosition(position);
    }

    private rotate(rotation: any): void {
        if (!this.flycameraActive) { return; }

        this.targetRotation = Vec3.multiplyQbyV(Camera.orientation, this.targetRotation);
        const orientation: any = Quat.multiply(Quat.fromVec3Degrees(this.targetRotation), Camera.orientation);
        const cameraAngles: any = Quat.safeEulerAngles(Quat.cancelOutRoll(orientation));
        cameraAngles.x = this.utility.clamp(cameraAngles.x, this.PITCH_MINIMUM, this.PITCH_MAXIMUM);
        Camera.orientation = Quat.fromPitchYawRollDegrees(cameraAngles.x, cameraAngles.y, cameraAngles.z);
        // this.lastRotation = this.targetRotation;
        this.targetRotation = Vec3.ZERO;
    }

    private toggleFlyCam(): void {
        this.utility.debugLog("toggleFlyCam entered");
        Messages.messageReceived.disconnect(this, "onMessageReceived");
        if (this.flycameraActive) {
            Script.clearInterval(this.updateTimer);
            this.doVisibleCamera(false);
            Camera.setModeString(this.firstCameraMode);
            this.utility.debugLog(this.firstCameraMode);
            this.flycameraActive = false;
            this.targetPosition = Vec3.ZERO;
            this.targetRotation = Vec3.ZERO;
            this.audioFollowCamera(false);
            this.utility.sleep(1000);
        } else {
            // this.firstCameraMode = Camera.getModeString();
            Camera.setModeString("independent");
            this.utility.debugLog("independent");
            this.doVisibleCamera(true);
            this.flycameraActive = true;
            this.utility.sleep(1000);
            this.audioFollowCamera(true);
            // this.inputTimer = Script.setInterval(() => this.onInput(this.input.PositionDelta, this.input.RotationDelta), 33);
            this.onInput(Camera.position, Quat.safeEulerAngles(Camera.orientation));
        }
        Messages.messageReceived.connect(this, "onMessageReceived");
    }

    private destroy() {
        this.doVisibleCamera(false);
        Messages.unsubscribe(this.messageChannel);
        Messages.messageReceived.disconnect(this, "onMessageReceived");
        Script.clearInterval(this.inputTimer);
        Camera.setModeString(this.firstCameraMode);
    }
};
