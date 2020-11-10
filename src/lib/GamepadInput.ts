const libUtility: any = Script.require("./Utility.js?" + Date.now());

enum MessageType {
    Input,
    Start,
    Back,
    Pan
}

enum GamepadInputs {
    "A",
    "B",
    "X",
    "Y",
    "Start",
    "Back",
    "Select",
    "Circle",
    "Cross",
    "Square",
    "Triangle",
    "DD",
    "Down",
    "DL",
    "Left",
    "DR",
    "Right",
    "DU",
    "Up",
    "L1",
    "R1",
    "L2",
    "R2",
    "L3",
    "R3",
    "LB",
    "RB",
    "LS",
    "LSTouch",
    "RS",
    "RSTouch",
    "LT",
    "LTClick",
    "RT",
    "RTClick",
    "LX",
    "LY",
    "RX",
    "RY",
}

export = class GamepadInput {

    private customMapping = {
        name: "XBox to Custom",
        channels: [
            { from: "GamePad.LY", filters: { type: "deadZone", min: 0.05 }, to: "Gamepad.LY" },
            { from: "GamePad.LX", filters: { type: "deadZone", min: 0.05 }, to: "Gamepad.LX" },
            { from: "GamePad.RY", filters: { type: "deadZone", min: 0.05 }, to: "Gamepad.RY"},
            { from: "GamePad.RX", filters: { type: "deadZone", min: 0.05 }, to: "Gamepad.RX"},

            { from: "GamePad.LT", to: "Gamepad.LT"},
            { from: "GamePad.LT", to: "Gamepad.LT" },
            { from: "GamePad.LB", to: "Gamepad.LB" },
            { from: "GamePad.LS", to: "Gamepad.LS" },

            { from: "GamePad.RT", to: "Gamepad.RT" },
            { from: "GamePad.RT", to: "Gamepad.RT" },
            { from: "GamePad.RB", to: "Gamepad.RB", peek: true },
            { from: "GamePad.RS", to: "Gamepad.RS" },

            { from: "GamePad.Start", to: "Gamepad.Start" },
            { from: "GamePad.Back", to: "Gamepad.Back" },

            { from: "GamePad.DU", to: "Gamepad.DU" },
            { from: "GamePad.DD", to: "Gamepad.DD" },
            { from: "GamePad.DL", to: "Gamepad.DL" },
            { from: "GamePad.DR", to: "Gamepad.DR" },

            { from: "GamePad.A", to: "Gamepad.A" },
            { from: "GamePad.B", to: "Gamepad.B" },
            { from: "GamePad.X", to: "Gamepad.X" },
            { from: "GamePad.Y", to: "Gamepad.Y" }
        ]
    };

    // private class properties
    private utility: any = new libUtility(); // various helper methods
    private messageChannel: string;
    private map: MappingObject;
    private inputInterval: number = 16;
    private intervalHandle: any;
    private position: any = { x: 0, y: 0, z: 0 }; // values from controller inpout
    private rotation: any = { x: 0, y: 0, z: 0 };  // values from controller input

    get deltaPosition() {
        let result = this.position;
        this.position = Vec3.ZERO;
        return result;
    }
    get deltaRotation() {
        let result = this.rotation;
        this.rotation = Vec3.ZERO;
        return result;
    }
    get Exists(): boolean { return (Controller.Standard === undefined) ? true : false; }
    get MessageChannel(): string { return this.messageChannel; }

    constructor() {
        this.utility.isDebug = false;
        this.utility.debugLog("GPI!");
        this.messageChannel = "flycam";

        this.enableCustomMapping();

        this.intervalHandle = Script.setInterval(() => this.onInputInterval(), this.inputInterval);
        // Script.update.connect(this, "update");
        // Controller.captureActionEvents();
        // Controller.inputEvent.connect(this, "onInputEvent");
        // Controller.actionEvent.connect(this, "onActionEvent");
        Script.scriptEnding.connect(this, "destroy");
    }

    enableCustomMapping() {
        console.log("stringifying map");
        let mapFromJSON: string = JSON.stringify(this.customMapping);
        console.log("parsing map");
        this.map = Controller.parseMapping(mapFromJSON);
        console.log("enable map");
        this.map.enable();
    }

    onActionEvent(action: string, value: number): void {
        this.utility.debugLog("onActionEvent: " + action + " " + value.toString());
    }

    onInputEvent(input: string, value: number): void {
        this.utility.debugLog("onInputEvent: " + input + " " + value.toString());
    }

    private onInputInterval(): void {
        for (let input in GamepadInputs) {
            let result = Controller.getValue(Controller.Hardware.GamePad[input]);
            if (result) { this.setInputValue(input, result); }
        }
    }

    private update(deltaTime: number): void {
        for (let input in GamepadInputs) {
            let result = Controller.getValue(Controller.Hardware.GamePad[input]);
            if (result) { this.setInputValue(input, result); }
        }
    }

    private sendMessage(msg: string): void {
        let message: string = "";
        message = JSON.stringify([MessageType.Input, this.position, this.rotation]);
        Messages.sendMessage(this.messageChannel, message);
        message = "";
    }

    private setInputValue(input: string, value: number): void {
        this.utility.debugLog("setInputValue: " + input + " " + value.toString());

        if (input === "LX") { this.position.x += value; }
        // if (input === "DU") { this.position.y += -value; }
        if (input === "LT") { this.position.y += value; }
        if (input === "RT") { this.position.y += -value; }
        if (input === "LY") { this.position.z += value; }
        if (input === "RY") { this.rotation.x += -value; }
        if (input === "RX") { this.rotation.y += -value; }
        if (input === "DU") { this.position.y += 0.1; }
        if (input === "DD") { this.position.y -= 0.1; }
        if (input === "DL") { this.position.x -= 0.1; }
        if (input === "DR") { this.position.x = 0.1; }

        Messages.sendMessage(this.messageChannel, JSON.stringify([MessageType.Input, this.position, this.rotation]));
        this.position = Vec3.ZERO;
        this.rotation = Vec3.ZERO;

        if (input === "Start") {
            const data: any[] = [MessageType.Start, value];
            // this.utility.debugLog("setInputValue: LeftButton " + JSON.stringify(data));
            Messages.sendMessage(this.messageChannel, JSON.stringify(data));
        }
        if (input === "Back") {
            const data: any[] = [MessageType.Back, value];
            // this.utility.debugLog("setInputValue: RightButton " + JSON.stringify(data));
            Messages.sendMessage(this.messageChannel, JSON.stringify(data));
        }
    }

    private destroy(): void {
        // Controller.releaseActionEvents();
        this.map.disable();
        Controller.actionEvent.disconnect(this, "onActionEvent");
        Controller.inputEvent.disconnect(this, "onInputEvent");
        Script.clearInterval(this.intervalHandle);
        Script.update.disconnect(this, "update");
    }
};
