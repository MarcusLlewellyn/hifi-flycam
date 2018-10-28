const Utility: any = Script.require("./Utility.js?" + Date.now());
const SpacemouseInput = Script.require("./SpacemouseInput.js?" + Date.now());

enum MessageType {
    Input,
    RightButton,
    LeftButton,
}

export = class FlycamController {

    // constants
    private readonly TRANSLATE_SPEED = 2;   // position speed multiplier
    private readonly ROTATE_SPEED = 5;      // rotate speed is slower
    private readonly DELTA_TIME = 1 / 60;   // a pretend deltatime
    private readonly PITCH_MINIMUM = -80;   // clamp pitch up
    private readonly PITCH_MAXIMUM = 80;    // clamp pitch down

    private input = new SpacemouseInput(true);
    private utility = new Utility();

    private isFirstMove: boolean = true;                // this will probably go away
    private firstCameraMode: string = "third person";   // flycam off camera mode
    private flycameraActive: boolean = false;           // fly camera is active
    private audioFollows: boolean = false;
    private messageChannel: string;
    private cameraEntityID: string;
    private inputTimer: any;
    private updateTimer: any;

    private moveTime: number;
    private moveLength: number;
    private lastPosition: any = { x: 0, y: 0, z: 0 };       // values from controller inpout
    private lastRotation: any = { x: 0, y: 0, z: 0 };       // euler values from controller input
    private currentPosition: any = { x: 0, y: 0, z: 0 };    // values from controller input
    private currentRotation: any = { x: 0, y: 0, z: 0 };    // euler values from controller input

    constructor() {
        this.utility.isDebug = true;
        this.utility.debugLog("FCC!");

        this.messageChannel  = this.input.MessageChannel;
        Messages.subscribe(this.messageChannel);
        Messages.messageReceived.connect(this, "onMessageReceived");
        Script.scriptEnding.connect(this, "destroy");
    }

    private doVisibleCamera(doit: boolean): void {
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
            this.cameraEntityID = Uuid.NULL
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

    private onMessageReceived( channel: string, message: string, sender: string, localOnly: boolean): void {
        // this.utility.debugLog("onMessageReceived: " + JSON.stringify(message));
        if (channel !== this.messageChannel) { return; }

        let messageObject = JSON.parse(message);

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
    }

    private interpolateCamera(): any {
        let distanceMoved: number = (Date.now() - this.moveTime) * this.TRANSLATE_SPEED;
        let fraction: number = distanceMoved / this.moveLength;
        return this.utility.lerp(this.lastPosition, this.currentPosition, fraction);
    }

    private onInput(position: any, rotation: any): void {
        this.currentPosition = Vec3.multiply(position, this.TRANSLATE_SPEED);
        this.currentRotation = Vec3.multiply(rotation, this.ROTATE_SPEED);

        if (this.flycameraActive) { this.updateCamera(); }
    }

    public audioFollowCamera(follows: boolean) {
        if (follows) { MyAvatar.audioListenerMode = MyAvatar.audioListenerModeCamera; }
        else { MyAvatar.audioListenerMode = MyAvatar.audioListenerModeHead; }
    }

    private updateCamera(): void {
        // this.utility.debugLog("updateCamera fired");
        if (!this.flycameraActive) { return; }
        let position = this.interpolateCamera();
        this.move(position);
        this.rotate(this.currentRotation);
        this.updateVisibleCamera();
    }

    private move(position: any): void {
        if (!this.flycameraActive) { return; }
        this.currentPosition = Vec3.multiplyQbyV(Camera.orientation, this.currentPosition);
        this.currentPosition = Vec3.sum(Camera.position, this.currentPosition);
        Camera.setPosition(this.currentPosition);
        // this.lastPosition = this.currentPosition;
        this.currentPosition = Vec3.ZERO;
    }

    private rotate(rotation: any): void {
        if (!this.flycameraActive) { return; }

        this.currentRotation = Vec3.multiplyQbyV(Camera.orientation, this.currentRotation);
        const orientation: any = Quat.multiply(Quat.fromVec3Degrees(this.currentRotation), Camera.orientation);
        const cameraAngles: any = Quat.safeEulerAngles(Quat.cancelOutRoll(orientation));
        cameraAngles.x = this.utility.clamp(cameraAngles.x, this.PITCH_MINIMUM, this.PITCH_MAXIMUM);
        Camera.orientation = Quat.fromPitchYawRollDegrees(cameraAngles.x, cameraAngles.y, cameraAngles.z);
        // this.lastRotation = this.currentRotation;
        this.currentRotation = Vec3.ZERO;
    }

    private toggleFlyCam(): void {
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
        } else {
            // this.firstCameraMode = Camera.getModeString();
            Camera.setModeString("independent");
            this.utility.debugLog("independent");
            this.doVisibleCamera(true);
            this.flycameraActive = true;
            this.utility.sleep(1000);
            this.audioFollowCamera(true);
            this.inputTimer = Script.setInterval(() => this.onInput(this.input.getPosition, this.input.getRotation), 33);
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