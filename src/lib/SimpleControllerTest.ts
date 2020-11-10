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

class ControllerInput {
    inputName: string;
    inputValue: number;
}

class SimpleControllerTest {

    constructor() {
        Script.update.connect(this, "update");
        Script.scriptEnding.connect(this, "destroy");
    }

    private update(deltaTime: number): void {

        let input: ControllerInput[];
        let controllerActions = Controller.Actions;

        if (controllerActions === undefined) { return; }

        console.log(JSON.stringify(controllerActions));
            // let result: ControllerInput = Controller.getValue(Controller.Actions[input]);

            // let result = Controller.Actions[input];
            // console.log(JSON.stringify(result));
            // if (result) { this.setInputValue(input, result); }
        // }
    }

    private destroy(): void {
        Script.update.disconnect(this, "update");
    }

}

class Main {

    private flycam: any;

    constructor() {
        this.flycam = new SimpleControllerTest();
        // this.flycam.audioFollowCamera(true);
    }
}

let entry: Main = new Main();