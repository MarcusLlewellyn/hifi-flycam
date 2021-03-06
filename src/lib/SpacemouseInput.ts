
const libUtility: any = Script.require("./Utility.js?" + Date.now());

enum MessageType {
    Input,
    RightButton,
    LeftButton,
}

enum SpacemouseInputs {
    TranslateX,
    TranslateY,
    TranslateZ,
    RotateX,
    RotateY,
    RotateZ,
    RightButton,
    LeftButton,
}

export = class SpacemouseInput {

    // private class properties
    private utility: any = new libUtility(); // various helper methods
    private messageChannel: string;
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
    get Exists(): boolean { return (Controller.Hardware.Spacemouse === undefined) ? true : false; }
    get MessageChannel(): string { return this.messageChannel; }

    constructor() {
        this.utility.isDebug = true;
        this.utility.debugLog("SMI!");

        this.messageChannel = "";
        Script.update.connect(this, "update");
        Script.scriptEnding.connect(this, "destroy");
    }

    private update(deltaTime: number): void {
        for (let input in SpacemouseInputs) {
            let result = Controller.getValue(Controller.Actions[input]);
            if (result) { this.setInputValue(input, result); }
        }
    }

    private setInputValue(input: string, value: number): void {
        this.utility.debugLog("setInputValue: " + input + " " + value.toString());
        if (input === "TranslateX") { this.position.x += value; }
        if (input === "TranslateZ") { this.position.y += -value; }
        if (input === "TranslateY") { this.position.z += value; }
        if (input === "RotateX") { this.rotation.x += value; }
        if (input === "RotateZ") { this.rotation.y += -value; }
        if (input === "RotateY") { this.rotation.z += value; }

        // Messages.sendMessage(this.messageChannel, JSON.stringify([MessageType.Input, this.position, this.rotation]));
        this.position = Vec3.ZERO;
        this.rotation = Vec3.ZERO;

        if (input === "LeftButton") {
            const data: any[] = [MessageType.LeftButton, value];
            this.utility.debugLog("setInputValue: LeftButton " + JSON.stringify(data));
            Messages.sendMessage(this.messageChannel, JSON.stringify(data));
        }
        if (input === "RightButton") {
            const data: any[] = [MessageType.RightButton, value];
            this.utility.debugLog("setInputValue: RightButton " + JSON.stringify(data));
            Messages.sendMessage(this.messageChannel, JSON.stringify(data));
        }
    }

    private destroy(): void {
        Script.update.disconnect(this, "update");
    }
};
